'use client';
import React, { useEffect } from 'react';
import { Badge, Fab, Tooltip, Zoom, useMediaQuery, useScrollTrigger, useTheme } from '@mui/material';
import { EditNoteOutlined as NotesIcon } from '@mui/icons-material';
import { useAuth } from '../../utils/auth';
import { useQuickNotes } from './QuickNotesProvider';

// Botón flotante de las notas rápidas (ver FLOWS.md, flujo de Notas rápidas): el acceso global,
// disponible en cualquier pantalla del dashboard para cargar o mirar notas sin salir de lo que se
// está haciendo.
//
// Pensado para no molestar:
// - Chico y en la esquina; con `no-print` para que no salga en las impresiones de los listados.
// - En mobile se esconde al scrollear hacia abajo y vuelve al subir (useScrollTrigger con
//   hysteresis: trigger = "va bajando"), para no tapar los botones de la última card de un listado.
// - Se oculta mientras el panel está abierto: el panel ya lo tapa y dos controles de lo mismo
//   serían ruido.
// - El numerito rojo cuenta solo lo que apremia (vencidas + para hoy), no el total de pendientes:
//   un contador de "17 notas" que nunca baja se aprende a ignorar.

const FAB_GRADIENT = 'linear-gradient(135deg, #60a5fa 0%, #1d4ed8 100%)';
const FAB_GRADIENT_HOVER = 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)';

// Dónde NO se dispara el atajo: si el usuario está escribiendo en cualquier campo, Alt+N podría
// chocar con lo que esté haciendo (en Mac, Option+N es un carácter dead-key para la ñ/˜).
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export default function QuickNotesFab() {
  const theme = useTheme();
  const { user } = useAuth();
  const userId = (user as unknown as Record<string, unknown>)?.id as number | undefined;
  const { panelOpen, openPanel, overdueOrTodayCount } = useQuickNotes();

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  // En touch no se enfoca el campo al abrir: el teclado taparía la mitad de la lista, y desde el
  // botón flotante también se entra a MIRAR las notas.
  const hasFinePointer = useMediaQuery('(pointer: fine)');
  const scrolledDown = useScrollTrigger({ threshold: 120 });

  const hidden = panelOpen || (isMobile && scrolledDown);

  // Atajo de teclado (solo desktop tiene teclado físico de forma confiable): Alt+N abre el panel
  // con el foco en el campo. Usa event.code y no event.key porque con Alt apretado `key` cambia
  // según el layout (en Mac da "˜").
  useEffect(() => {
    if (!userId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.code !== 'KeyN') return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      openPanel({ focusInput: true });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [userId, openPanel]);

  if (!userId) return null;

  return (
    <Zoom in={!hidden} unmountOnExit>
      <Badge
        className="no-print"
        badgeContent={overdueOrTodayCount}
        color="error"
        max={99}
        overlap="circular"
        sx={{
          position: 'fixed',
          right: { xs: 16, md: 24 },
          bottom: { xs: 16, md: 24 },
          // Debajo de los modales (1300) y del drawer (1200) pero sobre el contenido y el AppBar.
          zIndex: 1150,
          // El numerito tiene que quedar POR ENCIMA del botón: el Fab trae su propio z-index
          // (theme.zIndex.fab = 1050) y el del badge por defecto es 1, así que quedaba tapado.
          '& .MuiBadge-badge': { zIndex: theme.zIndex.fab + 1 },
        }}
      >
        <Tooltip title="Notas rápidas (Alt+N)" placement="left">
          <Fab
            color="primary"
            aria-label="Abrir notas rápidas"
            onClick={() => openPanel({ focusInput: hasFinePointer })}
            sx={{
              background: FAB_GRADIENT,
              boxShadow: '0 4px 14px rgba(29, 78, 216, 0.4)',
              '&:hover': { background: FAB_GRADIENT_HOVER },
            }}
          >
            <NotesIcon />
          </Fab>
        </Tooltip>
      </Badge>
    </Zoom>
  );
}
