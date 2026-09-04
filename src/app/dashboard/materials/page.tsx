'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Tooltip, TextField, Stack, Chip, Switch, FormControlLabel,
  InputAdornment,
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon,
  Search as SearchIcon, UploadFile as UploadIcon, History as HistoryIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import {
  Material, MaterialService, CreateMaterialData, MaterialUnit, MaterialUnitService,
  BudgetCurrency, MaterialCostHistoryEntry,
} from '../../../utils/api';
import { useAuth } from '../../../utils/auth';

const emptyForm = (): CreateMaterialData => ({ description: '', material_unit_id: 0, current_cost: null, currency: 'ARS', is_active: true });

export default function MaterialsPage() {
  const { user } = useAuth();
  const permissions: string[] = Array.isArray((user as unknown as Record<string, unknown>)?.permissions)
    ? ((user as unknown as Record<string, unknown>).permissions as string[])
    : [];
  const hasCostsRead = permissions.includes('admin_granted') || permissions.includes('material_costs_read');

  const [items, setItems] = useState<Material[]>([]);
  const [units, setUnits] = useState<MaterialUnit[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Material | null>(null);
  const [form, setForm] = useState<CreateMaterialData>(emptyForm());
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: Material | null }>({ open: false, item: null });

  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<{ description: string; unit: string; cost: number | null; currency: BudgetCurrency | null }[] | null>(null);

  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; item: Material | null; entries: MaterialCostHistoryEntry[]; loading: boolean }>(
    { open: false, item: null, entries: [], loading: false }
  );

  const handleOpenHistory = async (item: Material) => {
    setHistoryDialog({ open: true, item, entries: [], loading: true });
    try {
      const entries = await MaterialService.getCostHistory(item.id);
      setHistoryDialog({ open: true, item, entries, loading: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el historial');
      setHistoryDialog({ open: false, item: null, entries: [], loading: false });
    }
  };

  const loadData = async (q?: string) => {
    try {
      setLoading(true);
      setError('');
      const [mats, mUnits] = await Promise.all([
        MaterialService.getAll(q ? { q } : undefined),
        MaterialUnitService.getAll(true),
      ]);
      setItems(Array.isArray(mats) ? mats : []);
      setUnits(Array.isArray(mUnits) ? mUnits : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar materiales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const timeout = setTimeout(() => loadData(search || undefined), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm(emptyForm());
    setOpenDialog(true);
  };

  const handleOpenEdit = (item: Material) => {
    setEditingItem(item);
    setForm({
      description: item.description,
      material_unit_id: item.material_unit_id,
      current_cost: item.current_cost ?? null,
      currency: item.currency ?? 'ARS',
      is_active: item.is_active,
    });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.description.trim() || !form.material_unit_id) {
      setError('Descripción y unidad son obligatorias');
      return;
    }
    try {
      if (editingItem) {
        await MaterialService.update(editingItem.id, form);
        setSuccess('Material actualizado');
      } else {
        await MaterialService.create(form);
        setSuccess('Material creado');
      }
      setOpenDialog(false);
      loadData(search || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.item) return;
    try {
      await MaterialService.delete(deleteDialog.item.id);
      setDeleteDialog({ open: false, item: null });
      setSuccess('Material eliminado');
      loadData(search || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setImporting(true);
      const rows = await MaterialService.importPreview(file);
      setImportPreview(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar el Excel');
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview) return;
    try {
      const unitsByLabel = new Map(units.map(u => [u.label.toLowerCase(), u]));
      const newUnits: MaterialUnit[] = [];

      // `items` puede estar filtrado por el buscador — traemos el catálogo completo para
      // resolver duplicados contra TODOS los materiales, no solo los que se ven en pantalla.
      const allMaterials = await MaterialService.getAll();
      const materialsByDescription = new Map(allMaterials.map(m => [m.description.toLowerCase(), m]));

      let created = 0;
      let updated = 0;

      for (const row of importPreview) {
        const label = (row.unit || 'u').trim() || 'u';
        const key = label.toLowerCase();
        let unit = unitsByLabel.get(key);
        if (!unit) {
          unit = await MaterialUnitService.create({ label });
          unitsByLabel.set(key, unit);
          newUnits.push(unit);
        }

        const descKey = row.description.trim().toLowerCase();
        const existing = materialsByDescription.get(descKey);
        if (!existing) {
          const createdMaterial = await MaterialService.create({
            description: row.description,
            material_unit_id: unit.id,
            current_cost: row.cost,
            currency: row.currency || 'ARS',
          });
          materialsByDescription.set(descKey, createdMaterial);
          created++;
        } else if (row.cost != null && existing.current_cost !== row.cost) {
          const updatedMaterial = await MaterialService.update(existing.id, { current_cost: row.cost, currency: row.currency || 'ARS' });
          materialsByDescription.set(descKey, updatedMaterial);
          updated++;
        }
      }

      if (newUnits.length > 0) setUnits(prev => [...prev, ...newUnits]);
      setImportPreview(null);
      setSuccess(`${created} material(es) nuevo(s), ${updated} actualizado(s)`);
      loadData(search || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al confirmar la importación');
    }
  };

  if (loading && items.length === 0) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Typography variant="h4" fontWeight="bold">Materiales</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => loadData(search || undefined)} size="small">Actualizar</Button>
          <Button variant="outlined" component="a" href="/plantillas/plantilla-materiales.xlsx" download startIcon={<DownloadIcon />} size="small">
            Descargar plantilla
          </Button>
          <Button variant="outlined" component="label" startIcon={<UploadIcon />} size="small" disabled={importing}>
            {importing ? 'Importando…' : 'Importar Excel'}
            <input type="file" hidden accept=".xlsx,.xls" onChange={handleImportExcel} />
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">Nuevo Material</Button>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" mb={2}>
        Catálogo de materiales nomenclados (ej. &quot;Bulón 1/2 x 1/4&quot;). {hasCostsRead
          ? 'El costo cargado acá es el costo real — no se muestra al cliente, se usa para calcular márgenes por obra.'
          : 'No tenés permiso para ver ni cargar el costo real de los materiales.'}
      </Typography>

      <TextField
        placeholder="Buscar material..."
        size="small"
        fullWidth
        sx={{ mb: 2 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
      />

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell><strong>Descripción</strong></TableCell>
              <TableCell><strong>Unidad</strong></TableCell>
              {hasCostsRead && <TableCell><strong>Costo</strong></TableCell>}
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={hasCostsRead ? 5 : 4} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">No hay materiales que coincidan</Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell><Typography fontWeight="medium">{item.description}</Typography></TableCell>
                  <TableCell>{item.materialUnit?.label}</TableCell>
                  {hasCostsRead && (
                    <TableCell>
                      {item.current_cost != null ? `${item.currency === 'USD' ? 'US$' : '$'}${item.current_cost}` : <Typography variant="caption" color="text.secondary">Sin costo cargado</Typography>}
                    </TableCell>
                  )}
                  <TableCell><Chip size="small" label={item.is_active ? 'Activo' : 'Inactivo'} color={item.is_active ? 'success' : 'default'} /></TableCell>
                  <TableCell align="center">
                    {hasCostsRead && (
                      <Tooltip title="Ver historial de costos"><IconButton size="small" color="secondary" onClick={() => handleOpenHistory(item)}><HistoryIcon fontSize="small" /></IconButton></Tooltip>
                    )}
                    <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenEdit(item)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item })}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingItem ? 'Editar Material' : 'Nuevo Material'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Descripción *" fullWidth value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} helperText='Ej: "Bulón 1/2 x 1/4"' />
            <TextField label="Unidad *" select fullWidth value={form.material_unit_id || ''}
              onChange={(e) => setForm({ ...form, material_unit_id: Number(e.target.value) })}
              SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
              <option value="">— Seleccionar —</option>
              {units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
            </TextField>
            {hasCostsRead && (
              <Stack direction="row" spacing={2}>
                <TextField label="Costo real" type="number" fullWidth value={form.current_cost ?? ''}
                  onChange={(e) => setForm({ ...form, current_cost: e.target.value ? Number(e.target.value) : null })} />
                <TextField label="Moneda" select fullWidth value={form.currency || 'ARS'}
                  onChange={(e) => setForm({ ...form, currency: e.target.value as BudgetCurrency })}
                  SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                </TextField>
              </Stack>
            )}
            <FormControlLabel control={<Switch checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />} label="Activo" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">{editingItem ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Eliminar el material <strong>{deleteDialog.item?.description}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!importPreview} onClose={() => setImportPreview(null)} maxWidth="md" fullWidth>
        <DialogTitle>Previsualización de importación</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Unidad</TableCell>
                  {hasCostsRead && <TableCell align="right">Costo</TableCell>}
                  {hasCostsRead && <TableCell>Moneda</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {importPreview?.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{row.unit}</TableCell>
                    {hasCostsRead && <TableCell align="right">{row.cost ?? '—'}</TableCell>}
                    {hasCostsRead && <TableCell>{row.currency ?? '—'}</TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportPreview(null)}>Cancelar</Button>
          <Button onClick={handleConfirmImport} variant="contained">Confirmar e importar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={historyDialog.open} onClose={() => setHistoryDialog({ open: false, item: null, entries: [], loading: false })} maxWidth="xs" fullWidth>
        <DialogTitle>Historial de costos — {historyDialog.item?.description}</DialogTitle>
        <DialogContent>
          {historyDialog.loading ? (
            <Box display="flex" justifyContent="center" py={3}><CircularProgress size={24} /></Box>
          ) : historyDialog.entries.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={3}>Sin cambios de costo registrados todavía.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="right">Costo</TableCell>
                  <TableCell>Quién</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyDialog.entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.createdAt).toLocaleDateString('es-AR')}</TableCell>
                    <TableCell align="right">{entry.currency === 'USD' ? 'US$' : '$'}{entry.cost}</TableCell>
                    <TableCell>{entry.changedBy ? `${entry.changedBy.lastname}, ${entry.changedBy.name}` : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialog({ open: false, item: null, entries: [], loading: false })}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
