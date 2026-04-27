'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Stack,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
  Payment as PaymentIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useAuth } from '../../utils/auth';
import { EntityDocumentService, EntityDocument } from '../../utils/api';
import FeedbackModal from '../../components/FeedbackModal';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [expiringDocs, setExpiringDocs] = useState<EntityDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [renewDialog, setRenewDialog] = useState(false);
  const [resolveDialog, setResolveDialog] = useState(false);
  const [editingDoc, setEditingDoc] = useState<EntityDocument | null>(null);
  const [form, setForm] = useState({ expiration_date: '', notify_days_before: 15 });
  const [file, setFile] = useState<File | null>(null);

  const getUserWelcomeMessage = () => {
    if (user?.fullName) return `Bienvenido de vuelta, ${user.fullName}`;
    if (user?.name) return `Bienvenido de vuelta, ${user.name}`;
    return 'Bienvenido de vuelta';
  };

  const fetchExpirations = async () => {
    try {
      setLoadingDocs(true);
      const allDocs = await EntityDocumentService.getAll();
      
      const criticalDocs = allDocs.filter(doc => 
        doc.computed_status === 'expiring_soon' || doc.computed_status === 'expired'
      );
      
      criticalDocs.sort((a, b) => {
        if (a.computed_status === 'expired' && b.computed_status !== 'expired') return -1;
        if (a.computed_status !== 'expired' && b.computed_status === 'expired') return 1;
        if (!a.expiration_date || !b.expiration_date) return 0;
        return new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime();
      });

      setExpiringDocs(criticalDocs);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error al cargar alertas de vencimientos');
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchExpirations();
  }, []);

  const handleRenewSubmit = async () => {
    if (!editingDoc) return;
    if (!file) return setError('El archivo es obligatorio para renovar');
    if (!form.expiration_date) return setError('La nueva fecha de vencimiento es obligatoria');

    try {
      await EntityDocumentService.renew(editingDoc.id, {
        expiration_date: form.expiration_date,
        notify_days_before: form.notify_days_before
      }, file);
      setSuccess('Documento renovado correctamente');
      setRenewDialog(false);
      setEditingDoc(null);
      setFile(null);
      setForm({ expiration_date: '', notify_days_before: 15 });
      fetchExpirations();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error al renovar documento');
    }
  };

  const handleResolveSubmit = async () => {
    if (!editingDoc) return;
    if (!file) return setError('Debe adjuntar el comprobante de pago/resolución');

    try {
      await EntityDocumentService.resolve(editingDoc.id, file);
      setSuccess('Documento marcado como resuelto');
      setResolveDialog(false);
      setEditingDoc(null);
      setFile(null);
      fetchExpirations();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error al resolver documento');
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        {getUserWelcomeMessage()}
      </Typography>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {/* Content Sections */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        
        {/* Widget: Alertas de Vencimientos */}
        <Paper sx={{ flex: '1 1 500px', p: 3, borderRadius: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Alertas de Vencimientos
            </Typography>
            <Chip 
              label={`${expiringDocs.length} alertas`} 
              color={expiringDocs.length > 0 ? "error" : "success"} 
              size="small" 
            />
          </Box>

          {loadingDocs ? (
            <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
          ) : expiringDocs.length === 0 ? (
            <Box textAlign="center" py={4} bgcolor="grey.50" borderRadius={2}>
              <Typography color="text.secondary">¡Todo al día! No hay documentos por vencer.</Typography>
            </Box>
          ) : (
            <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
              {expiringDocs.map((doc) => {
                const isExpired = doc.computed_status === 'expired';
                
                let entityLabel = "Global";
                if (doc.entity_type === 'employee') entityLabel = "Empleado";
                if (doc.entity_type === 'vehicle') entityLabel = "Vehículo";
                
                return (
                  <ListItem
                    key={doc.id}
                    sx={{
                      mb: 1,
                      border: 1,
                      borderColor: isExpired ? 'error.light' : 'warning.light',
                      borderRadius: 1,
                      bgcolor: isExpired ? 'error.50' : 'warning.50',
                    }}
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        {doc.is_renewable ? (
                          <Button 
                            size="small" 
                            variant="contained" 
                            color="warning"
                            startIcon={<RefreshIcon />}
                            onClick={() => {
                              setEditingDoc(doc);
                              setForm({ expiration_date: '', notify_days_before: doc.notify_days_before || 15 });
                              setFile(null);
                              setRenewDialog(true);
                            }}
                          >
                            Renovar
                          </Button>
                        ) : (
                          <Button 
                            size="small" 
                            variant="contained" 
                            color="success"
                            startIcon={<PaymentIcon />}
                            onClick={() => {
                              setEditingDoc(doc);
                              setFile(null);
                              setResolveDialog(true);
                            }}
                          >
                            Pagar
                          </Button>
                        )}
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="primary"
                          startIcon={<VisibilityIcon />}
                          onClick={() => {
                            if (doc.entity_type === 'employee') {
                              router.push(`/dashboard/employees/${doc.entity_id}`);
                            }
                          }}
                        >
                          Ver
                        </Button>
                      </Stack>
                    }
                  >
                    <ListItemIcon>
                      {isExpired ? <ErrorIcon color="error" /> : <WarningIcon color="warning" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography fontWeight="bold">{doc.title}</Typography>
                          <Chip label={entityLabel} size="small" variant="outlined" />
                        </Box>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography variant="body2" component="span" display="block">
                            {doc.notes || 'Sin notas'}
                          </Typography>
                          <Typography variant="caption" color={isExpired ? "error" : "warning.dark"} fontWeight="bold">
                            {isExpired ? 'Venció el: ' : 'Vence el: '}
                            {doc.expiration_date ? new Date(doc.expiration_date + 'T00:00:00').toLocaleDateString('es-AR') : ''}
                          </Typography>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </Paper>

        {/* Other future widgets can go here */}
        <Paper sx={{ flex: '1 1 300px', p: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
            Accesos Rápidos
          </Typography>
          <Stack spacing={2}>
            <Button variant="outlined" startIcon={<AssignmentIcon />} onClick={() => router.push('/dashboard/employees')}>
              Gestión de Personal
            </Button>
            <Button variant="outlined" startIcon={<AssignmentIcon />} onClick={() => router.push('/dashboard/attendance')}>
              Presentismo
            </Button>
          </Stack>
        </Paper>

      </Box>

      {/* Renew Dialog */}
      <Dialog open={renewDialog} onClose={() => setRenewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Renovar Documento</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">Estás renovando: <strong>{editingDoc?.title}</strong></Typography>
            <Box display="flex" gap={2}>
              <TextField 
                label="Nueva Fecha de Vencimiento *" 
                type="date" 
                fullWidth 
                value={form.expiration_date} 
                onChange={(e) => setForm({ ...form, expiration_date: e.target.value })}
                InputLabelProps={{ shrink: true }} 
              />
              <TextField 
                label="Avisar días antes" 
                type="number" 
                fullWidth 
                value={form.notify_days_before} 
                onChange={(e) => setForm({ ...form, notify_days_before: Number(e.target.value) })}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>Nuevo archivo adjunto *</Typography>
              <Button variant="outlined" component="label" fullWidth color={file ? 'success' : 'primary'}>
                {file ? file.name : "Seleccionar Archivo (Requerido)"}
                <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenewDialog(false)}>Cancelar</Button>
          <Button onClick={handleRenewSubmit} variant="contained" disabled={!form.expiration_date || !file}>Renovar</Button>
        </DialogActions>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialog} onClose={() => setResolveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Pagar / Resolver Documento</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">Estás marcando como resuelto: <strong>{editingDoc?.title}</strong></Typography>
            <Box>
              <Typography variant="subtitle2" gutterBottom>Comprobante de Pago *</Typography>
              <Button variant="outlined" component="label" fullWidth color={file ? 'success' : 'primary'}>
                {file ? file.name : "Seleccionar Archivo (Requerido)"}
                <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialog(false)}>Cancelar</Button>
          <Button onClick={handleResolveSubmit} variant="contained" color="success" disabled={!file}>Marcar Resuelto</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}