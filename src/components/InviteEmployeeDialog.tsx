'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, Typography } from '@mui/material';
import { Employee, EmployeeInvitationService, InviteResult } from '../utils/api';
import { buildWhatsAppLink, normalizeArgentinaMobile } from '../utils/whatsapp';

export const buildInviteMessage = (link: string, name: string) =>
  `Hola ${name}, te invitamos a crear tu usuario del Portal Conmomet. Ingresá acá para crear tu contraseña: ${link}`;

interface InviteEmployeeDialogProps {
  employee: Employee | null;
  open: boolean;
  onClose: () => void;
  onSent: (result: InviteResult) => void;
  onError: (message: string) => void;
}

// Diálogo compartido de invitación al Portal por WhatsApp — usado tanto desde el listado de
// empleados como desde la ficha individual. El envío por email queda oculto hasta tener un
// servicio de mail propio del cliente (el de prueba no está funcionando), así que por ahora
// solo se ofrece WhatsApp.
export default function InviteEmployeeDialog({ employee, open, onClose, onSent, onError }: InviteEmployeeDialogProps) {
  const [contact, setContact] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) setContact(employee?.phone || '');
  }, [open, employee]);

  const handleConfirm = async () => {
    if (!employee || !contact.trim()) return;
    setSending(true);
    try {
      const result = await EmployeeInvitationService.invite(employee.id, { channel: 'whatsapp', contact: contact.trim() });
      window.open(buildWhatsAppLink(result.contact_used, buildInviteMessage(result.invite_link, employee.name)), '_blank');
      onSent(result);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al invitar al empleado.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Invitar al Portal por WhatsApp</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Celular de destino"
            fullWidth
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            helperText='Código de área + número, sin 0 ni 15 (ej: 2262403020 o 1141234567).'
          />
          {contact.trim() && (
            <Typography variant="body2" color="text.secondary">
              Se va a enviar a: <strong>+{normalizeArgentinaMobile(contact)}</strong>
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={sending || !contact.trim()} onClick={handleConfirm}>
          {sending ? 'Enviando…' : 'Confirmar y enviar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
