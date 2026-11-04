'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, Chip, Collapse, DialogActions, DialogContent, DialogTitle, Divider,
  Drawer, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Snackbar, Stack, TextField,
  Typography, useMediaQuery,
} from '@mui/material';
import {
  CloseOutlined as CloseIcon,
  DeleteOutlineOutlined as DeleteIcon,
  EditNoteOutlined as NotesIcon,
  EventBusyOutlined as ClearDateIcon,
  EventOutlined as EventIcon,
  ExpandLessOutlined as ExpandLess,
  ExpandMoreOutlined as ExpandMore,
  MoreVertOutlined as MoreIcon,
  SendOutlined as SendIcon,
} from '@mui/icons-material';
import AppDialog from '../common/AppDialog';
import DateField from '../DateField';
import GearSpinner from '../GearSpinner';
import { QuickNote } from '../../utils/api';
import { dueChipColor, dueLabel, dueState, formatDueDate, todayKey, tomorrowKey } from '../../utils/quickNotes';
import { useQuickNotes } from './QuickNotesProvider';

// Panel lateral de las notas rápidas (ver FLOWS.md, flujo de Notas rápidas). Se abre desde el
// botón flotante (o Alt+N) sin sacar al usuario de la pantalla en la que está: arriba el campo
// para cargar, abajo los pendientes y, colapsadas, las completadas.
//
// Es la MISMA lista en mobile y en desktop (en mobile ocupa toda la pantalla): no es un listado de
// módulo con tabla, así que la regla de cards-vs-tabla de CLAUDE.md no aplica acá.

const MAX_LENGTH = 2000;
// Desde cuántos caracteres se muestra el contador: antes de eso es ruido.
const COUNTER_FROM = 1800;

// ───────────────────────────── Vencimiento: diálogo ─────────────────────────────

function DueDateDialog({ note, onClose }: { note: QuickNote; onClose: () => void }) {
  const { update } = useQuickNotes();
  const [value, setValue] = useState(note.due_date ?? '');

  const handleSave = async () => {
    onClose();
    const next = value || null;
    if (next !== note.due_date) await update(note, { due_date: next });
  };

  return (
    <AppDialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Vencimiento de la nota</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <DateField label="Vence el" value={value} onChange={setValue} fullWidth />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave}>Guardar</Button>
      </DialogActions>
    </AppDialog>
  );
}

// ───────────────────────────── Fila de nota pendiente ─────────────────────────────

function PendingNoteRow({ note, onPickDate }: { note: QuickNote; onPickDate: (note: QuickNote) => void }) {
  const { toggleComplete, update, remove } = useQuickNotes();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.content);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  // Escape cancela la edición, pero al desmontar el campo no tiene que guardarse como si fuera un blur.
  const cancelled = useRef(false);

  const state = dueState(note.due_date);

  const startEditing = () => {
    cancelled.current = false;
    setText(note.content);
    setEditing(true);
  };

  const commit = async () => {
    if (cancelled.current) return;
    const next = text.trim();
    setEditing(false);
    // Un texto vacío NO elimina la nota (sería fácil de hacer sin querer): se descarta la edición.
    if (!next || next === note.content) {
      setText(note.content);
      return;
    }
    await update(note, { content: next });
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, px: 1.5, py: 1 }}>
      <Checkbox
        checked={false}
        onChange={() => toggleComplete(note)}
        inputProps={{ 'aria-label': 'Marcar la nota como completada' }}
        sx={{ mt: -0.25 }}
      />
      <Box sx={{ flex: 1, minWidth: 0, pt: 0.75 }}>
        {editing ? (
          <TextField
            autoFocus
            multiline
            fullWidth
            size="small"
            maxRows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                cancelled.current = true;
                setText(note.content);
                setEditing(false);
              } else if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            slotProps={{ htmlInput: { maxLength: MAX_LENGTH, 'aria-label': 'Editar la nota' } }}
          />
        ) : (
          <Typography
            variant="body2"
            onClick={startEditing}
            sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', cursor: 'text' }}
          >
            {note.content}
          </Typography>
        )}
        {note.due_date && !editing && (
          <Chip
            size="small"
            icon={<EventIcon />}
            label={dueLabel(note.due_date)}
            color={dueChipColor(state)}
            variant={state === 'upcoming' ? 'outlined' : 'filled'}
            onClick={() => onPickDate(note)}
            sx={{ mt: 0.75 }}
          />
        )}
      </Box>
      <IconButton
        size="small"
        aria-label="Opciones de la nota"
        onClick={(e) => setMenuAnchor(e.currentTarget)}
      >
        <MoreIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => { setMenuAnchor(null); onPickDate(note); }}>
          <ListItemIcon><EventIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{note.due_date ? 'Cambiar vencimiento' : 'Poner vencimiento'}</ListItemText>
        </MenuItem>
        {note.due_date && (
          <MenuItem onClick={() => { setMenuAnchor(null); void update(note, { due_date: null }); }}>
            <ListItemIcon><ClearDateIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Quitar vencimiento</ListItemText>
          </MenuItem>
        )}
        {/* Sin confirmación a propósito: eliminar muestra "Deshacer", que es menos fricción y igual de seguro. */}
        <MenuItem onClick={() => { setMenuAnchor(null); void remove(note); }} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'inherit' }}><DeleteIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}

