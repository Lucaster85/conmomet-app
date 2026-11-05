'use client';
import React, { useEffect, useState } from 'react';
import {
  Alert, Autocomplete, Button, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography,
} from '@mui/material';
import AppDialog from '@/components/common/AppDialog';
import { Additional, AdditionalService, LookupBudgetManager, LookupService } from '../../utils/api';

// "Notificar finalización" de un adicional (ver FLOWS.md §50): lo pasa a Completado y le avisa a
// gerencia que tiene que cerrar el presupuesto. Se ofrece SOLO gerencia (budgets_send) porque es
// quien puede cargar los márgenes y enviar. La lista sale de /lookup/budget-managers, no de
// GET /users: así alcanza con additionals_update, sin users_read (regla de conmomet-app/CLAUDE.md).
interface NotifyFinishDialogProps {
  open: boolean;
  additional: Pick<Additional, 'id' | 'code' | 'name' | 'status' | 'budgetAssignees'> | null;
  onClose: () => void;
  onFinished: (updated: Additional) => void;
  onError: (message: string) => void;
}

export default function NotifyFinishDialog({ open, additional, onClose, onFinished, onError }: NotifyFinishDialogProps) {
  const [managers, setManagers] = useState<LookupBudgetManager[]>([]);
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!open || !additional) return;
    // Si ya hay responsables se precargan (cambiar el set); si no, la lista arranca vacía.
    setAssigneeIds((additional.budgetAssignees || []).map((u) => u.id));
    setLoadingManagers(true);
    LookupService.getBudgetManagers()
      .then((list) => {
        setManagers(list);
        // Un responsable precargado que ya no es de gerencia se descarta: el backend lo rechazaría.
        setAssigneeIds((prev) => prev.filter((id) => list.some((m) => m.id === id)));
      })
      .catch((err) => {
        setManagers([]);
        onError(err instanceof Error ? err.message : 'Error al cargar los usuarios de gerencia');
      })
      .finally(() => setLoadingManagers(false));
    // onError es una función inline del padre: no debe re-disparar la carga.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, additional?.id]);

  const handleConfirm = async () => {
    if (!additional || assigneeIds.length === 0 || processing) return;
    setProcessing(true);
    try {
      const updated = await AdditionalService.finish(additional.id, assigneeIds);
      onFinished(updated);
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al notificar la finalización');
    } finally {
      setProcessing(false);
    }
  };

  const alreadyCompleted = additional?.status === 'completed';

  return (
    <AppDialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Notificar finalización</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Adicional <strong>{additional?.code}</strong>{additional ? ` — ${additional.name}` : ''}. Se le avisa a gerencia
            para que cargue los márgenes y envíe el presupuesto al cliente.
          </Typography>
          <Alert severity="warning" sx={{ py: 0 }}>
            {alreadyCompleted
              ? 'Ya está Completado. Al confirmar se reemplazan los responsables y se vuelve a avisar.'
              : 'El adicional pasa a Completado y ya no se podrán cargar horas.'}
          </Alert>
          <Autocomplete
            multiple
            options={managers}
            loading={loadingManagers}
            getOptionLabel={(u) => `${u.name} ${u.lastname}`}
            value={managers.filter((u) => assigneeIds.includes(u.id))}
            onChange={(_e, value) => setAssigneeIds(value.map((u) => u.id))}
            renderInput={(params) => <TextField {...params} label="Avisar a (gerencia) *" placeholder="Elegir responsables" />}
            isOptionEqualToValue={(a, b) => a.id === b.id}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={processing || assigneeIds.length === 0}>
          Confirmar
        </Button>
      </DialogActions>
    </AppDialog>
  );
}
