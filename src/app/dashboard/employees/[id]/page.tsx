'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Paper, CircularProgress, Tabs, Tab,
  Button, IconButton, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tooltip, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Switch, FormControlLabel, Card, CardContent, Divider, Grid,
  LinearProgress, Alert
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
import BadgeIcon from '@mui/icons-material/Badge';
import WorkIcon from '@mui/icons-material/Work';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import PersonIcon from '@mui/icons-material/Person';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import SearchIcon from '@mui/icons-material/Search';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import dayjs from 'dayjs';

import {
  EmployeeService, Employee, EntityDocumentService, EntityDocument,
  AttendanceService, Attendance, LeaveRequestService, LeaveRequest, LeaveBalance
} from '@/utils/api';
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

  // Attendance tab state
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attDateFrom, setAttDateFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [attDateTo, setAttDateTo] = useState(dayjs().format('YYYY-MM-DD'));

  // Leave tab state
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [loadingLeave, setLoadingLeave] = useState(false);
  const [leaveLoaded, setLeaveLoaded] = useState(false);

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

  const loadAttendance = async (from: string, to: string) => {
    try {
      setLoadingAttendance(true);
      const data = await AttendanceService.getAll({ employee_id: employeeId, date_from: from, date_to: to });
      setAttendances(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error al cargar presentismo');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const loadLeave = async () => {
    try {
      setLoadingLeave(true);
      const [balance, requests] = await Promise.all([
        LeaveRequestService.getBalance(employeeId),
        LeaveRequestService.getAll({ employee_id: employeeId }),
      ]);
      setLeaveBalance(balance);
      setLeaveRequests(Array.isArray(requests) ? requests : []);
      setLeaveLoaded(true);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error al cargar licencias');
    } finally {
      setLoadingLeave(false);
    }
  };

  const handleApproveLeave = async (id: number) => {
    try {
      await LeaveRequestService.approve(id);
      setSuccess('Solicitud aprobada');
      loadLeave();
    } catch (err: unknown) {
      setError((err as Error).message || 'Error al aprobar');
    }
  };

  const handleRejectLeave = async (id: number) => {
    try {
      await LeaveRequestService.reject(id);
      setSuccess('Solicitud rechazada');
      loadLeave();
    } catch (err: unknown) {
      setError((err as Error).message || 'Error al rechazar');
    }
  };

  // Lazy load per tab
  useEffect(() => {
    if (tabValue === 2) loadAttendance(attDateFrom, attDateTo);
    if (tabValue === 3 && !leaveLoaded) loadLeave();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabValue]);

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
          <Tab label="Presentismo" />
          <Tab label="Vacaciones y Licencias" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <Box>
          <Grid container spacing={3}>
            {/* Datos Personales */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <BadgeIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>Datos Personales</Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary">Nombre y Apellido</Typography>
                      <Typography variant="body1" fontWeight={500}>{employee.name} {employee.lastname}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary">DNI</Typography>
                      <Typography variant="body1">{employee.dni}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary">CUIL</Typography>
                      <Typography variant="body1">{employee.cuil}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary">Fecha de Nacimiento</Typography>
                      <Typography variant="body1">{employee.birth_date ? dayjs(employee.birth_date).format('DD/MM/YYYY') : '—'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary">Teléfono</Typography>
                      <Typography variant="body1">{employee.phone || '—'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary">Email</Typography>
                      <Typography variant="body1">{employee.email || '—'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary">Dirección</Typography>
                      <Typography variant="body1">{employee.address || '—'}</Typography>
                    </Grid>
                  </Grid>

                  <Box mt={4} mb={2} display="flex" alignItems="center" gap={1}>
                    <WorkIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>Datos Laborales</Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary">Puesto / Cargo</Typography>
                      <Typography variant="body1" fontWeight={500}>{employee.position || '—'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary">Estado</Typography>
                      <Box mt={0.5}>
                        <Chip
                          label={employee.status === 'active' ? 'Activo' : employee.status === 'vacation' ? 'Vacaciones' : employee.status === 'medical_leave' ? 'Licencia Médica' : 'Inactivo'}
                          color={employee.status === 'active' ? 'success' : employee.status === 'vacation' ? 'info' : employee.status === 'medical_leave' ? 'warning' : 'default'}
                          size="small"
                        />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary">Fecha de Ingreso</Typography>
                      <Typography variant="body1">{employee.hire_date ? dayjs(employee.hire_date).format('DD/MM/YYYY') : '—'}</Typography>
                    </Grid>
                    {employee.termination_date && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary">Fecha de Baja</Typography>
                        <Typography variant="body1" color="error">{dayjs(employee.termination_date).format('DD/MM/YYYY')}</Typography>
                      </Grid>
                    )}
                    {employee.vacation_days_override != null && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary">Días de Vacaciones (override)</Typography>
                        <Typography variant="body1">{employee.vacation_days_override} días</Typography>
                      </Grid>
                    )}
                  </Grid>

                  <Box mt={4} mb={2} display="flex" alignItems="center" gap={1}>
                    <AttachMoneyIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>Remuneración</Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary">Tipo de Pago</Typography>
                      <Typography variant="body1" fontWeight={500}>{employee.pay_type === 'monthly' ? 'Mensual' : 'Por Hora'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        {employee.pay_type === 'monthly' ? 'Sueldo Mensual' : 'Valor Hora'}
                      </Typography>
                      <Typography variant="body1" fontWeight={600} color="primary">
                        {employee.pay_type === 'monthly'
                          ? `$${Number(employee.monthly_salary || 0).toLocaleString('es-AR')}`
                          : `$${Number(employee.hourly_rate).toLocaleString('es-AR')}/h`}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Columna derecha */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={3}>
                {/* Talles */}
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <CheckroomIcon color="primary" />
                      <Typography variant="h6" fontWeight={600}>Talles (EPP)</Typography>
                    </Box>
                    <Divider sx={{ mb: 2.5 }} />
                    <Stack spacing={1.5}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Calzado</Typography>
                        <Typography variant="body1" fontWeight={500}>{employee.shoe_size || 'No registrado'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Remera / Camisa</Typography>
                        <Typography variant="body1" fontWeight={500}>{employee.shirt_size || 'No registrado'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Pantalón</Typography>
                        <Typography variant="body1" fontWeight={500}>{employee.pant_size || 'No registrado'}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Usuario vinculado */}
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <PersonIcon color="primary" />
                      <Typography variant="h6" fontWeight={600}>Acceso al Portal</Typography>
                    </Box>
                    <Divider sx={{ mb: 2.5 }} />
                    {employee.user ? (
                      <Stack spacing={1}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Usuario</Typography>
                          <Typography variant="body1" fontWeight={500}>{employee.user.name} {employee.user.lastname}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Email</Typography>
                          <Typography variant="body2">{employee.user.email}</Typography>
                        </Box>
                        <Box mt={0.5}>
                          <Chip label="Con acceso" color="success" size="small" />
                        </Box>
                      </Stack>
                    ) : (
                      <Box>
                        <Chip label="Sin acceso al portal" color="default" size="small" />
                        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                          El empleado no tiene usuario vinculado.
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* Notas */}
                {employee.notes && (
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)', border: '1px solid', borderColor: 'warning.light' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="subtitle2" fontWeight={600} color="warning.dark" gutterBottom>Notas internas</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>{employee.notes}</Typography>
                    </CardContent>
                  </Card>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Box>
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

      {/* Tab 2 — Presentismo */}
      {tabValue === 2 && (
        <Box>
          <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)' }}>
            <CardContent sx={{ p: 2 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <TextField
                  label="Desde"
                  type="date"
                  size="small"
                  value={attDateFrom}
                  onChange={(e) => setAttDateFrom(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                />
                <TextField
                  label="Hasta"
                  type="date"
                  size="small"
                  value={attDateTo}
                  onChange={(e) => setAttDateTo(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                />
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={() => loadAttendance(attDateFrom, attDateTo)}
                  sx={{ whiteSpace: 'nowrap', minWidth: 120 }}
                >
                  Buscar
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Registro de Ausencias
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {loadingAttendance ? (
                <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
              ) : attendances.length === 0 ? (
                <Alert severity="success">No hay ausencias registradas en el período seleccionado.</Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>Fecha</strong></TableCell>
                        <TableCell><strong>Tipo</strong></TableCell>
                        <TableCell><strong>Notas</strong></TableCell>
                        <TableCell align="center"><strong>Comprobante</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendances.map((att) => {
                        const attChipProps: Record<string, { label: string; color: 'primary' | 'error' | 'warning' | 'info'; icon: React.ReactElement }> = {
                          vacation:      { label: 'Vacaciones',    color: 'primary', icon: <BeachAccessIcon /> },
                          medical_leave: { label: 'Lic. Médica',   color: 'error',   icon: <LocalHospitalIcon /> },
                          justified:     { label: 'Justificada',   color: 'warning', icon: <FactCheckIcon /> },
                          absent:        { label: 'Ausente',       color: 'error',   icon: <EventBusyIcon /> },
                        };
                        const cfg = attChipProps[att.status] ?? { label: att.status, color: 'default' as const, icon: <EventBusyIcon /> };
                        return (
                          <TableRow key={att.id}>
                            <TableCell>{dayjs(att.date).format('DD/MM/YYYY')}</TableCell>
                            <TableCell>
                              <Chip size="small" icon={cfg.icon} label={cfg.label} color={cfg.color} variant="outlined" />
                            </TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>{att.notes || '—'}</TableCell>
                            <TableCell align="center">
                              {att.document_url ? (
                                <Tooltip title="Ver comprobante">
                                  <IconButton size="small" color="info" onClick={() => window.open(att.document_url, '_blank')}>
                                    <VisibilityIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              ) : '—'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tab 3 — Vacaciones y Licencias */}
      {tabValue === 3 && (
        <Box>
          {loadingLeave ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
          ) : (
            <Grid container spacing={3}>
              {/* Balance de vacaciones */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)', height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <BeachAccessIcon color="primary" />
                      <Typography variant="h6" fontWeight={600}>
                        Saldo de Vacaciones {new Date().getFullYear()}
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    {leaveBalance ? (
                      <Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2" color="text.secondary">Días correspondientes:</Typography>
                          <Typography variant="body2" fontWeight={600}>{leaveBalance.corresponding_days}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2" color="text.secondary">Días usados:</Typography>
                          <Typography variant="body2" fontWeight={600}>{leaveBalance.used_days}</Typography>
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Box display="flex" justifyContent="space-between" mb={1.5}>
                          <Typography variant="body1" fontWeight={700} color="primary">Días disponibles:</Typography>
                          <Typography variant="body1" fontWeight={700} color="primary">{leaveBalance.balance}</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={leaveBalance.corresponding_days > 0 ? Math.min((leaveBalance.used_days / leaveBalance.corresponding_days) * 100, 100) : 0}
                          sx={{ height: 10, borderRadius: 5, bgcolor: 'rgba(0,0,0,0.06)' }}
                          color={leaveBalance.balance === 0 ? 'error' : 'primary'}
                        />
                        <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
                          * Calculado según antigüedad (Art. 150 LCT).
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Sin información de balance.</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Tabla de solicitudes */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} mb={2}>Solicitudes de Licencia</Typography>
                    <Divider sx={{ mb: 2 }} />
                    {leaveRequests.length === 0 ? (
                      <Alert severity="info">No hay solicitudes registradas.</Alert>
                    ) : (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                              <TableCell><strong>Tipo</strong></TableCell>
                              <TableCell><strong>Desde</strong></TableCell>
                              <TableCell><strong>Hasta</strong></TableCell>
                              <TableCell align="center"><strong>Días</strong></TableCell>
                              <TableCell><strong>Estado</strong></TableCell>
                              <TableCell align="center"><strong>Acciones</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {leaveRequests.map((req) => {
                              const typeChips: Record<string, { label: string; color: 'primary' | 'error' | 'warning' | 'default'; icon: React.ReactElement }> = {
                                vacation:      { label: 'Vacaciones',  color: 'primary', icon: <BeachAccessIcon /> },
                                medical_leave: { label: 'Lic. Médica', color: 'error',   icon: <LocalHospitalIcon /> },
                                justified:     { label: 'Justificada', color: 'warning', icon: <FactCheckIcon /> },
                                other:         { label: 'Otro',        color: 'default', icon: <EventBusyIcon /> },
                              };
                              const typeCfg = typeChips[req.leave_type] ?? typeChips.other;
                              const statusChips: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
                                approved:  { label: 'Aprobada',  color: 'success' },
                                pending:   { label: 'Pendiente', color: 'warning' },
                                rejected:  { label: 'Rechazada', color: 'error' },
                                cancelled: { label: 'Cancelada', color: 'default' },
                              };
                              const statusCfg = statusChips[req.status] ?? { label: req.status, color: 'default' as const };
                              return (
                                <TableRow key={req.id}>
                                  <TableCell>
                                    <Chip size="small" icon={typeCfg.icon} label={typeCfg.label} color={typeCfg.color} variant="outlined" />
                                  </TableCell>
                                  <TableCell>{dayjs(req.start_date).format('DD/MM/YYYY')}</TableCell>
                                  <TableCell>{dayjs(req.end_date).format('DD/MM/YYYY')}</TableCell>
                                  <TableCell align="center"><strong>{req.total_days}</strong></TableCell>
                                  <TableCell>
                                    <Chip size="small" label={statusCfg.label} color={statusCfg.color} />
                                  </TableCell>
                                  <TableCell align="center">
                                    {req.status === 'pending' && (
                                      <>
                                        <Tooltip title="Aprobar">
                                          <IconButton size="small" color="success" onClick={() => handleApproveLeave(req.id)}>
                                            <ThumbUpIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Rechazar">
                                          <IconButton size="small" color="error" onClick={() => handleRejectLeave(req.id)}>
                                            <ThumbDownIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      </>
                                    )}
                                    {req.document_url && (
                                      <Tooltip title="Ver comprobante">
                                        <IconButton size="small" color="info" onClick={() => window.open(req.document_url, '_blank')}>
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
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
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
