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
  Paper,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import {
  Client, BudgetItemType, BudgetItemTypeService, BudgetCurrency,
  ClientItemRate, ClientItemRateService, ClientItemRateHistoryEntry,
} from '../../../utils/api';

interface ClientItemRatesDialogProps {
  open: boolean;
  onClose: () => void;
  client: Client | null;
}

// Tarifa por cliente y rubro de mano de obra (ej. "Hs Grúa" varía según el cliente) — solo
// visible/editable para quien tiene budget_prices_read, ya gateado por el botón que abre este
// diálogo en page.tsx. Ver FLOWS.md.
export default function ClientItemRatesDialog({ open, onClose, client }: ClientItemRatesDialogProps) {
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
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
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
            <Box display="flex" justifyContent="center" py={5}><CircularProgress size={30} /></Box>
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
            <Box display="flex" justifyContent="center" py={3}><CircularProgress size={24} /></Box>
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
    </>
  );
}
