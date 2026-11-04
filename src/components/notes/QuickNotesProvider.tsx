'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { QuickNote, QuickNoteChanges, QuickNoteEntity, QuickNoteService } from '../../utils/api';
import { useAuth } from '../../utils/auth';
import { countOverdueOrToday, sortPending } from '../../utils/quickNotes';

// Estado compartido de las notas rápidas (ver FLOWS.md, flujo de Notas rápidas).
//
// UNA sola carga (GET /me/quick-notes) la comparten el botón flotante, el panel lateral y, en la
// etapa 2, el widget de Inicio — por eso vive en un provider y no en cada componente.
//
// 🔴 El BORRADOR del campo de texto vive acá y no en el panel: el panel se cierra con un click en
// el backdrop, y si el texto viviera en el estado del propio panel un click accidental fuera
// descartaría lo que el usuario estaba escribiendo. Es la misma preocupación que dio origen a
// AppDialog, resuelta conservando el estado en vez de bloqueando el cierre.
//
// Las acciones sobre notas existentes son OPTIMISTAS (la UI cambia al instante y el request va
// atrás; si falla se revierte y se avisa), mismo criterio que NotificationBell. La creación no:
// necesita el id que asigna el servidor, así que se limpia el borrador al toque y se restaura si
// falla.

export interface QuickNotesToast {
  /** Cambia en cada aviso nuevo, para que el Snackbar se reinicie aunque el texto sea el mismo. */
  key: number;
  message: string;
  severity: 'info' | 'error';
  undo?: () => void;
}

interface OpenPanelOptions {
  /** Pone el foco en el campo de texto al abrir. En touch conviene no hacerlo: sube el teclado. */
  focusInput?: boolean;
  /** Vínculo a futuro: la pantalla que abre el panel puede precargar a qué registro pertenece la
   *  nota. Hoy ninguna lo usa y la API lo rechazaría. */
  entity?: Pick<QuickNoteEntity, 'type' | 'id'> | null;
}

interface QuickNotesContextValue {
  pending: QuickNote[];
  completed: QuickNote[];
  loading: boolean;
  loadError: boolean;
  /** Pendientes vencidas o para hoy: el numerito rojo del botón flotante. */
  overdueOrTodayCount: number;
  reload: () => Promise<void>;

  panelOpen: boolean;
  openPanel: (options?: OpenPanelOptions) => void;
  closePanel: () => void;
  /** Se incrementa cada vez que hay que enfocar el campo; el panel reacciona al cambio. */
  focusRequest: number;

  draft: string;
  setDraft: (value: string) => void;
  draftDue: string | null;
  setDraftDue: (value: string | null) => void;
  saving: boolean;
  /** Guarda el borrador como nota nueva. Devuelve false si no hay nada que guardar. */
  submitDraft: () => Promise<boolean>;

  toggleComplete: (note: QuickNote) => Promise<void>;
  update: (note: QuickNote, changes: Pick<QuickNoteChanges, 'content' | 'due_date'>) => Promise<boolean>;
  remove: (note: QuickNote) => Promise<void>;

  toast: QuickNotesToast | null;
  dismissToast: () => void;
}

const QuickNotesContext = createContext<QuickNotesContextValue | null>(null);

