'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Paper, Chip, Button, CircularProgress, Divider, Stack, Grid, Card,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete,
} from '@mui/material';
import { ArrowBackOutlined as BackIcon, PrintOutlined as PrintIcon, SwapHorizOutlined as StatusIcon, OpenInNewOutlined as OpenIcon } from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import FeedbackModal from '../../../../components/FeedbackModal';
import {
  Tool, ToolService, ToolStatus, ToolStatusLogEntry,
  AssetAssignment, AssetAssignmentService, AssetAssignmentStatus, AssetCondition, AssetCompleteness,
  Employee, EmployeeService,
} from '../../../../utils/api';

const STATUS_LABELS: Record<ToolStatus, string> = {
  available: 'Disponible', reserved: 'Reservada', delivered: 'Entregada',
  in_repair: 'En reparación', retired: 'De baja', lost: 'Extraviada',
};
const STATUS_COLORS: Record<ToolStatus, 'success' | 'info' | 'warning' | 'default' | 'error'> = {
  available: 'success', reserved: 'info', delivered: 'warning', in_repair: 'warning', retired: 'default', lost: 'error',
};
const CHANGEABLE_STATUSES: ToolStatus[] = ['available', 'reserved', 'in_repair', 'retired', 'lost'];

const ASSIGNMENT_STATUS_LABELS: Record<AssetAssignmentStatus, string> = { reserved: 'Reservada', delivered: 'Entregada', returned: 'Devuelta' };
const CONDITION_LABELS: Record<AssetCondition, string> = { bueno: 'Bueno', regular: 'Regular', malo: 'Malo' };
const COMPLETENESS_LABELS: Record<AssetCompleteness, string> = { completo: 'Completo', faltante: 'Faltante' };

