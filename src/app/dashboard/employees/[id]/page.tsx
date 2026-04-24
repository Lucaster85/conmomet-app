'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Paper, CircularProgress, Tabs, Tab,
  Button, IconButton, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tooltip, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Switch, FormControlLabel
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { EmployeeService, Employee, EntityDocumentService, EntityDocument } from '@/utils/api';
import FeedbackModal from '@/components/FeedbackModal';

const STATUS_CONFIG = {
  permanent: { label: 'Permanente', color: 'default', icon: <CheckCircleIcon fontSize="small" /> },
  valid: { label: 'Al Día', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  expiring_soon: { label: 'Vence Pronto', color: 'warning', icon: <WarningIcon fontSize="small" /> },
  expired: { label: 'Vencido', color: 'error', icon: <ErrorIcon fontSize="small" /> },
} as const;

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = Number(params.id);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [documents, setDocuments] = useState<EntityDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Upload Dialog State
  const [uploadDialog, setUploadDialog] = useState(false);
  const [hasExpiration, setHasExpiration] = useState(false);
  const [editingDoc, setEditingDoc] = useState<EntityDocument | null>(null);
  const [form, setForm] = useState({ title: '', notes: '', expiration_date: '', notify_days_before: 15 });
  const [file, setFile] = useState<File | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const empData = await EmployeeService.getById(employeeId);
      setEmployee(empData);
      
      const docsData = await EntityDocumentService.getAll('employee', employeeId);
      setDocuments(docsData);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error al cargar los datos del empleado');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    if (employeeId) {
      loadData();
    }
  }, [employeeId, loadData]);

  const handleUploadSubmit = async () => {
    if (!form.title) return setError('El título es obligatorio');
    
    try {
      if (editingDoc) {
        await EntityDocumentService.update(editingDoc.id, {
          title: form.title,
          notes: form.notes,
          expiration_date: hasExpiration && form.expiration_date ? form.expiration_date : undefined,
          notify_days_before: hasExpiration ? form.notify_days_before : undefined,
        }, file);
        setSuccess('Documento actualizado correctamente');
      } else {
        await EntityDocumentService.create({
          title: form.title,
          notes: form.notes,
          entity_type: 'employee',
          entity_id: employeeId,
          expiration_date: hasExpiration && form.expiration_date ? form.expiration_date : undefined,
          notify_days_before: hasExpiration ? form.notify_days_before : undefined,
        }, file);
        setSuccess('Documento guardado correctamente');
      }

      setUploadDialog(false);
      setEditingDoc(null);
      setForm({ title: '', notes: '', expiration_date: '', notify_days_before: 15 });
      setFile(null);
      setHasExpiration(false);
      loadData();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error al guardar el documento');
    }
  };

  const handleDelete = async (docId: number) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return;
    try {
      await EntityDocumentService.delete(docId);
      setSuccess('Documento eliminado');
      loadData();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error al eliminar');
    }
  };

  const handleOpenEdit = (doc: EntityDocument) => {
    setEditingDoc(doc);
    setForm({
      title: doc.title,
      notes: doc.notes || '',
      expiration_date: doc.expiration_date || '',
      notify_days_before: doc.notify_days_before || 15,
    });
    setHasExpiration(!!doc.expiration_date);
    setFile(null);
    setUploadDialog(true);
  };

  if (loading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>;
  if (!employee) return <Typography color="error">Empleado no encontrado.</Typography>;

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => router.push('/dashboard/employees')}><ArrowBackIcon /></IconButton>
        <Typography variant="h4" fontWeight="bold">
          {employee.lastname}, {employee.name}
        </Typography>
      </Box>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)} variant="scrollable" scrollButtons="auto">
          <Tab label="Información General" />
          <Tab label="Documentos y Vencimientos" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Datos del Empleado</Typography>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
            <Typography><strong>DNI:</strong> {employee.dni}</Typography>
            <Typography><strong>CUIL:</strong> {employee.cuil}</Typography>
            <Typography><strong>Puesto:</strong> {employee.position || '—'}</Typography>
            <Typography><strong>Teléfono:</strong> {employee.phone || '—'}</Typography>
            <Typography><strong>Email:</strong> {employee.email || '—'}</Typography>
            <Typography><strong>Dirección:</strong> {employee.address || '—'}</Typography>
            <Typography>
              <strong>Remuneración:</strong> {employee.pay_type === 'monthly' ? `$${employee.monthly_salary} (Mensual)` : `$${employee.hourly_rate} (Hora)`}
            </Typography>
          </Box>
        </Paper>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Legajo Virtual</Typography>
            <Button variant="contained" startIcon={<CloudUploadIcon />} onClick={() => {
              setEditingDoc(null);
              setForm({ title: '', notes: '', expiration_date: '', notify_days_before: 15 });
              setHasExpiration(false);
              setFile(null);
              setUploadDialog(true);
            }}>
              Nuevo Documento
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell><strong>Documento</strong></TableCell>
                  <TableCell><strong>Vencimiento</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell align="center"><strong>Archivo</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><Typography color="text.secondary">No hay documentos registrados</Typography></TableCell></TableRow>
                ) : (
                  documents.map((doc) => {
                    const statusCfg = STATUS_CONFIG[doc.computed_status] || STATUS_CONFIG.permanent;
                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <Typography fontWeight="medium">{doc.title}</Typography>
                          {doc.notes && <Typography variant="caption" color="text.secondary" display="block">{doc.notes}</Typography>}
                        </TableCell>
                        <TableCell>
                          {doc.expiration_date ? new Date(doc.expiration_date + 'T00:00:00').toLocaleDateString('es-AR') : '—'}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            icon={statusCfg.icon} 
                            label={statusCfg.label} 
                            color={statusCfg.color as "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="center">
                          {doc.file_url ? (
                            <Tooltip title="Ver Documento">
                              <IconButton size="small" color="info" onClick={() => window.open(doc.file_url, '_blank')}>
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" color="text.secondary">—</Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Editar">
                            <IconButton size="small" color="primary" onClick={() => handleOpenEdit(doc)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton size="small" color="error" onClick={() => handleDelete(doc.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Upload/Edit Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingDoc ? 'Editar Documento' : 'Registrar Documento / Vencimiento'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Título *" fullWidth value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Licencia de Conducir, Examen Médico..." />
            
            <FormControlLabel
              control={<Switch checked={hasExpiration} onChange={(e) => setHasExpiration(e.target.checked)} />}
              label="Este documento tiene fecha de vencimiento"
            />

            {hasExpiration && (
              <Box display="flex" gap={2}>
                <TextField 
                  label="Fecha de Vencimiento *" 
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
            )}

            <TextField label="Notas adicionales" fullWidth multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

            <Box>
              <Typography variant="subtitle2" gutterBottom>Archivo adjunto (Opcional)</Typography>
              <Button variant="outlined" component="label" fullWidth>
                {file ? file.name : "Seleccionar Archivo"}
                <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancelar</Button>
          <Button onClick={handleUploadSubmit} variant="contained" disabled={!form.title || (hasExpiration && !form.expiration_date)}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
