'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Stack, Box, Typography, Checkbox, FormGroup, FormControlLabel,
  CircularProgress, Alert, Divider, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow
} from '@mui/material';
import { Guild, Category, Employee, EmployeeRate, GuildService, CategoryService, EmployeeService, EmployeeRateService } from '@/utils/api';

interface ApplyIncreaseModalProps {
  open: boolean;
  guild: Guild | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function ApplyIncreaseModal({ open, guild, onClose, onSuccess }: ApplyIncreaseModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeRatesMap, setEmployeeRatesMap] = useState<Record<number, EmployeeRate[]>>({});
  const [loading, setLoading] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [percentage, setPercentage] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Record<number, boolean>>({});

  const loadInitialData = useCallback(async () => {
    if (!guild) return;
    try {
      setLoading(true);
      setError('');
      
      // Fetch categories for this guild
      const cats = await CategoryService.getAll({ guild_id: guild.id });
      setCategories(cats);
      
      // Select all categories by default
      const defaultSelected: Record<number, boolean> = {};
      cats.forEach(c => {
        defaultSelected[c.id] = true;
      });
      setSelectedCategoryIds(defaultSelected);

      // Fetch all employees and filter active/jornalizados of this guild
      const allEmps = await EmployeeService.getAll();
      const activeHourlyEmps = allEmps.filter(e => 
        e.pay_type === 'hourly' && 
        e.status !== 'inactive' && 
        e.category_id && 
        cats.some(c => c.id === e.category_id)
      );
      setEmployees(activeHourlyEmps);
      
      // Fetch rates for these employees
      setLoadingRates(true);
      const ratesMap: Record<number, EmployeeRate[]> = {};
      await Promise.all(
        activeHourlyEmps.map(async (emp) => {
          try {
            const rates = await EmployeeRateService.getByEmployee(emp.id);
            // Only keep rates that have a concept (concept_id !== null)
            ratesMap[emp.id] = rates.filter(r => r.concept_id !== null);
          } catch (e) {
            console.error(`Error loading rates for employee ${emp.id}:`, e);
          }
        })
      );
      setEmployeeRatesMap(ratesMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
      setLoadingRates(false);
    }
  }, [guild]);

  // Reset state when modal opens/changes guild
  useEffect(() => {
    if (open && guild) {
      setPercentage('');
      setNotes('');
      setError('');
      setSelectedCategoryIds({});
      setEmployeeRatesMap({});
      loadInitialData();
    }
  }, [open, guild, loadInitialData]);;

  const handleToggleCategory = (catId: number) => {
    setSelectedCategoryIds(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const handleSelectAllCategories = (select: boolean) => {
    const updated: Record<number, boolean> = {};
    categories.forEach(c => {
      updated[c.id] = select;
    });
    setSelectedCategoryIds(updated);
  };

  const parsedPercentage = parseFloat(percentage) || 0;

  // Calculate new values locally for preview
  const roundCCT = (val: number) => Math.round(val * 100) / 100;
  const roundHR = (val: number) => Math.round(val);

  const previewCategories = useMemo(() => {
    return categories.map(cat => {
      const isSelected = !!selectedCategoryIds[cat.id];
      const oldRate = Number(cat.guild_hourly_rate) || 0;
      const newRate = isSelected ? roundCCT(oldRate * (1 + parsedPercentage / 100)) : oldRate;
      return { ...cat, oldRate, newRate, isSelected };
    });
  }, [categories, selectedCategoryIds, parsedPercentage]);

  const previewEmployees = useMemo(() => {
    return employees
      .filter(emp => emp.category_id && selectedCategoryIds[emp.category_id])
      .map(emp => {
        const oldRate = Number(emp.hourly_rate) || 0;
        const newRate = roundHR(oldRate * (1 + parsedPercentage / 100));
        
        const rates = (employeeRatesMap[emp.id] || []).map(r => {
          const oldSpecRate = Number(r.rate) || 0;
          const newSpecRate = roundHR(oldSpecRate * (1 + parsedPercentage / 100));
          return {
            id: r.id,
            conceptName: r.concept?.name || `Concepto #${r.concept_id}`,
            oldRate: oldSpecRate,
            newRate: newSpecRate
          };
        });

        return { ...emp, oldRate, newRate, rates };
      });
  }, [employees, selectedCategoryIds, parsedPercentage, employeeRatesMap]);

  const handleSubmit = async () => {
    if (!guild) return;
    if (parsedPercentage === 0) {
      setError('Por favor ingrese un porcentaje válido de aumento.');
      return;
    }

    const categoryIds = categories
      .filter(c => selectedCategoryIds[c.id])
      .map(c => c.id);

    if (categoryIds.length === 0) {
      setError('Debe seleccionar al menos una categoría.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const response = await GuildService.applyIncrease(guild.id, {
        percentage: parsedPercentage,
        categoryIds,
        notes: notes.trim() || undefined
      });
      
      onSuccess(response.message || 'Aumento aplicado correctamente.');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aplicar el aumento');
    } finally {
      setSubmitting(false);
    }
  };

  const hasSelectedCategories = Object.values(selectedCategoryIds).some(v => v);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Aplicar aumento inmediato — {guild?.name} ({guild?.code})
      </DialogTitle>
      
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            {error && <Alert severity="error">{error}</Alert>}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Porcentaje de aumento (%)"
                type="number"
                fullWidth
                required
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="Ej. 12.5"
                inputProps={{ min: "0", step: "0.1" }}
              />
              <TextField
                label="Notas / Motivo"
                fullWidth
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Acuerdo paritario Junio 2026"
              />
            </Stack>

            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                1. Seleccionar Categorías a las que aplica:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <Button size="small" onClick={() => handleSelectAllCategories(true)}>
                  Seleccionar Todas
                </Button>
                <Button size="small" onClick={() => handleSelectAllCategories(false)}>
                  Deseleccionar Todas
                </Button>
              </Stack>
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 150, overflowY: 'auto' }}>
                <FormGroup row>
                  {previewCategories.map(cat => (
                    <FormControlLabel
                      key={cat.id}
                      control={
                        <Checkbox
                          checked={cat.isSelected}
                          onChange={() => handleToggleCategory(cat.id)}
                        />
                      }
                      label={cat.name}
                      sx={{ width: { xs: '100%', sm: '48%', md: '31%' } }}
                    />
                  ))}
                </FormGroup>
              </Paper>
            </Box>

