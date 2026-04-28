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
import RefreshIcon from '@mui/icons-material/Refresh';
import PaymentIcon from '@mui/icons-material/Payment';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { EmployeeService, Employee, EntityDocumentService, EntityDocument } from '@/utils/api';
import FeedbackModal from '@/components/FeedbackModal';

const STATUS_CONFIG = {
  permanent: { label: 'Permanente', color: 'default', icon: <CheckCircleIcon fontSize="small" /> },
  valid: { label: 'Al Día', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  expiring_soon: { label: 'Vence Pronto', color: 'warning', icon: <WarningIcon fontSize="small" /> },
  expired: { label: 'Vencido', color: 'error', icon: <ErrorIcon fontSize="small" /> },
  resolved: { label: 'Resuelto', color: 'default', icon: <CheckCircleIcon fontSize="small" /> },
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

  // General View State
  const [showResolved, setShowResolved] = useState(false);

  // Modals State
  const [uploadDialog, setUploadDialog] = useState(false);
  const [renewDialog, setRenewDialog] = useState(false);
  const [resolveDialog, setResolveDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);

  // Form State
  const [hasExpiration, setHasExpiration] = useState(false);
  const [isRenewable, setIsRenewable] = useState(true);
  const [editingDoc, setEditingDoc] = useState<EntityDocument | null>(null);
  const [form, setForm] = useState({ title: '', notes: '', expiration_date: '', notify_days_before: 15 });
  const [file, setFile] = useState<File | null>(null);
  
  // History State
  const [historyDocs, setHistoryDocs] = useState<EntityDocument[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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
          is_renewable: isRenewable,
        }, file);
        setSuccess('Documento guardado correctamente');
      }

      setUploadDialog(false);
      setEditingDoc(null);
      setForm({ title: '', notes: '', expiration_date: '', notify_days_before: 15 });
      setFile(null);
      setHasExpiration(false);
      setIsRenewable(true);
      loadData();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error al guardar el documento');
    }
  };

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
      setForm({ title: '', notes: '', expiration_date: '', notify_days_before: 15 });
      loadData();
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
      loadData();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error al resolver documento');
    }
  };

  const handleOpenHistory = async (docId: number) => {
    try {
      setLoadingHistory(true);
      setHistoryDialog(true);
      const history = await EntityDocumentService.getHistory(docId);
      setHistoryDocs(history);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error al cargar historial');
    } finally {
      setLoadingHistory(false);
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
    setIsRenewable(doc.is_renewable !== undefined ? doc.is_renewable : true);
    setFile(null);
    setUploadDialog(true);
  };

  const filteredDocuments = documents.filter(doc => showResolved ? true : doc.alert_status !== 'resolved');

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
            <Typography><strong>Fecha Ingreso:</strong> {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : '—'}</Typography>
            <Typography><strong>Fecha Nacimiento:</strong> {employee.birth_date ? new Date(employee.birth_date).toLocaleDateString() : '—'}</Typography>
            <Typography>
              <strong>Remuneración:</strong> {employee.pay_type === 'monthly' ? `$${employee.monthly_salary} (Mensual)` : `$${employee.hourly_rate} (Hora)`}
            </Typography>
          </Box>
        </Paper>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h6">Legajo Virtual</Typography>
              <FormControlLabel
                control={<Switch size="small" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />}
                label="Mostrar resueltos"
              />
            </Box>
            <Button variant="contained" startIcon={<CloudUploadIcon />} onClick={() => {
              setEditingDoc(null);
              setForm({ title: '', notes: '', expiration_date: '', notify_days_before: 15 });
              setHasExpiration(false);
              setIsRenewable(true);
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
                {filteredDocuments.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><Typography color="text.secondary">No hay documentos registrados</Typography></TableCell></TableRow>
                ) : (
                  filteredDocuments.map((doc) => {
                    const statusCfg = STATUS_CONFIG[doc.computed_status] || STATUS_CONFIG.permanent;
                    const isCritical = doc.computed_status === 'expiring_soon' || doc.computed_status === 'expired';
                    
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
                          {isCritical && doc.is_renewable && (
                            <Tooltip title="Renovar">
                              <IconButton size="small" color="warning" onClick={() => {
                                setEditingDoc(doc);
                                setForm({ ...form, title: doc.title, notify_days_before: doc.notify_days_before || 15 });
                                setFile(null);
                                setRenewDialog(true);
                              }}>
                                <RefreshIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {isCritical && !doc.is_renewable && (
                            <Tooltip title="Pagar / Marcar Resuelto">
                              <IconButton size="small" color="success" onClick={() => {
                                setEditingDoc(doc);
                                setFile(null);
                                setResolveDialog(true);
                              }}>
                                <PaymentIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {doc.previous_record_id && (
                             <Tooltip title="Ver Historial">
                               <IconButton size="small" color="info" onClick={() => handleOpenHistory(doc.id)}>
                                 <HistoryIcon fontSize="small" />
                               </IconButton>
                             </Tooltip>
                          )}
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
              <FormControlLabel
                control={<Switch checked={isRenewable} onChange={(e) => setIsRenewable(e.target.checked)} />}
                label="Este documento se renueva (ej: licencia, seguro)"
                sx={{ ml: 2, mt: -1 }}
              />
            )}

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

      {/* History Dialog */}
      <Dialog open={historyDialog} onClose={() => setHistoryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Historial de Renovaciones</DialogTitle>
        <DialogContent>
          {loadingHistory ? (
             <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Versión</TableCell>
                    <TableCell>Vencimiento</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Resuelto El</TableCell>
                    <TableCell>Archivo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyDocs.map((doc, index) => {
                    const statusCfg = STATUS_CONFIG[doc.computed_status] || STATUS_CONFIG.permanent;
                    return (
                      <TableRow key={doc.id}>
                        <TableCell>{index === 0 ? 'Actual' : `Anterior ${index}`}</TableCell>
                        <TableCell>{doc.expiration_date ? new Date(doc.expiration_date + 'T00:00:00').toLocaleDateString('es-AR') : '—'}</TableCell>
                        <TableCell>
                           <Chip 
                              icon={statusCfg.icon} 
                              label={statusCfg.label} 
                              color={statusCfg.color as "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"} 
                              size="small" 
                            />
                        </TableCell>
                        <TableCell>
                          {doc.alert_status === 'resolved' && doc.resolved_at 
                            ? new Date(doc.resolved_at).toLocaleDateString('es-AR') 
                            : '—'}
                        </TableCell>
                        <TableCell>
                          {doc.file_url && (
                             <Tooltip title="Ver">
                               <IconButton size="small" color="info" onClick={() => window.open(doc.file_url, '_blank')}>
                                 <VisibilityIcon fontSize="small" />
                               </IconButton>
                             </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