export function QuickNotesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = (user as unknown as Record<string, unknown>)?.id as number | undefined;

  const [pending, setPending] = useState<QuickNote[]>([]);
  const [completed, setCompleted] = useState<QuickNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [panelOpen, setPanelOpen] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);

  const [draft, setDraft] = useState('');
  const [draftDue, setDraftDue] = useState<string | null>(null);
  const [draftEntity, setDraftEntity] = useState<OpenPanelOptions['entity']>(null);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<QuickNotesToast | null>(null);
  const toastKey = useRef(0);

  // Refs que leen los callbacks sin tener que re-crearse en cada render.
  const pendingRef = useRef(pending);
  const completedRef = useRef(completed);
  pendingRef.current = pending;
  completedRef.current = completed;
  // Respuestas de GET viejas se descartan, y mientras haya una mutación en vuelo no se pisa el
  // estado optimista con una lectura que todavía no la refleja.
  const loadSeq = useRef(0);
  const inFlight = useRef(0);

  const showToast = useCallback((message: string, severity: 'info' | 'error' = 'info', undo?: () => void) => {
    toastKey.current += 1;
    setToast({ key: toastKey.current, message, severity, undo });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  const reload = useCallback(async () => {
    if (!userId) return;
    const seq = ++loadSeq.current;
    try {
      const list = await QuickNoteService.getAll();
      if (seq !== loadSeq.current || inFlight.current > 0) return;
      setPending(list.pending);
      setCompleted(list.completed);
      setLoadError(false);
    } catch {
      if (seq === loadSeq.current) setLoadError(true);
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    reload();
  }, [userId, reload]);

  // Refresco sin polling: al volver la pestaña al foco (las notas pueden haberse tocado desde otro
  // dispositivo) y al abrir el panel. Mismo criterio que NotificationBell.
  useEffect(() => {
    if (!userId) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') reload();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [userId, reload]);

  const openPanel = useCallback((options: OpenPanelOptions = {}) => {
    if (options.entity !== undefined) setDraftEntity(options.entity);
    setPanelOpen(true);
    if (options.focusInput) setFocusRequest((n) => n + 1);
    reload();
  }, [reload]);

  const closePanel = useCallback(() => setPanelOpen(false), []);

  // Mueve una nota (con los datos que devolvió el servidor) a la lista que le corresponde.
  const applyServerNote = useCallback((note: QuickNote) => {
    setPending((prev) => {
      const without = prev.filter((n) => n.id !== note.id);
      return note.completed_at ? without : sortPending([...without, note]);
    });
    setCompleted((prev) => {
      const without = prev.filter((n) => n.id !== note.id);
      if (!note.completed_at) return without;
      return [...without, note].sort((a, b) => (a.completed_at! < b.completed_at! ? 1 : -1));
    });
  }, []);

  const withInFlight = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    inFlight.current += 1;
    try {
      return await fn();
    } finally {
      inFlight.current -= 1;
    }
  }, []);

  const submitDraft = useCallback(async () => {
    const content = draft.trim();
    if (!content || saving) return false;
    const due = draftDue;
    const entity = draftEntity;

    setSaving(true);
    setDraft('');
    setDraftDue(null);
    try {
      const note = await withInFlight(() => QuickNoteService.create({ content, due_date: due, entity }));
      applyServerNote(note);
      setDraftEntity(null);
      return true;
    } catch (e) {
      // Se devuelve lo que el usuario había escrito — salvo que ya haya empezado otra nota.
      setDraft((current) => (current === '' ? content : current));
      setDraftDue((current) => current ?? due);
      showToast(e instanceof Error ? e.message : 'Error al guardar la nota', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  }, [draft, draftDue, draftEntity, saving, applyServerNote, showToast, withInFlight]);

  const restoreSnapshot = useCallback((p: QuickNote[], c: QuickNote[]) => {
    setPending(p);
    setCompleted(c);
  }, []);

  const toggleComplete = useCallback(async (note: QuickNote) => {
    const willComplete = !note.completed_at;
    const snapshot = { p: pendingRef.current, c: completedRef.current };

    // Optimista: la nota cambia de lista al instante.
    applyServerNote({ ...note, completed_at: willComplete ? new Date().toISOString() : null });

    try {
      const saved = await withInFlight(() => QuickNoteService.update(note.id, { completed: willComplete }));
      applyServerNote(saved);
      if (willComplete) {
        showToast('Nota completada', 'info', () => {
          void toggleCompleteRef.current(saved);
        });
      }
    } catch (e) {
      restoreSnapshot(snapshot.p, snapshot.c);
      showToast(e instanceof Error ? e.message : 'Error al actualizar la nota', 'error');
    }
  }, [applyServerNote, restoreSnapshot, showToast, withInFlight]);
  // "Deshacer" de completar vuelve a llamar a toggleComplete: se accede por ref para que el
  // closure del toast no quede atado a una versión vieja del callback.
  const toggleCompleteRef = useRef(toggleComplete);
  toggleCompleteRef.current = toggleComplete;

  const update = useCallback(async (note: QuickNote, changes: Pick<QuickNoteChanges, 'content' | 'due_date'>) => {
    const snapshot = { p: pendingRef.current, c: completedRef.current };
    applyServerNote({ ...note, ...changes });
    try {
      const saved = await withInFlight(() => QuickNoteService.update(note.id, changes));
      applyServerNote(saved);
      return true;
    } catch (e) {
      restoreSnapshot(snapshot.p, snapshot.c);
      showToast(e instanceof Error ? e.message : 'Error al actualizar la nota', 'error');
      return false;
    }
  }, [applyServerNote, restoreSnapshot, showToast, withInFlight]);

  const remove = useCallback(async (note: QuickNote) => {
    const snapshot = { p: pendingRef.current, c: completedRef.current };
    setPending((prev) => prev.filter((n) => n.id !== note.id));
    setCompleted((prev) => prev.filter((n) => n.id !== note.id));

    try {
      await withInFlight(() => QuickNoteService.remove(note.id));
      showToast('Nota eliminada', 'info', () => {
        // Deshacer: se reinserta ya y se restaura en el servidor atrás.
        applyServerNote(note);
        void withInFlight(() => QuickNoteService.restore(note.id))
          .then(applyServerNote)
          .catch((e) => {
            setPending((prev) => prev.filter((n) => n.id !== note.id));
            setCompleted((prev) => prev.filter((n) => n.id !== note.id));
            showToast(e instanceof Error ? e.message : 'Error al restaurar la nota', 'error');
          });
      });
    } catch (e) {
      restoreSnapshot(snapshot.p, snapshot.c);
      showToast(e instanceof Error ? e.message : 'Error al eliminar la nota', 'error');
    }
  }, [applyServerNote, restoreSnapshot, showToast, withInFlight]);

  const overdueOrTodayCount = useMemo(() => countOverdueOrToday(pending), [pending]);

  const value = useMemo<QuickNotesContextValue>(
    () => ({
      pending, completed, loading, loadError, overdueOrTodayCount, reload,
      panelOpen, openPanel, closePanel, focusRequest,
      draft, setDraft, draftDue, setDraftDue, saving, submitDraft,
      toggleComplete, update, remove,
      toast, dismissToast,
    }),
    [
      pending, completed, loading, loadError, overdueOrTodayCount, reload,
      panelOpen, openPanel, closePanel, focusRequest,
      draft, draftDue, saving, submitDraft,
      toggleComplete, update, remove,
      toast, dismissToast,
    ]
  );

  return <QuickNotesContext.Provider value={value}>{children}</QuickNotesContext.Provider>;
}

export function useQuickNotes(): QuickNotesContextValue {
  const ctx = useContext(QuickNotesContext);
  if (!ctx) throw new Error('useQuickNotes debe usarse dentro de <QuickNotesProvider>');
  return ctx;
}
