'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Tooltip, TextField, Stack, Chip, Switch, FormControlLabel,
  InputAdornment,
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import GearSpinner from '../../../components/GearSpinner';
import CurrencyInput from '../../../components/CurrencyInput';
import {
  AddOutlined as AddIcon, EditOutlined as EditIcon, DeleteOutlined as DeleteIcon, RefreshOutlined as RefreshIcon,
  SearchOutlined as SearchIcon, UploadFileOutlined as UploadIcon, HistoryOutlined as HistoryIcon,
  DownloadOutlined as DownloadIcon, Inventory2Outlined as TitleIcon, StorefrontOutlined as ProvidersIcon,
  RemoveCircleOutlineOutlined as RemoveIcon,
} from '@mui/icons-material';
import {
  Material, MaterialService, CreateMaterialData, MaterialUnit, MaterialUnitService,
  BudgetCurrency, MaterialCostHistoryEntry, MaterialImportRow, MaterialProvider, MaterialProviderService,
} from '../../../utils/api';
import { useAuth } from '../../../utils/auth';
import ProviderPriceAutocomplete from '../../../components/materials/ProviderPriceAutocomplete';
import ProvidersQuickDialog from '../../../components/materials/ProvidersQuickDialog';
import { downloadMaterialsTemplate } from '../../../utils/materialsExcel';
import { bestPrice, formatMaterialPrice } from '../../../utils/materialPrices';

// Fila editable de "Precios por proveedor" — provider_id null mientras no se eligió proveedor.
interface PriceRow {
  key: number;
  provider_id: number | null;
  cost: number | null;
  currency: BudgetCurrency;
}