// ───────────────────────────── Fila de nota completada ─────────────────────────────

function CompletedNoteRow({ note }: { note: QuickNote }) {
  const { toggleComplete, remove } = useQuickNotes();

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, px: 1.5, py: 1 }}>
      <Checkbox
        checked
        onChange={() => toggleComplete(note)}
        inputProps={{ 'aria-label': 'Reabrir la nota' }}
        sx={{ mt: -0.25 }}
      />
      <Box sx={{ flex: 1, minWidth: 0, pt: 0.75 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', textDecoration: 'line-through' }}
        >
          {note.content}
        </Typography>
        {note.completed_at && (
          <Typography variant="caption" color="text.disabled">
            Completada el {new Date(note.completed_at).toLocaleDateString('es-AR')}
          </Typography>
        )}
      </Box>
      <IconButton size="small" aria-label="Eliminar la nota" onClick={() => remove(note)}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

// ───────────────────────────── Panel ─────────────────────────────

export default function QuickNotesDrawer() {
  const {
    pending, completed, loading, loadError, reload,
    panelOpen, closePanel, focusRequest,
    draft, setDraft, draftDue, setDraftDue, saving, submitDraft,
    toast, dismissToast,
  } = useQuickNotes();

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasFinePointer = useMediaQuery('(pointer: fine)');
  const [showCompleted, setShowCompleted] = useState(false);
  const [pickingDate, setPickingDate] = useState(false);
  const [dueDialogNote, setDueDialogNote] = useState<QuickNote | null>(null);

  // El foco se pide con un contador (no un booleano) para que Alt+N con el panel ya abierto
  // también devuelva el foco al campo. El delay deja terminar la animación del Drawer: enfocar
  // antes hace que el navegador intente scrollear un elemento que todavía está fuera de pantalla.
  useEffect(() => {
    if (!panelOpen || focusRequest === 0) return;
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, [panelOpen, focusRequest]);

  const today = todayKey();
  const tomorrow = tomorrowKey();
  const hasCustomDue = !!draftDue && draftDue !== today && draftDue !== tomorrow;

  const handleSubmit = async () => {
    const ok = await submitDraft();
    // Con mouse, después de agregar se sigue escribiendo; en touch no se fuerza el teclado.
    if (ok && hasFinePointer) inputRef.current?.focus();
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={panelOpen}
        onClose={closePanel}
        className="no-print"
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 400 }, maxWidth: '100%' } } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Cabecera */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <NotesIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1 }}>Mis notas</Typography>
            <IconButton aria-label="Cerrar el panel de notas" onClick={closePanel} edge="end">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Carga */}
          <Box sx={{ p: 2, pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              inputRef={inputRef}
              fullWidth
              multiline
              maxRows={5}
              size="small"
              placeholder="Escribí una nota y apretá Enter"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                // Enter guarda, Shift+Enter hace salto de línea. `isComposing` evita guardar a
                // mitad de una composición (acentos/IME) en algunos teclados.
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
              helperText={draft.length >= COUNTER_FROM ? `${draft.length}/${MAX_LENGTH}` : undefined}
              slotProps={{
                htmlInput: { maxLength: MAX_LENGTH, 'aria-label': 'Nueva nota' },
                input: {
                  // En el celular Enter muchas veces inserta un salto de línea en vez de enviar, así
                  // que el botón es la forma confiable de guardar desde ahí.
                  endAdornment: (
                    <IconButton
                      size="small"
                      color="primary"
                      aria-label="Agregar la nota"
                      disabled={!draft.trim() || saving}
                      onClick={() => void handleSubmit()}
                      edge="end"
                      sx={{ alignSelf: 'flex-end' }}
                    >
                      <SendIcon fontSize="small" />
                    </IconButton>
                  ),
                },
              }}
            />
            <Stack direction="row" spacing={1} sx={{ mt: 1.25, flexWrap: 'wrap', rowGap: 1 }} alignItems="center">
              <Chip
                size="small"
                label="Hoy"
                color={draftDue === today ? 'primary' : 'default'}
                variant={draftDue === today ? 'filled' : 'outlined'}
                onClick={() => setDraftDue(draftDue === today ? null : today)}
              />
              <Chip
                size="small"
                label="Mañana"
                color={draftDue === tomorrow ? 'primary' : 'default'}
                variant={draftDue === tomorrow ? 'filled' : 'outlined'}
                onClick={() => setDraftDue(draftDue === tomorrow ? null : tomorrow)}
              />
              <Chip
                size="small"
                icon={<EventIcon />}
                label={hasCustomDue ? `Vence el ${formatDueDate(draftDue!)}` : 'Elegir fecha'}
                color={hasCustomDue ? 'primary' : 'default'}
                variant={hasCustomDue ? 'filled' : 'outlined'}
                onClick={() => setPickingDate((v) => !v)}
                onDelete={hasCustomDue ? () => setDraftDue(null) : undefined}
              />
            </Stack>
            <Collapse in={pickingDate} unmountOnExit>
              <Box sx={{ pt: 1.5 }}>
                <DateField
                  label="Vencimiento"
                  value={draftDue}
                  size="small"
                  fullWidth
                  onChange={(value) => {
                    setDraftDue(value || null);
                    if (value) setPickingDate(false);
                  }}
                />
              </Box>
            </Collapse>
          </Box>

          {/* Listas */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}><GearSpinner size={28} /></Box>
            ) : loadError && pending.length === 0 && completed.length === 0 ? (
              <Box textAlign="center" py={4} px={2}>
                <Typography variant="body2" color="text.secondary" mb={1.5}>
                  No se pudieron cargar las notas.
                </Typography>
                <Button size="small" variant="outlined" onClick={() => void reload()}>Reintentar</Button>
              </Box>
            ) : (
              <>
                {pending.length === 0 ? (
                  <Box textAlign="center" py={4} px={3}>
                    <Typography variant="body2" fontWeight="bold" mb={0.5}>No tenés notas pendientes</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Anotá una idea o un pendiente arriba y te queda a mano en cualquier pantalla.
                    </Typography>
                  </Box>
                ) : (
                  <Stack divider={<Divider />}>
                    {pending.map((note) => (
                      <PendingNoteRow key={note.id} note={note} onPickDate={setDueDialogNote} />
                    ))}
                  </Stack>
                )}

                {completed.length > 0 && (
                  <>
                    <Divider />
                    <Button
                      fullWidth
                      color="inherit"
                      onClick={() => setShowCompleted((v) => !v)}
                      endIcon={showCompleted ? <ExpandLess /> : <ExpandMore />}
                      sx={{ justifyContent: 'space-between', px: 2, py: 1.25, color: 'text.secondary', textTransform: 'none' }}
                    >
                      Completadas ({completed.length})
                    </Button>
                    <Collapse in={showCompleted} unmountOnExit>
                      <Stack divider={<Divider />}>
                        {completed.map((note) => (
                          <CompletedNoteRow key={note.id} note={note} />
                        ))}
                      </Stack>
                    </Collapse>
                  </>
                )}
              </>
            )}
          </Box>
        </Box>
      </Drawer>

      {dueDialogNote && (
        <DueDateDialog key={dueDialogNote.id} note={dueDialogNote} onClose={() => setDueDialogNote(null)} />
      )}

      {/* Fuera del Drawer a propósito: el "Deshacer" tiene que seguir visible aunque el panel se cierre
          (o la acción venga del widget de Inicio, en la etapa 2). */}
      <Snackbar
        key={toast?.key}
        open={!!toast}
        autoHideDuration={6000}
        onClose={(_, reason) => {
          if (reason === 'clickaway') return;
          dismissToast();
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        {...(toast?.severity === 'error' ? {} : { message: toast?.message })}
        action={
          toast?.severity !== 'error' && toast?.undo ? (
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                toast.undo?.();
                dismissToast();
              }}
            >
              Deshacer
            </Button>
          ) : undefined
        }
      >
        {toast?.severity === 'error' ? (
          <Alert severity="error" variant="filled" onClose={dismissToast} sx={{ width: '100%' }}>
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
}
