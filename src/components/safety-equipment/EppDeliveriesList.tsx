'use client';
import React from 'react';
import {
  Box, Typography, Paper, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Stack, Chip, IconButton, Tooltip, Button,
} from '@mui/material';
import { AutorenewOutlined as RenewIcon, DrawOutlined as SignatureIcon } from '@mui/icons-material';
import { SafetyEquipment } from '../../utils/api';
import { CATEGORY_LABELS, CONDITION_COLORS, CONDITION_LABELS, EPP_STATUS_CONFIG, eppExpirationLabel } from '../../utils/epp';

const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-AR');

const statusOf = (e: SafetyEquipment) => EPP_STATUS_CONFIG[e.computed_status || (e.expiration_date ? 'valid' : 'permanent')];
const canRenew = (e: SafetyEquipment) => !!e.expiration_date && e.computed_status !== 'renewed';

interface EppDeliveriesListProps {
  deliveries: SafetyEquipment[];
  // 'full' muestra la columna Empleado (listado general); 'compact' la oculta (legajo del
  // empleado y portal, donde el empleado ya está implícito en el contexto).
  variant?: 'full' | 'compact';
  onRenew?: (eq: SafetyEquipment) => void;
  emptyMessage?: string;
}

export default function EppDeliveriesList({ deliveries, variant = 'full', onRenew, emptyMessage = 'No hay entregas registradas' }: EppDeliveriesListProps) {
  const showEmployee = variant === 'full';
  const columnCount = (showEmployee ? 9 : 8) + (onRenew ? 1 : 0);

  return (
    <Box>
      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {deliveries.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>{emptyMessage}</Typography>
        ) : (
          <Stack spacing={2}>
            {deliveries.map(e => {
              const statusCfg = statusOf(e);
              const renewable = canRenew(e);
              return (
                <Card key={e.id} sx={{ p: 2 }}>
                  {showEmployee && (
                    <Typography variant="subtitle1" fontWeight="bold">{e.employee?.lastname}, {e.employee?.name}</Typography>
                  )}
                  <Typography variant="body1">{e.eppItem?.name || '—'}</Typography>
                  {e.size_delivered && <Typography variant="body2">Talle: {e.size_delivered}</Typography>}
                  {e.quantity > 1 && <Typography variant="body2">Cantidad: {e.quantity}</Typography>}
                  <Typography variant="body2">Entregado: {formatDate(e.delivered_date)}</Typography>
                  {e.expiration_date && (
                    <Typography variant="body2">Vence: {formatDate(e.expiration_date)} ({eppExpirationLabel(e.expiration_date)})</Typography>
                  )}
                  <Box display="flex" gap={1} flexWrap="wrap" alignItems="center" mt={1}>
                    <Chip label={CONDITION_LABELS[e.condition || 'new']} size="small" color={CONDITION_COLORS[e.condition || 'new']} />
                    <Chip label={statusCfg.label} size="small" color={statusCfg.color} variant={statusCfg.color === 'default' ? 'outlined' : 'filled'} />
                    {e.signature_url && (
                      <Tooltip title="Ver firma">
                        <IconButton size="small" color="primary" component="a" href={e.signature_url} target="_blank" rel="noopener noreferrer">
                          <SignatureIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  {e.notes && <Typography variant="caption" display="block" mt={1} color="text.secondary">{e.notes}</Typography>}
                  {onRenew && renewable && (
                    <Button size="small" startIcon={<RenewIcon />} onClick={() => onRenew(e)} sx={{ mt: 1 }}>Renovar</Button>
                  )}
                </Card>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Fecha Entrega</strong></TableCell>
                {showEmployee && <TableCell><strong>Empleado</strong></TableCell>}
                <TableCell><strong>Artículo</strong></TableCell>
                <TableCell><strong>Talle</strong></TableCell>
                <TableCell><strong>Cant.</strong></TableCell>
                <TableCell><strong>Condición</strong></TableCell>
                <TableCell><strong>Vencimiento</strong></TableCell>
                <TableCell><strong>Notas</strong></TableCell>
                <TableCell align="center"><strong>Firma</strong></TableCell>
                {onRenew && <TableCell align="center"><strong>Acciones</strong></TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {deliveries.length === 0 ? (
                <TableRow><TableCell colSpan={columnCount} align="center" sx={{ py: 4 }}><Typography variant="body2" color="text.secondary">{emptyMessage}</Typography></TableCell></TableRow>
              ) : (
                deliveries.map(e => {
                  const statusCfg = statusOf(e);
                  const renewable = canRenew(e);
                  return (
                    <TableRow key={e.id} hover>
                      <TableCell>{formatDate(e.delivered_date)}</TableCell>
                      {showEmployee && <TableCell>{e.employee?.lastname}, {e.employee?.name}</TableCell>}
                      <TableCell>
                        <Typography fontWeight="medium">{e.eppItem?.name || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{e.eppItem ? CATEGORY_LABELS[e.eppItem.category] : ''}</Typography>
                      </TableCell>
                      <TableCell>{e.size_delivered || '—'}</TableCell>
                      <TableCell>{e.quantity}</TableCell>
                      <TableCell><Chip label={CONDITION_LABELS[e.condition || 'new']} size="small" color={CONDITION_COLORS[e.condition || 'new']} /></TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          {e.expiration_date && <Typography variant="body2">{formatDate(e.expiration_date)}</Typography>}
                          <Chip label={statusCfg.label} size="small" color={statusCfg.color} variant={statusCfg.color === 'default' ? 'outlined' : 'filled'} />
                        </Stack>
                      </TableCell>
                      <TableCell>{e.notes || '—'}</TableCell>
                      <TableCell align="center">
                        {e.signature_url && (
                          <Tooltip title="Ver firma">
                            <IconButton size="small" color="primary" component="a" href={e.signature_url} target="_blank" rel="noopener noreferrer">
                              <SignatureIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                      {onRenew && (
                        <TableCell align="center">
                          {renewable && (
                            <Tooltip title="Renovar">
                              <IconButton size="small" color="primary" onClick={() => onRenew(e)}>
                                <RenewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
