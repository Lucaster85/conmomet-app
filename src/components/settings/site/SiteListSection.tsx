'use client';
import React, { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Card, Chip, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Stack, Switch,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import AppDialog from '@/components/common/AppDialog';
import {
  AddOutlined as AddIcon, DeleteOutlined as DeleteIcon, EditOutlined as EditIcon, SwapVertOutlined as SortIcon,
} from '@mui/icons-material';
import { PUBLIC_ICONS, type PublicIconKey } from '../../public/icons';
import SiteSortModal from './SiteSortModal';

export interface SiteListRow {
  id: number;
  is_active: boolean;
}

/** Lo que el sitio muestra hoy desde el manifiesto, mientras la lista de la base está vacía. */
export interface DefaultEntry {
  key: string;
  icon?: string;
  primary: string;
  secondary?: string;
}

interface SiteListSectionProps<T extends SiteListRow> {
  title: string;
  description?: string;
  newLabel: string;
  emptyText: string;
  items: T[];
  /** ¿Alguna vez se cargó algo en la base para esta lista? Si no, el sitio usa el manifiesto. */
  touched: boolean;
  defaults: DefaultEntry[];
  icon: (item: T) => string | undefined;
  primary: (item: T) => string;
  secondary?: (item: T) => string | undefined;
  onCreate: () => void;
  onEdit: (item: T) => void;
  onToggleActive: (item: T) => Promise<void>;
  onDelete: (item: T) => Promise<void>;
  onReorder: (orderedIds: number[]) => Promise<void>;
  onImportDefaults: () => Promise<void>;
  /** Acción extra al lado de "Nuevo" (ej. traer de Datos de mi empresa). Recibe si la lista está bloqueada. */
  extraActions?: (locked: boolean) => React.ReactNode;
}

function EntryIcon({ name }: { name?: string }) {
  const Icon = name ? PUBLIC_ICONS[name as PublicIconKey] : undefined;
  return Icon ? <Icon width={22} height={22} /> : null;
}

// Una lista editable del sitio público con las dos vistas obligatorias (cards mobile + tabla desktop) y las
// mismas acciones en ambas. Compartida por servicios, clientes y los dos grupos de enlaces.
export default function SiteListSection<T extends SiteListRow>(props: SiteListSectionProps<T>) {
  const { title, description, newLabel, emptyText, items, touched, defaults, icon, primary, secondary } = props;
  const [deleting, setDeleting] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const [sorting, setSorting] = useState(false);

  const sortEntries = useMemo(() => items.map((i) => ({ id: i.id, label: primary(i) })), [items, primary]);

  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  // Mientras la lista de la base está vacía el sitio muestra la del manifiesto: crear un primer ítem la
  // reemplazaría por uno solo y haría desaparecer el resto. Por eso "Nuevo" espera a que se carguen los originales.
  const showDefaults = !touched && defaults.length > 0;

  return (
    <Box mb={5}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap" gap={1}>
        <Typography variant="h6" fontWeight={600}>{title}</Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {props.extraActions?.(showDefaults)}
          <Button variant="outlined" size="small" startIcon={<SortIcon />} onClick={() => setSorting(true)} disabled={items.length < 2}>Ordenar</Button>
          <Tooltip title={showDefaults ? 'Cargá primero los valores originales para no perderlos' : ''}>
            <span>
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={props.onCreate} disabled={showDefaults}>{newLabel}</Button>
            </span>
          </Tooltip>
        </Box>
      </Box>
      {description && <Typography variant="body2" color="text.secondary" mb={2}>{description}</Typography>}

      {showDefaults && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={<Button color="inherit" size="small" disabled={busy} onClick={() => run(props.onImportDefaults)}>Cargar para editar</Button>}
        >
          Todavía no cargaste nada acá, así que el sitio muestra los valores originales ({defaults.length}). Cargalos
          para poder editarlos, reordenarlos o desactivarlos.
          <Stack component="ul" spacing={0.5} sx={{ m: 0, mt: 1, pl: 2 }}>
            {defaults.map((d) => (
              <li key={d.key}>
                <Typography variant="body2">{d.primary}{d.secondary ? ` — ${d.secondary}` : ''}</Typography>
              </li>
            ))}
          </Stack>
        </Alert>
      )}

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {items.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>{emptyText}</Typography>
        ) : (
          <Stack spacing={2}>
            {items.map((item) => (
              <Card key={item.id} sx={{ p: 2, borderRadius: 2, borderLeft: item.is_active ? '4px solid #10B981' : '4px solid #94A3B8' }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                  <Box display="flex" gap={1.5} alignItems="flex-start" minWidth={0}>
                    <Box color="primary.main" pt={0.25}><EntryIcon name={icon(item)} /></Box>
                    <Box minWidth={0}>
                      <Typography fontWeight={600} sx={{ wordBreak: 'break-word' }}>{primary(item)}</Typography>
                      {secondary?.(item) && <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>{secondary(item)}</Typography>}
                      <Chip size="small" label={item.is_active ? 'Visible' : 'Oculto'} color={item.is_active ? 'success' : 'default'} sx={{ mt: 0.5 }} />
                    </Box>
                  </Box>
                  <Box display="flex" flexShrink={0} alignItems="center">
                    <Tooltip title={item.is_active ? 'Ocultar del sitio' : 'Mostrar en el sitio'}>
                      <Switch size="small" checked={item.is_active} disabled={busy} onChange={() => run(() => props.onToggleActive(item))} />
                    </Tooltip>
                    <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => props.onEdit(item)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setDeleting(item)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
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
                <TableCell width={56}><strong>#</strong></TableCell>
                <TableCell><strong>Detalle</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center"><Typography color="text.secondary" py={2}>{emptyText}</Typography></TableCell></TableRow>
              ) : items.map((item, index) => (
                <TableRow key={item.id} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1.5} alignItems="center">
                      <Box color="primary.main" display="flex"><EntryIcon name={icon(item)} /></Box>
                      <Box>
                        <Typography fontWeight={600}>{primary(item)}</Typography>
                        {secondary?.(item) && <Typography variant="body2" color="text.secondary">{secondary(item)}</Typography>}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={item.is_active ? 'Ocultar del sitio' : 'Mostrar en el sitio'}>
                      <Switch size="small" checked={item.is_active} disabled={busy} onChange={() => run(() => props.onToggleActive(item))} />
                    </Tooltip>
                    <Chip size="small" label={item.is_active ? 'Visible' : 'Oculto'} color={item.is_active ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => props.onEdit(item)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setDeleting(item)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <AppDialog open={!!deleting} onClose={() => setDeleting(null)}>
        <DialogTitle>Eliminar</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Eliminar «{deleting ? primary(deleting) : ''}»? Dejará de mostrarse en el sitio. Si solo querés sacarlo
            por un tiempo, es mejor ocultarlo.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleting(null)}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            disabled={busy}
            onClick={() => run(async () => {
              const target = deleting;
              if (!target) return;
              await props.onDelete(target);
              setDeleting(null);
            })}
          >
            Eliminar
          </Button>
        </DialogActions>
      </AppDialog>

      <SiteSortModal open={sorting} title={`Ordenar: ${title}`} entries={sortEntries} onClose={() => setSorting(false)} onSave={props.onReorder} />
    </Box>
  );
}
