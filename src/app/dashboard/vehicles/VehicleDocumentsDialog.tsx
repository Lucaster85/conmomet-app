import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Box,
  Tooltip,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Paper,
  Divider,
  Stack,
  Zoom,
  Chip,
  MenuItem,
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Payment as PaymentIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import {
  Vehicle,
  EntityDocument,
  EntityDocumentService,
  DocumentCategory,
  DocumentCategoryService,
} from '../../../utils/api';

interface VehicleDocumentsDialogProps {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
}

const STATUS_CONFIG = {
  permanent: { label: 'Permanente', color: 'default', icon: <CheckCircleIcon fontSize="small" /> },
  valid: { label: 'Al Día', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  expiring_soon: { label: 'Vence Pronto', color: 'warning', icon: <WarningIcon fontSize="small" /> },
  expired: { label: 'Vencido', color: 'error', icon: <ErrorIcon fontSize="small" /> },
  resolved: { label: 'Resuelto', color: 'default', icon: <CheckCircleIcon fontSize="small" /> },
} as const;

export default function VehicleDocumentsDialog({ open, onClose, vehicle }: VehicleDocumentsDialogProps) {
  const [documents, setDocuments] = useState<EntityDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [docCategories, setDocCategories] = useState<DocumentCategory[]>([]);
  const [docCategoriesLoaded, setDocCategoriesLoaded] = useState(false);

  // History State
  const [historyDocs, setHistoryDocs] = useState<EntityDocument[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadDocuments = useCallback(async () => {
    if (!vehicle) return;
    try {
      setLoading(true);
      setError('');
      const docs = await EntityDocumentService.getAll('vehicle', vehicle.id);
      setDocuments(docs);
    } catch (err) {
      console.error(err);
      setError('Error al cargar documentos del vehículo.');
    } finally {
      setLoading(false);
    }
  }, [vehicle]);

  useEffect(() => {
    if (open && vehicle) {
      loadDocuments();
      resetForm();
    }
  }, [open, vehicle, loadDocuments]);

  const loadDocCategoriesIfNeeded = async () => {
    if (docCategoriesLoaded) return;
    try {
      const cats = await DocumentCategoryService.getAll('vehicle');
      setDocCategories(Array.isArray(cats) ? cats : []);
      setDocCategoriesLoaded(true);
    } catch {
      // Non-critical
    }
  };

  const resetForm = () => {
    setForm({ title: '', notes: '', expiration_date: '', notify_days_before: 15 });
    setFile(null);
    setHasExpiration(false);
    setIsRenewable(true);
    setSelectedCategoryId('');
    setEditingDoc(null);
    setError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    loadDocCategoriesIfNeeded();
    setUploadDialog(true);
  };

  const handleOpenEdit = (doc: EntityDocument) => {
    resetForm();
    setEditingDoc(doc);
    setForm({
      title: doc.title,
      notes: doc.notes || '',
      expiration_date: doc.expiration_date || '',
      notify_days_before: doc.notify_days_before || 15,
    });
    setHasExpiration(!!doc.expiration_date);
    setIsRenewable(doc.is_renewable !== undefined ? doc.is_renewable : true);
    setSelectedCategoryId(doc.document_category_id ? doc.document_category_id.toString() : '');
    setFile(null);
    loadDocCategoriesIfNeeded();
    setUploadDialog(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;
    if (!form.title) {
      setError('El título es obligatorio.');
      return;
    }

    try {
      setError('');
      setSuccess('');
      if (editingDoc) {
        await EntityDocumentService.update(editingDoc.id, {
          title: form.title,
          notes: form.notes,
          expiration_date: hasExpiration && form.expiration_date ? form.expiration_date : undefined,
          notify_days_before: hasExpiration ? form.notify_days_before : undefined,
        }, file || undefined);
        setSuccess('Documento actualizado correctamente.');
      } else {
        await EntityDocumentService.create({
          title: form.title,
          notes: form.notes,
          entity_type: 'vehicle',
          entity_id: vehicle.id,
          expiration_date: hasExpiration && form.expiration_date ? form.expiration_date : undefined,
          notify_days_before: hasExpiration ? form.notify_days_before : undefined,
          is_renewable: isRenewable,
          document_category_id: selectedCategoryId ? Number(selectedCategoryId) : undefined,
        }, file || undefined);
        setSuccess('Documento guardado correctamente.');
      }

      setUploadDialog(false);
      resetForm();
      loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar documento.');
    }
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    if (!file) {
      setError('Debe seleccionar el nuevo archivo.');
      return;
    }
    if (!form.expiration_date) {
      setError('La fecha de vencimiento es obligatoria.');
      return;
    }

    try {
      setError('');
      setSuccess('');
      await EntityDocumentService.renew(editingDoc.id, {
        expiration_date: form.expiration_date,
        notify_days_before: form.notify_days_before,
      }, file);
      setSuccess('Documento renovado correctamente.');
      setRenewDialog(false);
      resetForm();
      loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al renovar documento.');
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    if (!file) {
      setError('Debe adjuntar el comprobante.');
      return;
    }

    try {
      setError('');
      setSuccess('');
      await EntityDocumentService.resolve(editingDoc.id, file);
      setSuccess('Documento resuelto correctamente.');
      setResolveDialog(false);
      resetForm();
      loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al resolver documento.');
    }
  };

  const handleOpenHistory = async (docId: number) => {
    try {
      setLoadingHistory(true);
      setError('');
      setHistoryDialog(true);
      const hist = await EntityDocumentService.getHistory(docId);
      setHistoryDocs(hist);
    } catch (err) {
      setError('Error al obtener el historial de renovaciones.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDelete = async (docId: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este documento?')) return;
    try {
      setError('');
      setSuccess('');
      await EntityDocumentService.delete(docId);
      setSuccess('Documento eliminado correctamente.');
      loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar documento.');
    }
  };

  const filteredDocuments = documents.filter(doc => showResolved ? true : doc.alert_status !== 'resolved');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Documentos y Legajo del Vehículo
          </Typography>
          <Typography variant="subtitle2" color="primary.main">
            {vehicle?.brand} {vehicle?.model} ({vehicle?.plate})
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />

      <DialogContent sx={{ p: 3, minHeight: '350px' }}>
        {/* Alerts */}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {/* Action Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <FormControlLabel
            control={<Switch size="small" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />}
            label="Mostrar resueltos"
          />
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={handleOpenCreate}
            size="small"
          >
            Subir Documento
          </Button>
        </Box>

        {/* Form Dialog for Upload / Edit */}
        <Dialog open={uploadDialog} onClose={resetForm} maxWidth="sm" fullWidth>
          <DialogTitle>{editingDoc ? 'Editar Documento' : 'Subir Documento'}</DialogTitle>
          <form onSubmit={handleUploadSubmit}>
            <DialogContent dividers>
              <Stack spacing={2}>
                <TextField
                  label="Título del Documento"
                  required
                  fullWidth
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
                
                {!editingDoc && (
                  <TextField
                    label="Categoría"
                    select
                    fullWidth
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                  >
                    <MenuItem value="">— Ninguna —</MenuItem>
                    {docCategories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                    ))}
                  </TextField>
                )}

                <TextField
                  label="Notas / Descripción"
                  fullWidth
                  multiline
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />

                <FormControlLabel
                  control={<Switch checked={hasExpiration} onChange={(e) => setHasExpiration(e.target.checked)} />}
                  label="Tiene Vencimiento"
                />

                {hasExpiration && (
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label="Fecha de Vencimiento"
                      type="date"
                      required={hasExpiration}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={form.expiration_date}
                      onChange={(e) => setForm({ ...form, expiration_date: e.target.value })}
                    />
                    <TextField
                      label="Alertar Días Antes"
                      type="number"
                      required={hasExpiration}
                      fullWidth
                      value={form.notify_days_before}
                      onChange={(e) => setForm({ ...form, notify_days_before: Number(e.target.value) })}
                    />
                  </Stack>
                )}

                {hasExpiration && (
                  <FormControlLabel
                    control={<Switch checked={isRenewable} onChange={(e) => setIsRenewable(e.target.checked)} />}
                    label="Es Renovable (si no es renovable, se marca como pago/resuelto)"
                  />
                )}

                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Archivo (PDF, Imagen) {editingDoc && '(opcional para reemplazar)'}
                  </Typography>
                  <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} size="small">
                    {file ? file.name : 'Seleccionar Archivo'}
                    <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </Button>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={resetForm}>Cancelar</Button>
              <Button type="submit" variant="contained">Guardar</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Form Dialog for Renewal */}
        <Dialog open={renewDialog} onClose={resetForm} maxWidth="xs" fullWidth>
          <DialogTitle>Renovar Legajo</DialogTitle>
          <form onSubmit={handleRenewSubmit}>
            <DialogContent dividers>
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Suba la nueva versión firmada o comprobante vigente para <strong>{editingDoc?.title}</strong>.
                </Typography>
                <TextField
                  label="Nueva Fecha de Vencimiento"
                  type="date"
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={form.expiration_date}
                  onChange={(e) => setForm({ ...form, expiration_date: e.target.value })}
                />
                <TextField
                  label="Alertar Días Antes"
                  type="number"
                  required
                  fullWidth
                  value={form.notify_days_before}
                  onChange={(e) => setForm({ ...form, notify_days_before: Number(e.target.value) })}
                />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Nuevo Archivo *</Typography>
                  <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} size="small">
                    {file ? file.name : 'Adjuntar Documento'}
                    <input type="file" hidden required onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </Button>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={resetForm}>Cancelar</Button>
              <Button type="submit" variant="contained" color="warning">Renovar</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Form Dialog for Resolving (Payment) */}
        <Dialog open={resolveDialog} onClose={resetForm} maxWidth="xs" fullWidth>
          <DialogTitle>Resolver / Subir Comprobante</DialogTitle>
          <form onSubmit={handleResolveSubmit}>
            <DialogContent dividers>
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Suba el comprobante de pago o constancia física de resolución para <strong>{editingDoc?.title}</strong>.
                </Typography>
                <Box>
                  <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} size="small">
                    {file ? file.name : 'Adjuntar Comprobante *'}
                    <input type="file" hidden required onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </Button>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={resetForm}>Cancelar</Button>
              <Button type="submit" variant="contained" color="success">Resolver</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={historyDialog} onClose={() => setHistoryDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Historial de Renovaciones</DialogTitle>
          <DialogContent dividers>
            {loadingHistory ? (
              <Box display="flex" justifyContent="center" py={3}><CircularProgress /></Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Fecha Carga</strong></TableCell>
                      <TableCell><strong>Vencimiento</strong></TableCell>
                      <TableCell align="center"><strong>Archivo</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyDocs.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>{new Date(doc.created_at).toLocaleDateString('es-AR')}</TableCell>
                        <TableCell>{doc.expiration_date ? new Date(doc.expiration_date + 'T00:00:00').toLocaleDateString('es-AR') : 'Permanente'}</TableCell>
                        <TableCell align="center">
                          {doc.file_url ? (
                            <IconButton size="small" color="info" onClick={() => window.open(doc.file_url, '_blank')}>
                              <VisibilityIcon fontSize="inherit" />
                            </IconButton>
                          ) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setHistoryDialog(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>

        {/* Table legajo */}
        {loading && documents.length === 0 ? (
          <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>
        ) : (
          <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
            <Table size="small">
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
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">No hay documentos registrados.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((doc) => {
                    const statusCfg = STATUS_CONFIG[doc.computed_status] || STATUS_CONFIG.permanent;
                    const isCritical = doc.computed_status === 'expiring_soon' || doc.computed_status === 'expired';
                    
                    return (
                      <TableRow key={doc.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">{doc.title}</Typography>
                          {doc.notes && <Typography variant="caption" color="text.secondary" display="block">{doc.notes}</Typography>}
                        </TableCell>
                        <TableCell>
                          {doc.expiration_date ? new Date(doc.expiration_date + 'T00:00:00').toLocaleDateString('es-AR') : 'Permanente'}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            icon={statusCfg.icon} 
                            label={statusCfg.label} 
                            color={statusCfg.color as any} 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {doc.file_url ? (
                            <Tooltip title="Ver Archivo">
                              <IconButton size="small" color="info" onClick={() => window.open(doc.file_url, '_blank')}>
                                <VisibilityIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          ) : '—'}
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" justifyContent="center" gap={0.5}>
                            {isCritical && doc.is_renewable && (
                              <Tooltip title="Renovar">
                                <IconButton size="small" color="warning" onClick={() => {
                                  setEditingDoc(doc);
                                  setForm({ ...form, title: doc.title, notify_days_before: doc.notify_days_before || 15 });
                                  setFile(null);
                                  setRenewDialog(true);
                                }}>
                                  <RefreshIcon fontSize="inherit" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {isCritical && !doc.is_renewable && (
                              <Tooltip title="Resolver Comprobante">
                                <IconButton size="small" color="success" onClick={() => {
                                  setEditingDoc(doc);
                                  setFile(null);
                                  setResolveDialog(true);
                                }}>
                                  <PaymentIcon fontSize="inherit" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {doc.previous_record_id && (
                              <Tooltip title="Ver Historial">
                                <IconButton size="small" color="info" onClick={() => handleOpenHistory(doc.id)}>
                                  <HistoryIcon fontSize="inherit" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Editar">
                              <IconButton size="small" color="primary" onClick={() => handleOpenEdit(doc)}>
                                <EditIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton size="small" color="error" onClick={() => handleDelete(doc.id)}>
                                <DeleteIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" size="small">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
