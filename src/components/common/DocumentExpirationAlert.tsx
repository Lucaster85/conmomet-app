'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Chip, Button, IconButton, Tooltip, Stack,
  DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import AppDialog from '@/components/common/AppDialog';
import {
  WarningOutlined as WarningIcon,
  ErrorOutlined as ErrorIcon,
  RefreshOutlined as RefreshIcon,
  PaymentOutlined as PaymentIcon,
  VisibilityOutlined as VisibilityIcon,
  DescriptionOutlined as DescriptionIcon,
  EventBusyOutlined as ExpirationIcon,
} from '@mui/icons-material';
import { EntityDocumentService, EntityDocument } from '../../utils/api';
import { useAuth, userHasPermission } from '../../utils/auth';
import DateField from '../DateField';
import DashboardAlertCard, { DashboardAlertItem } from './DashboardAlertCard';
import { useRegisterAlertSummary } from './AlertViewsProvider';
import { ALERT_SHORT_LABEL } from '../../utils/alerts';

// Documentos vencidos o por vencer, con acuse de vista (ver FLOWS.md §36). Vivía inline en
// dashboard/page.tsx; se extrajo acá porque es el aviso que más pantalla ocupa (cada documento
// es una caja con sus acciones) y por lo tanto el que más gana con el tope de items.
//
// Los diálogos de Renovar y Pagar/Resolver se mudaron con él: son parte de este aviso, no del
// tablero.

// Los documentos no tienen ruta propia: los de empleado están en la pestaña "Documentos y
// Vencimientos" de su ficha, y los de vehículo en el modal "Legajo Digital" que se abre desde el
// listado. project/company todavía no tienen UI de documentos, así que para esos el único
// "detalle" posible es el archivo adjunto (botón "Ver archivo").
const DOC_DETAIL_PERMISSION: Partial<Record<EntityDocument['entity_type'], string>> = {
  employee: 'employees_read',
  vehicle: 'vehicles_read',
};

const ENTITY_TYPE_LABEL: Record<EntityDocument['entity_type'], string> = {
  employee: 'Empleado',
  vehicle: 'Vehículo',
  project: 'Proyecto',
  company: 'Empresa',
};

function docDetailHref(doc: EntityDocument): string | null {
  if (!doc.entity_id) return null; // documento global, no hay ficha de origen
  if (doc.entity_type === 'employee') return `/dashboard/employees/${doc.entity_id}?tab=documents&doc=${doc.id}`;
  if (doc.entity_type === 'vehicle') return `/dashboard/vehicles?docs=${doc.entity_id}&doc=${doc.id}`;
  return null;
}

interface DocumentExpirationAlertProps {
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export default function DocumentExpirationAlert({ onError, onSuccess }: DocumentExpirationAlertProps) {
  const router = useRouter();
  const { user } = useAuth();
  // Antes no hacía falta chequear esto: todo rol real tenía casi todos los permisos. Con un rol
  // acotado (ej. "Seguridad e Higiene": employees_read + safety_equipment_read, sin nada de
  // Contabilidad) este fetch sin gating 401eaba en cada carga de la portada.
  const canSeeDocuments = userHasPermission(user, 'documents_read');

  const [expiringDocs, setExpiringDocs] = useState<EntityDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const [renewDialog, setRenewDialog] = useState(false);
  const [resolveDialog, setResolveDialog] = useState(false);
  const [editingDoc, setEditingDoc] = useState<EntityDocument | null>(null);
  const [form, setForm] = useState({ expiration_date: '', notify_days_before: 15 });
  const [file, setFile] = useState<File | null>(null);

  const fetchExpirations = useCallback(async () => {
    if (!canSeeDocuments) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const allDocs = await EntityDocumentService.getAll();

      const criticalDocs = allDocs.filter(
        (doc) => doc.computed_status === 'expiring_soon' || doc.computed_status === 'expired'
      );

      criticalDocs.sort((a, b) => {
        if (a.computed_status === 'expired' && b.computed_status !== 'expired') return -1;
        if (a.computed_status !== 'expired' && b.computed_status === 'expired') return 1;
        if (!a.expiration_date || !b.expiration_date) return 0;
        return new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime();
      });

      setExpiringDocs(criticalDocs);
    } catch (err: unknown) {
      onError((err as Error).message || 'Error al cargar alertas de vencimientos');
    } finally {
      setLoading(false);
    }
  }, [canSeeDocuments, onError]);

