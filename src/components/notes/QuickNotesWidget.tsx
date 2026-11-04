'use client';
import React from 'react';
import { Box, Button, Checkbox, Chip, Paper, Stack, Typography, useMediaQuery } from '@mui/material';
import {
  AddOutlined as AddIcon,
  EditNoteOutlined as NotesIcon,
  EventOutlined as EventIcon,
} from '@mui/icons-material';
import GearSpinner from '../GearSpinner';
import { dueChipColor, dueLabel, dueState } from '../../utils/quickNotes';
import { useQuickNotes } from './QuickNotesProvider';

// Widget "Mis notas" de la pantalla de Inicio (ver FLOWS.md §48, etapa 2): las pendientes del
// usuario a la vista, sin tener que abrir el panel. Es solo una ventana a lo que ya carga el
// QuickNotesProvider — no hace ningún fetch propio, así que completar una nota acá o en el panel
// se refleja en los dos al instante.
//
// Muestra pocas a propósito (el panel es el lugar para gestionarlas todas). Como el provider ya
// las trae ordenadas, las vencidas y las de hoy quedan primero sin hacer nada.

const MAX_VISIBLE = 5;

export default function QuickNotesWidget() {
  const { pending, loading, loadError, reload, toggleComplete, openPanel } = useQuickNotes();
  // En touch no se enfoca el campo al abrir: el teclado taparía la lista.
  const hasFinePointer = useMediaQuery('(pointer: fine)');

  const visible = pending.slice(0, MAX_VISIBLE);

  return (
    <Paper
      sx={{
        flex: '1 1 300px',
        p: 3,
        borderRadius: 2,
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
        },
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <NotesIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1 }}>
          Mis notas
        </Typography>
        {pending.length > 0 && <Chip label={pending.length} size="small" color="primary" variant="outlined" />}
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={2}><GearSpinner size={28} /></Box>
      ) : loadError && pending.length === 0 ? (
        <Box textAlign="center" py={1}>
          <Typography variant="body2" color="text.secondary" mb={1.5}>
            No se pudieron cargar las notas.
          </Typography>
          <Button size="small" variant="outlined" onClick={() => void reload()}>Reintentar</Button>
        </Box>
      ) : visible.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          No tenés notas pendientes.
        </Typography>
      ) : (
        <Stack spacing={0.5}>
          {visible.map((note) => {
            const state = dueState(note.due_date);
            return (
              <Box key={note.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <Checkbox
                  size="small"
                  checked={false}
                  onChange={() => toggleComplete(note)}
                  inputProps={{ 'aria-label': 'Marcar la nota como completada' }}
                  sx={{ mt: -0.25 }}
                />
                {/* Tocar el texto abre el panel, que es donde se edita: acá no hay edición en el lugar. */}
                <Box
                  onClick={() => openPanel()}
                  sx={{ flex: 1, minWidth: 0, pt: 0.75, cursor: 'pointer' }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      wordBreak: 'break-word',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {note.content}
                  </Typography>
                  {note.due_date && (
                    <Chip
                      size="small"
                      icon={<EventIcon />}
                      label={dueLabel(note.due_date)}
                      color={dueChipColor(state)}
                      variant={state === 'upcoming' ? 'outlined' : 'filled'}
                      sx={{ mt: 0.5 }}
                    />
                  )}
                </Box>
              </Box>
            );
          })}
        </Stack>
      )}

      {!loading && !(loadError && pending.length === 0) && (
        <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => openPanel({ focusInput: hasFinePointer })}
          >
            Nueva nota
          </Button>
          {pending.length > 0 && (
            <Button size="small" onClick={() => openPanel()}>
              Ver todas ({pending.length})
            </Button>
          )}
        </Stack>
      )}
    </Paper>
  );
}