            <Divider />

            {parsedPercentage > 0 && hasSelectedCategories && (
              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  2. Previsualización de Cambios:
                </Typography>
                
                <Stack spacing={2}>
                  {/* Category Preview */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Valores de Convenio (CCT) de Categorías Seleccionadas (redondeado a 2 decimales):
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Categoría</TableCell>
                            <TableCell align="right">Valor Actual</TableCell>
                            <TableCell align="right">Nuevo Valor (+{percentage}%)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {previewCategories.filter(c => c.isSelected).map(cat => (
                            <TableRow key={cat.id}>
                              <TableCell>{cat.name}</TableCell>
                              <TableCell align="right">${cat.oldRate.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                ${cat.newRate.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  {/* Employee Preview */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Jornales Base de Empleados y Tarifas Especiales (redondeado a enteros):
                    </Typography>
                    {previewEmployees.length === 0 ? (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        No hay empleados activos jornalizados en las categorías seleccionadas.
                      </Alert>
                    ) : (
                      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 250 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell>Empleado</TableCell>
                              <TableCell>Categoría</TableCell>
                              <TableCell>Concepto / Tarifa</TableCell>
                              <TableCell align="right">Valor Actual</TableCell>
                              <TableCell align="right">Nuevo Valor (+{percentage}%)</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {previewEmployees.map(emp => (
                              <React.Fragment key={emp.id}>
                                {/* Base Salary Row */}
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 'medium' }}>
                                    {emp.lastname}, {emp.name}
                                  </TableCell>
                                  <TableCell>{emp.category?.name || '—'}</TableCell>
                                  <TableCell>Sueldo Base (Valor Hora)</TableCell>
                                  <TableCell align="right">${emp.oldRate}</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                    ${emp.newRate}
                                  </TableCell>
                                </TableRow>
                                {/* Special Rates Rows */}
                                {emp.rates.map(rate => (
                                  <TableRow key={rate.id} sx={{ backgroundColor: 'action.hover' }}>
                                    <TableCell sx={{ pl: 4, color: 'text.secondary' }}>└— tarifa especial</TableCell>
                                    <TableCell></TableCell>
                                    <TableCell sx={{ color: 'text.secondary' }}>{rate.conceptName}</TableCell>
                                    <TableCell align="right" sx={{ color: 'text.secondary' }}>${rate.oldRate}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'medium', color: 'success.dark' }}>
                                      ${rate.newRate}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </React.Fragment>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                    {loadingRates && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <CircularProgress size={16} />
                        <Typography variant="caption" color="textSecondary">
                          Cargando tarifas especiales...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Stack>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || loading || parsedPercentage <= 0 || !hasSelectedCategories}
        >
          {submitting ? 'Aplicando...' : 'Aplicar aumento'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