  useEffect(() => {
    fetchExpirations();
  }, [fetchExpirations]);

  const handleRenewSubmit = async () => {
    if (!editingDoc) return;
    if (!file) return onError('El archivo es obligatorio para renovar');
    if (!form.expiration_date) return onError('La nueva fecha de vencimiento es obligatoria');

    try {
      await EntityDocumentService.renew(editingDoc.id, {
        expiration_date: form.expiration_date,
        notify_days_before: form.notify_days_before,
      }, file);
      onSuccess('Documento renovado correctamente');
      setRenewDialog(false);
      setEditingDoc(null);
      setFile(null);
      setForm({ expiration_date: '', notify_days_before: 15 });
      fetchExpirations();
    } catch (err: unknown) {
      onError((err as Error).message || 'Error al renovar documento');
    }
  };

  const handleResolveSubmit = async () => {
    if (!editingDoc) return;
    if (!file) return onError('Debe adjuntar el comprobante de pago/resolución');

    try {
      await EntityDocumentService.resolve(editingDoc.id, file);
      onSuccess('Documento marcado como resuelto');
      setResolveDialog(false);
      setEditingDoc(null);
      setFile(null);
      fetchExpirations();
    } catch (err: unknown) {
      onError((err as Error).message || 'Error al resolver documento');
    }
  };

  const openRenew = (doc: EntityDocument) => {
    setEditingDoc(doc);
    setForm({ expiration_date: '', notify_days_before: doc.notify_days_before || 15 });
    setFile(null);
    setRenewDialog(true);
  };

  const openResolve = (doc: EntityDocument) => {
    setEditingDoc(doc);
    setFile(null);
    setResolveDialog(true);
  };