const emptyForm = (): CreateMaterialData => ({ description: '', material_unit_id: 0, kg_per_meter: null, is_active: true });
let priceRowKey = 0;
const newPriceRow = (providerId: number | null = null, cost: number | null = null, currency: BudgetCurrency = 'ARS'): PriceRow =>
  ({ key: ++priceRowKey, provider_id: providerId, cost, currency });

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
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Material | null>(null);
  const [form, setForm] = useState<CreateMaterialData>(emptyForm());
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: Material | null }>({ open: false, item: null });

  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<MaterialImportRow[] | null>(null);

  const [providers, setProviders] = useState<MaterialProvider[]>([]);
  const [providersDialogOpen, setProvidersDialogOpen] = useState(false);
  const [priceRows, setPriceRows] = useState<PriceRow[]>([]);

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
      const [mats, mUnits, mProviders] = await Promise.all([
        MaterialService.getAll(q ? { q } : undefined),
        MaterialUnitService.getAll(true),
        MaterialProviderService.getAll(),
      ]);
      setItems(Array.isArray(mats) ? mats : []);
      setUnits(Array.isArray(mUnits) ? mUnits : []);
      setProviders(Array.isArray(mProviders) ? mProviders : []);
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
    // Un material nuevo arranca con "Sin especificar", igual que una línea de presupuesto.
    const unspecified = providers.find((p) => p.is_system);
    setPriceRows(hasCostsRead && unspecified ? [newPriceRow(unspecified.id)] : []);
    setOpenDialog(true);
  };

  const handleOpenEdit = (item: Material) => {
    setEditingItem(item);
    setForm({
      description: item.description,
      material_unit_id: item.material_unit_id,
      kg_per_meter: item.kg_per_meter != null ? Number(item.kg_per_meter) : null,
      is_active: item.is_active,
    });
    setPriceRows((item.providerPrices || []).map((p) =>
      newPriceRow(p.provider_id, p.cost != null ? Number(p.cost) : null, p.currency || 'ARS')));
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.description.trim() || !form.material_unit_id) {
      setError('Descripción y unidad son obligatorias');
      return;
    }
    if (processing) return;
    setProcessing(true);
    try {
      // Sin material_costs_read el backend ignora provider_prices (y los precios que vienen
      // están vaciados), así que ni se mandan: no se puede pisar nada por accidente.
      const body: CreateMaterialData = hasCostsRead
        ? {
            ...form,
            provider_prices: priceRows
              .filter((r) => r.provider_id)
              .map((r) => ({ provider_id: r.provider_id as number, cost: r.cost, currency: r.cost != null ? r.currency : null })),
          }
        : form;
      if (editingItem) {
        await MaterialService.update(editingItem.id, body);
        setSuccess('Material actualizado');
      } else {
        await MaterialService.create(body);
        setSuccess('Material creado');
      }
      setOpenDialog(false);
      loadData(search || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setProcessing(false);
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
    if (!importPreview || processing) return;
    setProcessing(true);
    try {
      const { summary } = await MaterialService.importCommit(importPreview);
      setImportPreview(null);
      setSuccess(`${summary.materials_created} material(es) nuevo(s), ${summary.prices_updated} precio(s) actualizado(s)`);
      loadData(search || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al confirmar la importación');
    } finally {
      setProcessing(false);
    }
  };

  const createProviderInline = async (name: string) => {
    const created = await MaterialProviderService.create(name);
    setProviders((prev) => (prev.some((p) => p.id === created.id) ? prev : [...prev, created]));
    return created;
  };

  const reloadProviders = async () => {
    setProviders(await MaterialProviderService.getAll());
    loadData(search || undefined);
  };

  const updatePriceRow = (key: number, patch: Partial<PriceRow>) =>
    setPriceRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const renderBestPrice = (item: Material) => {
    const best = bestPrice(item);
    const count = (item.providerPrices || []).length;
    if (!best) return null;
    return { label: formatMaterialPrice(best.cost, best.currency), count };
  };

  if (loading && items.length === 0) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><GearSpinner /></Box>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <TitleIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em" color="#1E293B">Materiales</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => loadData(search || undefined)} size="small">Actualizar</Button>
          <Button variant="outlined" startIcon={<ProvidersIcon />} onClick={() => setProvidersDialogOpen(true)} size="small">Proveedores</Button>
          <Button variant="outlined" onClick={() => downloadMaterialsTemplate('catalog')} startIcon={<DownloadIcon />} size="small">
            Descargar plantilla modelo
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

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {items.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>No hay materiales que coincidan</Typography>
        ) : (
          <Stack spacing={2}>
            {items.map((item) => (
              <Card key={item.id} sx={{ p: 2, borderRadius: 2, borderLeft: item.is_active ? '4px solid #10B981' : '4px solid #94A3B8' }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight="bold">{item.description}</Typography>
                    <Typography variant="body2" color="text.secondary">Unidad: {item.materialUnit?.label}</Typography>
                    {item.kg_per_meter != null && (
                      <Typography variant="body2" color="text.secondary">Kg x mL: {Number(item.kg_per_meter).toLocaleString('es-AR')}</Typography>
                    )}
                    {hasCostsRead ? (
                      <Typography variant="body2" fontWeight="medium">
                        {renderBestPrice(item)
                          ? `Mejor precio: ${renderBestPrice(item)!.label} · ${renderBestPrice(item)!.count} proveedor(es)`
                          : 'Sin costo cargado'}
                      </Typography>
                    ) : (item.providerPrices || []).length > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        Proveedores: {(item.providerPrices || []).map((p) => p.provider?.razonSocial).filter(Boolean).join(', ')}
                      </Typography>
                    )}
                    <Chip size="small" label={item.is_active ? 'Activo' : 'Inactivo'} color={item.is_active ? 'success' : 'default'} sx={{ mt: 0.5 }} />
                  </Box>
                  <Box>
                    {hasCostsRead && (
                      <Tooltip title="Ver historial de costos"><IconButton size="small" color="secondary" onClick={() => handleOpenHistory(item)}><HistoryIcon fontSize="small" /></IconButton></Tooltip>
                    )}
                    <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenEdit(item)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item })}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </Box>
                </Box>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Descripción</strong></TableCell>
                <TableCell><strong>Unidad</strong></TableCell>
                <TableCell><strong>Kg x mL</strong></TableCell>
                {hasCostsRead ? <TableCell><strong>Mejor precio</strong></TableCell> : <TableCell><strong>Proveedores</strong></TableCell>}
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No hay materiales que coincidan</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell><Typography fontWeight="medium">{item.description}</Typography></TableCell>
                    <TableCell>{item.materialUnit?.label}</TableCell>
                    <TableCell>{item.kg_per_meter != null ? Number(item.kg_per_meter).toLocaleString('es-AR') : '—'}</TableCell>
                    {hasCostsRead ? (
                      <TableCell>
                        {renderBestPrice(item) ? (
                          <>
                            <Typography variant="body2" fontWeight={600}>{renderBestPrice(item)!.label}</Typography>
                            <Typography variant="caption" color="text.secondary">{renderBestPrice(item)!.count} proveedor(es)</Typography>
                          </>
                        ) : <Typography variant="caption" color="text.secondary">Sin costo cargado</Typography>}
                      </TableCell>
                    ) : (
                      <TableCell>
                        <Typography variant="body2">{(item.providerPrices || []).map((p) => p.provider?.razonSocial).filter(Boolean).join(', ') || '—'}</Typography>
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
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
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
            <TextField label="Kg x mL" type="number" fullWidth value={form.kg_per_meter ?? ''}
              onChange={(e) => setForm({ ...form, kg_per_meter: e.target.value === '' ? null : Number(e.target.value) })}
              inputProps={{ min: 0, step: '0.001' }} helperText="Opcional — kilos por metro lineal (ejes, perfiles, etc.)" />
            {hasCostsRead && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2" fontWeight={700}>Precios por proveedor</Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={() => setPriceRows((rows) => [...rows, newPriceRow()])}>Agregar</Button>
                </Box>
                {priceRows.length === 0 && (
                  <Typography variant="body2" color="text.secondary">Sin proveedores cargados.</Typography>
                )}
                <Stack spacing={1.5}>
                  {priceRows.map((row) => (
                    <Box key={row.key} display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={1} alignItems={{ sm: 'center' }}>
                      <Box flex={2} minWidth={0}>
                        <ProviderPriceAutocomplete
                          providers={providers}
                          value={row.provider_id}
                          showPrices={false}
                          excludeIds={priceRows.filter((r) => r.key !== row.key && r.provider_id).map((r) => r.provider_id as number)}
                          onChange={(provider) => updatePriceRow(row.key, { provider_id: provider ? provider.id : null })}
                          onCreate={createProviderInline}
                          onError={setError}
                        />
                      </Box>
                      <Box flex={1.4} minWidth={0}>
                        <CurrencyInput label="Costo" size="small" fullWidth value={row.cost}
                          currency={row.currency}
                          onChange={(value) => updatePriceRow(row.key, { cost: value })} />
                      </Box>
                      <TextField size="small" select value={row.currency} sx={{ minWidth: 84 }}
                        onChange={(e) => updatePriceRow(row.key, { currency: e.target.value as BudgetCurrency })}
                        SelectProps={{ native: true }}>
                        <option value="ARS">ARS</option>
                        <option value="USD">USD</option>
                      </TextField>
                      <Tooltip title="Quitar proveedor">
                        <IconButton size="small" color="error" onClick={() => setPriceRows((rows) => rows.filter((r) => r.key !== row.key))}><RemoveIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
            <FormControlLabel control={<Switch checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />} label="Activo" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={processing}>{processing ? <GearSpinner size={20} /> : (editingItem ? 'Guardar' : 'Crear')}</Button>
        </DialogActions>
      </Dialog>

      <ProvidersQuickDialog
        open={providersDialogOpen}
        onClose={() => setProvidersDialogOpen(false)}
        providers={providers}
        onChanged={reloadProviders}
      />

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
                  <TableCell>Proveedor</TableCell>
                  <TableCell align="right">Kg x mL</TableCell>
                  {hasCostsRead && <TableCell align="right">Costo</TableCell>}
                  {hasCostsRead && <TableCell>Moneda</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {importPreview?.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{row.unit}</TableCell>
                    <TableCell>{row.provider || <Typography variant="caption" color="text.secondary">Sin especificar</Typography>}</TableCell>
                    <TableCell align="right">{row.kg_per_meter ?? '—'}</TableCell>
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
          <Button onClick={handleConfirmImport} variant="contained" disabled={processing}>{processing ? <GearSpinner size={20} /> : 'Confirmar e importar'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={historyDialog.open} onClose={() => setHistoryDialog({ open: false, item: null, entries: [], loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Historial de costos — {historyDialog.item?.description}</DialogTitle>
        <DialogContent>
          {historyDialog.loading ? (
            <Box display="flex" justifyContent="center" py={3}><GearSpinner size={24} /></Box>
          ) : historyDialog.entries.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={3}>Sin cambios de costo registrados todavía.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Proveedor</TableCell>
                  <TableCell align="right">Costo</TableCell>
                  <TableCell>Quién</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyDialog.entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.createdAt).toLocaleDateString('es-AR')}</TableCell>
                    <TableCell>{entry.provider?.razonSocial || '—'}</TableCell>
                    <TableCell align="right">{formatMaterialPrice(entry.cost, entry.currency)}</TableCell>
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
