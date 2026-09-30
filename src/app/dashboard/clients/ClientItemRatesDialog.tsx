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
  Paper,
  Divider,
  Stack,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  CloseOutlined as CloseIcon,
  EditOutlined as EditIcon,
  SaveOutlined as SaveIcon,
  CancelOutlined as CancelIcon,
  HistoryOutlined as HistoryIcon,
  AddOutlined as AddIcon,
} from '@mui/icons-material';
import GearSpinner from '../../../components/GearSpinner';
import {
  Client, BudgetItemType, BudgetItemTypeService, CreateBudgetItemTypeData, BudgetCurrency,
  ClientItemRate, ClientItemRateService, ClientItemRateHistoryEntry,
} from '../../../utils/api';
import { useAuth } from '../../../utils/auth';

interface ClientItemRatesDialogProps {
  open: boolean;
  onClose: () => void;
  client: Client | null;
}

const emptyItemTypeForm = (): CreateBudgetItemTypeData => ({
  name: '', unit_type: 'hours', unit_label: 'hs', display_order: 0, is_active: true,
});

// Tarifa por cliente y rubro de mano de obra (ej. "Hs Grúa" varía según el cliente) — solo
// visible/editable para quien tiene budget_prices_read, ya gateado por el botón que abre este
// diálogo en page.tsx. Ver FLOWS.md.
export default function ClientItemRatesDialog({ open, onClose, client }: ClientItemRatesDialogProps) {
  const { user } = useAuth();
  const permissions: string[] = Array.isArray((user as unknown as Record<string, unknown>)?.permissions)
    ? ((user as unknown as Record<string, unknown>).permissions as string[])
    : [];
  const hasItemTypesWrite = permissions.includes('admin_granted') || permissions.includes('budget_item_types_write');

  const [itemTypes, setItemTypes] = useState<BudgetItemType[]>([]);
  const [rates, setRates] = useState<ClientItemRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [rateValue, setRateValue] = useState('');
  const [currency, setCurrency] = useState<BudgetCurrency>('ARS');

  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; itemType: BudgetItemType | null; entries: ClientItemRateHistoryEntry[]; loading: boolean }>(
    { open: false, itemType: null, entries: [], loading: false }
  );

  // Alta rápida de rubro sin salir de este diálogo — mismo form que
  // dashboard/budget-item-types/page.tsx, para no tener que ir a otra pantalla.
  const [newItemType, setNewItemType] = useState<{ open: boolean; form: CreateBudgetItemTypeData }>(
    { open: false, form: emptyItemTypeForm() }
  );

  const loadData = useCallback(async () => {
    if (!client) return;
    try {
      setLoading(true);
      setError('');
      const [its, rts] = await Promise.all([
        BudgetItemTypeService.getAll(true),
        ClientItemRateService.getAll(client.id),
      ]);
      setItemTypes(its);
      setRates(rts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar tarifas.');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (open && client) {
      loadData();
      setEditingId(null);
    }
  }, [open, client, loadData]);

  const handleOpenEdit = (itemTypeId: number) => {
    const rate = rates.find(r => r.budget_item_type_id === itemTypeId);
    setEditingId(itemTypeId);
    setRateValue(rate ? String(rate.current_rate) : '');
    setCurrency(rate?.currency || 'ARS');
    setError('');
  };

  const handleSave = async () => {
    if (!client || editingId === null) return;
    if (!rateValue) {
      setError('Ingresá una tarifa.');
      return;
    }
    try {
      setError('');
      setSuccess('');
      await ClientItemRateService.upsert(client.id, editingId, Number(rateValue), currency);
      setSuccess('Tarifa guardada correctamente.');
      setEditingId(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la tarifa.');
    }
  };

  const handleCreateItemType = async () => {
    if (!newItemType.form.name.trim()) {
      setError('Ingresá un nombre para el rubro.');
      return;
    }
    try {
      setError('');
      setSuccess('');
      await BudgetItemTypeService.create(newItemType.form);
      setSuccess('Rubro creado correctamente.');
      setNewItemType({ open: false, form: emptyItemTypeForm() });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el rubro.');
    }
  };

  const handleShowHistory = async (itemType: BudgetItemType) => {
    if (!client) return;
    setHistoryDialog({ open: true, itemType, entries: [], loading: true });
    try {
      const entries = await ClientItemRateService.getHistory(client.id, itemType.id);
      setHistoryDialog({ open: true, itemType, entries, loading: false });
    } catch {
      setHistoryDialog({ open: true, itemType, entries: [], loading: false });
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight="bold">Tarifas por Rubro</Typography>
            <Typography variant="subtitle2" color="text.secondary">{client?.razonSocial}</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            {hasItemTypesWrite && (
              <Tooltip title="Nuevo rubro">
                <IconButton onClick={() => setNewItemType({ open: true, form: emptyItemTypeForm() })} size="small" color="primary">
                  <AddIcon />
                </IconButton>
              </Tooltip>
            )}
            <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 3, minHeight: '300px' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Tarifa que se usa para prellenar el valor unitario al presupuestarle este rubro a este
            cliente — sigue siendo editable por presupuesto, esto es solo el punto de partida.
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" py={5}><GearSpinner size={30} /></Box>
          ) : (
            <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>Rubro</strong></TableCell>
                    <TableCell align="right"><strong>Tarifa actual</strong></TableCell>
                    <TableCell align="center"><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {itemTypes.map((it) => {
                    const rate = rates.find(r => r.budget_item_type_id === it.id);
                    const isEditing = editingId === it.id;
                    return (
                      <TableRow key={it.id} hover>
                        <TableCell>{it.name}</TableCell>
                        <TableCell align="right">
                          {isEditing ? (
                            <Box display="flex" gap={1} justifyContent="flex-end">
                              <TextField type="number" size="small" value={rateValue} onChange={(e) => setRateValue(e.target.value)} sx={{ width: 110 }} />
                              <TextField select size="small" value={currency} onChange={(e) => setCurrency(e.target.value as BudgetCurrency)}
                                SelectProps={{ native: true }} sx={{ width: 80 }}>
                                <option value="ARS">ARS</option>
                                <option value="USD">USD</option>
                              </TextField>
                            </Box>
                          ) : (
                            rate ? `${rate.currency === 'USD' ? 'US$' : '$'}${rate.current_rate}` : '—'
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {isEditing ? (
                            <Box display="flex" justifyContent="center" gap={0.5}>
                              <Tooltip title="Guardar"><IconButton size="small" color="primary" onClick={handleSave}><SaveIcon fontSize="inherit" /></IconButton></Tooltip>
                              <Tooltip title="Cancelar"><IconButton size="small" onClick={() => setEditingId(null)}><CancelIcon fontSize="inherit" /></IconButton></Tooltip>
                            </Box>
                          ) : (
                            <Box display="flex" justifyContent="center" gap={0.5}>
                              <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenEdit(it.id)}><EditIcon fontSize="inherit" /></IconButton></Tooltip>
                              {rate && (
                                <Tooltip title="Historial"><IconButton size="small" onClick={() => handleShowHistory(it)}><HistoryIcon fontSize="inherit" /></IconButton></Tooltip>
                              )}
                            </Box>
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

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined" size="small">Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Historial de una tarifa puntual — log append-only, ver FLOWS.md */}
      <Dialog open={historyDialog.open} onClose={() => setHistoryDialog({ open: false, itemType: null, entries: [], loading: false })} maxWidth="xs" fullWidth>
        <DialogTitle>Historial — {historyDialog.itemType?.name}</DialogTitle>
        <DialogContent>
          {historyDialog.loading ? (
            <Box display="flex" justifyContent="center" py={3}><GearSpinner size={24} /></Box>
          ) : historyDialog.entries.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Sin historial.</Typography>
          ) : (
            historyDialog.entries.map((entry) => (
              <Box key={entry.id} sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" fontWeight="medium">
                  {entry.currency === 'USD' ? 'US$' : '$'}{entry.rate}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(entry.createdAt).toLocaleDateString('es-AR')}
                  {entry.changedBy ? ` · ${entry.changedBy.lastname}, ${entry.changedBy.name}` : ''}
                </Typography>
              </Box>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialog({ open: false, itemType: null, entries: [], loading: false })}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Alta rápida de rubro — mismo form que dashboard/budget-item-types/page.tsx */}
      <Dialog open={newItemType.open} onClose={() => setNewItemType({ open: false, form: emptyItemTypeForm() })} maxWidth="xs" fullWidth>
        <DialogTitle>Nuevo Rubro</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre *" fullWidth value={newItemType.form.name}
              onChange={(e) => setNewItemType({ ...newItemType, form: { ...newItemType.form, name: e.target.value } })}
            />
            <TextField
              label="Tipo de unidad" select fullWidth value={newItemType.form.unit_type}
              onChange={(e) => setNewItemType({ ...newItemType, form: { ...newItemType.form, unit_type: e.target.value as 'hours' | 'units' } })}
              SelectProps={{ native: true }}
            >
              <option value="hours">Horas</option>
              <option value="units">Unidades</option>
            </TextField>
            <TextField
              label="Etiqueta de unidad" fullWidth value={newItemType.form.unit_label}
              onChange={(e) => setNewItemType({ ...newItemType, form: { ...newItemType.form, unit_label: e.target.value } })}
            />
            <TextField
              label="Orden de visualización" type="number" fullWidth value={newItemType.form.display_order}
              onChange={(e) => setNewItemType({ ...newItemType, form: { ...newItemType.form, display_order: Number(e.target.value) } })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={newItemType.form.is_active}
                  onChange={(e) => setNewItemType({ ...newItemType, form: { ...newItemType.form, is_active: e.target.checked } })}
                />
              }
              label="Activo"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewItemType({ open: false, form: emptyItemTypeForm() })}>Cancelar</Button>
          <Button onClick={handleCreateItemType} variant="contained">Crear</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