  const items: DashboardAlertItem[] = useMemo(
    () =>
      expiringDocs.map((doc) => {
        const isExpired = doc.computed_status === 'expired';
        const typeLabel = ENTITY_TYPE_LABEL[doc.entity_type] ?? doc.entity_type;
        const entityLabel = doc.entity_name || 'Global';
        const detailHref = docDetailHref(doc);
        const detailPermission = DOC_DETAIL_PERMISSION[doc.entity_type];
        const canSeeDetail = !!detailHref && (!detailPermission || userHasPermission(user, detailPermission));

        return {
          entity_id: doc.id,
          // Reaparece si el documento pasó de "por vencer" a "vencido", o si se renovó con otra
          // fecha: en los dos casos hay algo nuevo que mirar aunque ya lo hubieras marcado.
          revision: `${doc.computed_status}|${doc.expiration_date ?? ''}`,
          content: (
            <Box
              sx={{
                border: 1,
                borderColor: isExpired ? 'error.light' : 'warning.light',
                borderRadius: 2,
                bgcolor: isExpired ? 'error.50' : 'warning.50',
                p: 2,
              }}
            >
              <Box display="flex" alignItems="flex-start" gap={1} mb={0.5}>
                {isExpired
                  ? <ErrorIcon color="error" fontSize="small" sx={{ mt: 0.25, flexShrink: 0 }} />
                  : <WarningIcon color="warning" fontSize="small" sx={{ mt: 0.25, flexShrink: 0 }} />}
                <Box flex={1} minWidth={0}>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography fontWeight="bold" sx={{ wordBreak: 'break-word' }}>{doc.title}</Typography>
                    <Chip
                      label={doc.entity_id ? `${typeLabel}: ${entityLabel}` : typeLabel}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  {doc.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                      {doc.notes}
                    </Typography>
                  )}
                  <Typography variant="caption" color={isExpired ? 'error' : 'warning.dark'} fontWeight="bold" display="block" sx={{ mt: 0.5 }}>
                    {isExpired ? 'Venció el: ' : 'Vence el: '}
                    {doc.expiration_date ? new Date(doc.expiration_date + 'T00:00:00').toLocaleDateString('es-AR') : ''}
                  </Typography>
                </Box>
              </Box>

              {/* Acciones: icon-only en mobile, botones completos en sm+ */}
              <Box sx={{ mt: 1.5, display: 'flex', gap: 1, justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
                {doc.is_renewable ? (
                  <Tooltip title="Renovar">
                    <IconButton
                      size="small"
                      sx={{ display: { xs: 'inline-flex', sm: 'none' }, bgcolor: 'warning.main', color: 'white', '&:hover': { bgcolor: 'warning.dark' } }}
                      onClick={() => openRenew(doc)}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Pagar / Resolver">
                    <IconButton
                      size="small"
                      sx={{ display: { xs: 'inline-flex', sm: 'none' }, bgcolor: 'success.main', color: 'white', '&:hover': { bgcolor: 'success.dark' } }}
                      onClick={() => openResolve(doc)}
                    >
                      <PaymentIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {canSeeDetail && (
                  <Tooltip title="Ver detalle">
                    <IconButton
                      size="small"
                      color="primary"
                      sx={{ display: { xs: 'inline-flex', sm: 'none' }, border: 1, borderColor: 'primary.main' }}
                      onClick={() => router.push(detailHref!)}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {doc.file_url && (
                  <Tooltip title="Ver archivo">
                    <IconButton
                      size="small"
                      color="info"
                      sx={{ display: { xs: 'inline-flex', sm: 'none' }, border: 1, borderColor: 'info.main' }}
                      onClick={() => window.open(doc.file_url, '_blank', 'noopener,noreferrer')}
                    >
                      <DescriptionIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}

                {doc.is_renewable ? (
                  <Button
                    size="small"
                    variant="contained"
                    color="warning"
                    startIcon={<RefreshIcon />}
                    sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                    onClick={() => openRenew(doc)}
                  >
                    Renovar
                  </Button>
                ) : (
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<PaymentIcon />}
                    sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                    onClick={() => openResolve(doc)}
                  >
                    Pagar / Resolver
                  </Button>
                )}
                {canSeeDetail && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    startIcon={<VisibilityIcon />}
                    sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                    onClick={() => router.push(detailHref!)}
                  >
                    Ver detalle
                  </Button>
                )}
                {doc.file_url && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="info"
                    startIcon={<DescriptionIcon />}
                    sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                    onClick={() => window.open(doc.file_url, '_blank', 'noopener,noreferrer')}
                  >
                    Ver archivo
                  </Button>
                )}
              </Box>
            </Box>
          ),
        };
      }),
    [expiringDocs, router, user]
  );

  const ready = canSeeDocuments && !loading;
  useRegisterAlertSummary(
    ready
      ? {
          type: 'entity_document',
          label: ALERT_SHORT_LABEL.entity_document,
          total: expiringDocs.length,
          href: '/dashboard/documents',
          color: 'error',
        }
      : null
  );

  if (!ready) return null;

  return (
    <>
      <DashboardAlertCard
        type="entity_document"
        title="Alertas de Vencimientos"
        icon={<ExpirationIcon />}
        color="error"
        items={items}
      />

      {/* Renovar */}
      <AppDialog open={renewDialog} onClose={() => setRenewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Renovar Documento</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">Estás renovando: <strong>{editingDoc?.title}</strong></Typography>
            <Box display="flex" gap={2}>
              <DateField
                label="Nueva Fecha de Vencimiento *"
                fullWidth
                value={form.expiration_date}
                onChange={(val) => setForm({ ...form, expiration_date: val })}
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
                {file ? file.name : 'Seleccionar Archivo (Requerido)'}
                <input type="file" hidden accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenewDialog(false)}>Cancelar</Button>
          <Button onClick={handleRenewSubmit} variant="contained" disabled={!form.expiration_date || !file}>Renovar</Button>
        </DialogActions>
      </AppDialog>

      {/* Pagar / Resolver */}
      <AppDialog open={resolveDialog} onClose={() => setResolveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Pagar / Resolver Documento</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">Estás marcando como resuelto: <strong>{editingDoc?.title}</strong></Typography>
            <Box>
              <Typography variant="subtitle2" gutterBottom>Comprobante de Pago *</Typography>
              <Button variant="outlined" component="label" fullWidth color={file ? 'success' : 'primary'}>
                {file ? file.name : 'Seleccionar Archivo (Requerido)'}
                <input type="file" hidden accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialog(false)}>Cancelar</Button>
          <Button onClick={handleResolveSubmit} variant="contained" color="success" disabled={!file}>Marcar Resuelto</Button>
        </DialogActions>
      </AppDialog>
    </>
  );
}
