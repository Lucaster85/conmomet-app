'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertViewService } from '../../utils/api';
import { AlertType, AlertItemRef } from '../../utils/alerts';
import { useAuth } from '../../utils/auth';

// Estado compartido del acuse de vista de los avisos del tablero (ver FLOWS.md §36).
//
// Lo que este provider SÍ centraliza: las vistas del usuario (UNA sola llamada a
// GET /me/alert-views para toda la banda, en vez de una por tarjeta) y el registro de los totales
// que la barra de resumen necesita.
//
// Lo que deliberadamente NO centraliza: los datos de los avisos. Cada tarjeta sigue siendo dueña
// de su propio fetch y de su propio chequeo de permiso, igual que antes de este flujo. Un
// endpoint único tipo GET /me/dashboard-alerts daría una UX más prolija (los chips no aparecerían
// de a uno), pero obligaría a concentrar en un solo controller la lógica de permisos de 6 módulos
// distintos — ver la nota en FLOWS.md §36.

export interface AlertSummary {
  type: AlertType;
  label: string;
  /** Total SIN filtrar por vistos: es el "tenés 7 PC asignados" que el chip debe mostrar siempre. */
  total: number;
  /** Módulo al que lleva el chip. Sin href (ej. Vencimientos, que no tiene módulo propio) el chip
   *  es solo informativo. */
  href?: string;
  color?: 'info' | 'warning' | 'error' | 'primary' | 'success';
}

interface AlertViewsContextValue {
  loading: boolean;
  /** true si ese item ya fue visto Y nada relevante cambió desde entonces. */
  isSeen: (type: AlertType, entityId: number, revision: string) => boolean;
  markSeen: (type: AlertType, items: AlertItemRef[]) => Promise<void>;
  resetSeen: (type: AlertType) => Promise<void>;
  registerSummary: (summary: AlertSummary) => void;
  summaries: AlertSummary[];
}

const AlertViewsContext = createContext<AlertViewsContextValue | null>(null);

const viewKey = (type: AlertType, entityId: number) => `${type}:${entityId}`;

export function AlertViewsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = (user as unknown as Record<string, unknown>)?.id as number | undefined;

  // key `${alert_type}:${entity_id}` → revisión con la que se marcó visto.
  const [seen, setSeen] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<AlertSummary[]>([]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    AlertViewService.getAll()
      .then((views) => {
        if (cancelled) return;
        const next: Record<string, string> = {};
        for (const v of views) next[viewKey(v.alert_type, v.entity_id)] = v.revision;
        setSeen(next);
      })
      // Silencioso a propósito: si falla, se muestran todos los items sin filtrar. Degrada al
      // comportamiento anterior a este flujo, no deja el tablero vacío ni roto.
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId]);

  const isSeen = useCallback(
    (type: AlertType, entityId: number, revision: string) => seen[viewKey(type, entityId)] === revision,
    [seen]
  );

  // Optimista: el item sale del detalle al instante y el POST va atrás. Si el POST falla, la
  // próxima carga lo trae de vuelta — mismo criterio que tenía el descarte de
  // SalaryAdvanceDeletionAlert antes de unificarse acá.
  const markSeen = useCallback(async (type: AlertType, items: AlertItemRef[]) => {
    if (items.length === 0) return;
    setSeen((prev) => {
      const next = { ...prev };
      for (const item of items) next[viewKey(type, item.entity_id)] = item.revision;
      return next;
    });
    try {
      await AlertViewService.markSeen(type, items);
    } catch {
      setSeen((prev) => {
        const next = { ...prev };
        for (const item of items) delete next[viewKey(type, item.entity_id)];
        return next;
      });
    }
  }, []);

  const resetSeen = useCallback(async (type: AlertType) => {
    const previous = seen;
    setSeen((prev) => {
      const next: Record<string, string> = {};
      for (const [key, revision] of Object.entries(prev)) {
        if (!key.startsWith(`${type}:`)) next[key] = revision;
      }
      return next;
    });
    try {
      await AlertViewService.reset(type);
    } catch {
      setSeen(previous);
    }
  }, [seen]);

  // Cada tarjeta se registra cuando termina de cargar; la barra renderiza lo que haya. Un total
  // de 0 se registra igual y la barra lo omite — así un aviso que pasa de 3 a 0 desaparece del
  // resumen en vez de quedar pegado con el número viejo.
  const registerSummary = useCallback((summary: AlertSummary) => {
    setSummaries((prev) => {
      const existing = prev.find((s) => s.type === summary.type);
      if (existing && existing.total === summary.total && existing.label === summary.label) return prev;
      return [...prev.filter((s) => s.type !== summary.type), summary];
    });
  }, []);

  const value = useMemo(
    () => ({ loading, isSeen, markSeen, resetSeen, registerSummary, summaries }),
    [loading, isSeen, markSeen, resetSeen, registerSummary, summaries]
  );

  return <AlertViewsContext.Provider value={value}>{children}</AlertViewsContext.Provider>;
}

/**
 * Las tarjetas de aviso usan esto. Devuelve `null` si no hay provider montado, y en ese caso el
 * aviso se comporta como antes de este flujo: muestra todo, sin acuse de vista. Eso mantiene a
 * los avisos usables fuera del tablero (el portal del empleado monta RepairToolsAlert) sin
 * obligar a que todo árbol que los use tenga el provider.
 */
export function useAlertViews(): AlertViewsContextValue | null {
  return useContext(AlertViewsContext);
}

/**
 * Registra el total de un aviso en la barra de resumen. Se llama con el total SIN filtrar por
 * vistos — es el "PC pendientes: 7" que tiene que seguir visible aunque estén todos marcados.
 */
export function useRegisterAlertSummary(summary: AlertSummary | null) {
  const ctx = useAlertViews();
  const register = ctx?.registerSummary;
  // Serializado: el objeto se recrea en cada render de la tarjeta, así que comparar por
  // referencia dispararía el efecto infinitamente.
  const serialized = summary ? JSON.stringify(summary) : null;
  const lastRef = useRef<string | null>(null);

  useEffect(() => {
    if (!register || !serialized) return;
    if (lastRef.current === serialized) return;
    lastRef.current = serialized;
    register(JSON.parse(serialized) as AlertSummary);
  }, [register, serialized]);
}
