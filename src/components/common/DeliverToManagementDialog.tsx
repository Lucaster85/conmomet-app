'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography,
  Autocomplete, TextField,
} from '@mui/material';
import { QuoteRequestService, UserService, User, Permission } from '../../utils/api';

// Entregar el presupuesto a gerencia = pasar su Pedido de Cotización a "A validar"
// (pending_review) reasignándolo a quien lo recibe. Vive acá y no dentro de
// dashboard/budgets/page.tsx porque el responsable trabaja en Presupuestos pero la transición es
// del PC: así el botón está donde se hace el trabajo, sin obligar a volver al módulo de PC
// (ver FLOWS.md flujo 27d).
//
// GET /users trae los permisos como objetos anidados (role.permissions + permissions), a
// diferencia de utils/auth.ts#userHasPermission que espera el usuario de sesión ya aplanado.
// Acá se ofrece SOLO gerencia (quote_requests_assign): el destinatario tiene que poder cargar
// los márgenes y mover el PC de ahí en adelante, no cualquiera que pueda ver PCs.
function canReceiveHandoff(user: User): boolean {
  const perms = [
    ...(user.role?.permissions || []).map((p: Permission) => p.name),
    ...(user.permissions || []).map((p: Permission) => p.name),
  ];
  return perms.includes('admin_granted') || perms.includes('quote_requests_assign');
}

interface DeliverToManagementDialogProps {
  open: boolean;
  quoteRequest: { id: number; number: string } | null;
  budgetNumber?: string;
  onClose: () => void;
  onDelivered: (message: string) => void;
  onError: (message: string) => void;
}

export default function DeliverToManagementDialog({
  open, quoteRequest, budgetNumber, onClose, onDelivered, onError,
}: DeliverToManagementDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAssigneeIds([]);
    setLoadingUsers(true);
    UserService.getAll()
      .then((all) => setUsers(Array.isArray(all) ? all.filter(canReceiveHandoff) : []))
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false));
  }, [open]);

  const handleConfirm = async () => {
    if (!quoteRequest) return;
    // Entregar sin destinatario dejaría el PC sin asignados, y el aviso del tablero solo muestra
    // los PC asignados a uno — quedaría invisible para todos justo con el vencimiento corriendo.
    if (assigneeIds.length === 0) {
      onError('Elegí al menos una persona de gerencia que reciba el presupuesto.');
      return;
    }
    setProcessing(true);
    try {
      await QuoteRequestService.changeStatus(quoteRequest.id, 'pending_review', assigneeIds);
      onDelivered('Presupuesto entregado a gerencia para su validación.');
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al entregar el presupuesto');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Entregar a gerencia</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {budgetNumber ? <>Presupuesto <strong>{budgetNumber}</strong> — p</> : <>P</>}edido de
            cotización <strong>{quoteRequest?.number}</strong>. Pasa a <strong>A validar</strong> para
            que gerencia cargue los márgenes y lo revise antes de enviarlo al cliente.
          </Typography>
          <Autocomplete
            multiple
            options={users}
            loading={loadingUsers}
            getOptionLabel={(u) => `${u.name} ${u.lastname}`}
            value={users.filter((u) => assigneeIds.includes(u.id))}
            onChange={(_e, value) => setAssigneeIds(value.map((u) => u.id))}
            renderInput={(params) => <TextField {...params} label="Entregar a (gerencia) *" placeholder="Elegir destinatario" />}
            isOptionEqualToValue={(a, b) => a.id === b.id}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={processing}>Entregar</Button>
      </DialogActions>
    </Dialog>
  );
}