export default function ToolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [tool, setTool] = useState<Tool | null>(null);
  const [statusLogs, setStatusLogs] = useState<ToolStatusLogEntry[]>([]);
  const [assignments, setAssignments] = useState<AssetAssignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrUrl, setQrUrl] = useState('');

  // Solo empleados con usuario vinculado pueden ser responsables de reparación — son los únicos
  // que van a poder loguearse y ver el aviso en su dashboard/portal.
  const repairEligibleEmployees = employees.filter(e => e.user_id);

  const [statusDialog, setStatusDialog] = useState<{ open: boolean; status: ToolStatus; notes: string; responsible_employee_id: number | null }>({ open: false, status: 'available', notes: '', responsible_employee_id: null });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [t, logs, assigns, emps] = await Promise.all([
        ToolService.getById(id),
        ToolService.getStatusHistory(id),
        AssetAssignmentService.getAll({ tool_id: id }),
        EmployeeService.getAll(),
      ]);
      setTool(t);
      setStatusLogs(logs);
      setAssignments(assigns);
      setEmployees(Array.isArray(emps) ? emps : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la herramienta');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { if (id) loadData(); }, [id, loadData]);
  useEffect(() => { if (typeof window !== 'undefined') setQrUrl(window.location.href); }, []);

  const handleOpenStatus = () => {
    if (!tool) return;
    setStatusDialog({
      open: true,
      status: tool.status === 'delivered' ? 'available' : tool.status,
      notes: '',
      responsible_employee_id: tool.repair_responsible_id ?? null,
    });
  };

  const handleSubmitStatus = async () => {
    if (!tool) return;
    if (statusDialog.status === 'in_repair' && !statusDialog.responsible_employee_id) {
      setError('Debés asignar un responsable de la reparación.');
      return;
    }
    try {
      await ToolService.changeStatus(tool.id, statusDialog.status, statusDialog.notes || undefined, statusDialog.responsible_employee_id ?? undefined);
      setSuccess('Estado actualizado');
      setStatusDialog({ open: false, status: 'available', notes: '', responsible_employee_id: null });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar el estado');
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  if (!tool) return <Typography color="text.secondary" textAlign="center" py={8}>Herramienta no encontrada.</Typography>;

  return (
    <Box>
      <Box className="no-print" mb={3}>
        <Button startIcon={<BackIcon />} onClick={() => router.push('/dashboard/tools')}>Volver a Herramientas</Button>
      </Box>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3 }} className="no-print">
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
              <Box>
                <Typography variant="h5" fontWeight={700}>{tool.name}</Typography>
                <Typography variant="body2" color="text.secondary">{tool.toolType?.name} · Código: {tool.reference_code}</Typography>
              </Box>
              <Box display="flex" gap={1} alignItems="center">
                <Chip label={STATUS_LABELS[tool.status]} color={STATUS_COLORS[tool.status]} />
                <Button size="small" variant="outlined" startIcon={<StatusIcon />} disabled={tool.status === 'delivered'} onClick={handleOpenStatus}>
                  Cambiar estado
                </Button>
              </Box>
            </Box>
            {tool.status === 'in_repair' && tool.repairResponsible && (
              <Typography variant="body2" color="text.secondary" mt={1}>
                Responsable de la reparación: <strong>{tool.repairResponsible.lastname}, {tool.repairResponsible.name}</strong>
              </Typography>
            )}
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">Marca</Typography>
                <Typography>{tool.brand || '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">Modelo</Typography>
                <Typography>{tool.model || '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">N° de serie</Typography>
                <Typography>{tool.serial_number || '—'}</Typography>
              </Grid>
            </Grid>
            {tool.notes && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary">Notas</Typography>
                <Typography>{tool.notes}</Typography>
              </>
            )}
          </Paper>

          <Paper sx={{ p: 3, mt: 3 }} className="no-print">
            <Typography variant="h6" fontWeight={700} mb={2}>Historial de estados</Typography>
            {statusLogs.length === 0 ? (
              <Typography color="text.secondary">Sin cambios registrados todavía.</Typography>
            ) : (
              <>
                {/* Mobile Cards */}
                <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                  <Stack spacing={1}>
                    {statusLogs.map(log => (
                      <Card key={log.id} sx={{ p: 1.5 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {log.from_status ? `${STATUS_LABELS[log.from_status as ToolStatus] || log.from_status} → ` : ''}{STATUS_LABELS[log.to_status as ToolStatus] || log.to_status}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {new Date(log.changed_at).toLocaleString('es-AR')} · {log.changedByUser ? `${log.changedByUser.lastname}, ${log.changedByUser.name}` : '—'}
                        </Typography>
                        {log.responsibleEmployee && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Responsable: {log.responsibleEmployee.lastname}, {log.responsibleEmployee.name}
                          </Typography>
                        )}
                        {log.notes && <Typography variant="body2">{log.notes}</Typography>}
                      </Card>
                    ))}
                  </Stack>
                </Box>
                {/* Desktop Table */}
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow><TableCell>Fecha</TableCell><TableCell>Cambio</TableCell><TableCell>Quién</TableCell><TableCell>Notas</TableCell></TableRow>
                      </TableHead>
                      <TableBody>
                        {statusLogs.map(log => (
                          <TableRow key={log.id}>
                            <TableCell>{new Date(log.changed_at).toLocaleString('es-AR')}</TableCell>
                            <TableCell>{log.from_status ? `${STATUS_LABELS[log.from_status as ToolStatus] || log.from_status} → ` : ''}{STATUS_LABELS[log.to_status as ToolStatus] || log.to_status}</TableCell>
                            <TableCell>{log.changedByUser ? `${log.changedByUser.lastname}, ${log.changedByUser.name}` : '—'}</TableCell>
                            <TableCell>
                              {log.notes || '—'}
                              {log.responsibleEmployee && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Responsable: {log.responsibleEmployee.lastname}, {log.responsibleEmployee.name}
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </>
            )}
          </Paper>

          <Paper sx={{ p: 3, mt: 3 }} className="no-print">
            <Typography variant="h6" fontWeight={700} mb={2}>Historial de asignaciones</Typography>
            {assignments.length === 0 ? (
              <Typography color="text.secondary">Todavía no se asignó a ningún proyecto.</Typography>
            ) : (
              <>
                {/* Mobile Cards */}
                <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                  <Stack spacing={1}>
                    {assignments.map(a => (
                      <Card key={a.id} sx={{ p: 1.5 }}>
                        {a.project ? (
                          <Typography variant="body2" fontWeight={600} display="flex" alignItems="center" gap={0.5}
                            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                            onClick={() => router.push(`/dashboard/projects/${a.project!.id}`)}>
                            {a.project.name} <OpenIcon fontSize="inherit" />
                          </Typography>
                        ) : (
                          <Typography variant="body2" fontWeight={600}>Sin proyecto</Typography>
                        )}
                        <Typography variant="body2">{a.employee ? `${a.employee.lastname}, ${a.employee.name}` : 'Sin responsable'}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Entrega: {a.delivered_date || '—'} {a.delivery_condition ? `(${CONDITION_LABELS[a.delivery_condition]}, ${COMPLETENESS_LABELS[a.delivery_completeness!]})` : ''}
                        </Typography>
                        {a.returned_date && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Devolución: {a.returned_date} {a.return_condition ? `(${CONDITION_LABELS[a.return_condition]}, ${COMPLETENESS_LABELS[a.return_completeness!]})` : ''}
                          </Typography>
                        )}
                        <Chip size="small" label={ASSIGNMENT_STATUS_LABELS[a.status]} sx={{ mt: 0.5 }} />
                      </Card>
                    ))}
                  </Stack>
                </Box>
                {/* Desktop Table */}
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Proyecto</TableCell><TableCell>Responsable</TableCell>
                          <TableCell>Entrega</TableCell><TableCell>Devolución</TableCell><TableCell>Estado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {assignments.map(a => (
                          <TableRow key={a.id}>
                            <TableCell>
                              {a.project ? (
                                <Box display="flex" alignItems="center" gap={0.5}
                                  sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                  onClick={() => router.push(`/dashboard/projects/${a.project!.id}`)}>
                                  {a.project.name} <OpenIcon fontSize="inherit" />
                                </Box>
                              ) : '—'}
                            </TableCell>
                            <TableCell>{a.employee ? `${a.employee.lastname}, ${a.employee.name}` : '—'}</TableCell>
                            <TableCell>{a.delivered_date || '—'}</TableCell>
                            <TableCell>{a.returned_date || '—'}</TableCell>
                            <TableCell><Chip size="small" label={ASSIGNMENT_STATUS_LABELS[a.status]} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, textAlign: 'center' }} className="print-area">
            <Typography variant="subtitle2" color="text.secondary" gutterBottom className="no-print">Código QR</Typography>
            <Box display="flex" justifyContent="center" py={2}>
              {qrUrl && <QRCodeSVG value={qrUrl} size={180} />}
            </Box>
            <Typography fontWeight={700}>{tool.name}</Typography>
            <Typography variant="body2" color="text.secondary">{tool.reference_code}</Typography>
            <Button className="no-print" fullWidth variant="outlined" startIcon={<PrintIcon />} sx={{ mt: 2 }} onClick={() => window.print()}>
              Imprimir etiqueta
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, status: 'available', notes: '', responsible_employee_id: null })} maxWidth="xs" fullWidth>
        <DialogTitle>Cambiar estado</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nuevo estado" select fullWidth value={statusDialog.status}
              onChange={(e) => setStatusDialog({ ...statusDialog, status: e.target.value as ToolStatus })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              {CHANGEABLE_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </TextField>
            {statusDialog.status === 'in_repair' && (
              <Autocomplete
                options={repairEligibleEmployees}
                getOptionLabel={(e) => `${e.lastname}, ${e.name}`}
                value={repairEligibleEmployees.find(e => e.id === statusDialog.responsible_employee_id) || null}
                onChange={(_, val) => setStatusDialog({ ...statusDialog, responsible_employee_id: val ? val.id : null })}
                renderInput={(params) => <TextField {...params} label="Responsable de reparación *" placeholder="Buscar empleado..." helperText="Solo empleados con usuario del sistema vinculado — es quien va a ver el aviso" />}
              />
            )}
            <TextField label="Notas" fullWidth multiline rows={2} value={statusDialog.notes}
              onChange={(e) => setStatusDialog({ ...statusDialog, notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, status: 'available', notes: '', responsible_employee_id: null })}>Cancelar</Button>
          <Button onClick={handleSubmitStatus} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
