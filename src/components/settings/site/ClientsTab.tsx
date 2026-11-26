'use client';
import React, { useState } from 'react';
import { Button, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, Switch, TextField } from '@mui/material';
import AppDialog from '@/components/common/AppDialog';
import { SiteContentService, type SiteClientRow } from '@/utils/api';
import SiteListSection, { type DefaultEntry } from './SiteListSection';
import { useSiteResource } from './useSiteResource';
import type { SiteTabProps } from './types';

interface Draft {
  name: string;
  short_name: string;
  logo_file: string;
  is_active: boolean;
}
const emptyDraft = (): Draft => ({ name: '', short_name: '', logo_file: '', is_active: true });

interface ClientDefault { name: string; shortName: string; logo: string | null }

export default function ClientsTab({ data, defaults, reload, onSuccess, onError }: SiteTabProps) {
  const [editing, setEditing] = useState<SiteClientRow | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const actions = useSiteResource<SiteClientRow>({ resource: 'clients', reload, onSuccess, onError });

  const block = defaults.blocks.find((b) => b.type === 'clients');
  const originals = (Array.isArray(block?.content.items) ? block.content.items : []) as ClientDefault[];
  const defaultEntries: DefaultEntry[] = originals.map((c) => ({ key: c.name, primary: c.name, secondary: c.shortName }));

  const openCreate = () => { setEditing(null); setDraft(emptyDraft()); setOpen(true); };
  const openEdit = (item: SiteClientRow) => {
    setEditing(item);
    setDraft({ name: item.name, short_name: item.short_name, logo_file: item.logo_file || '', is_active: item.is_active });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!draft.name.trim()) return onError('El nombre es obligatorio.');
    setSaving(true);
    try {
      if (editing) await SiteContentService.update('clients', editing.id, draft);
      else await SiteContentService.create('clients', draft);
      onSuccess(editing ? 'Cliente actualizado.' : 'Cliente creado.');
      setOpen(false);
      await reload();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SiteListSection<SiteClientRow>
        title="Clientes"
        description="Las empresas de la sección «Clientes». Sin logo se muestra un círculo con la sigla."
        newLabel="Nuevo cliente"
        emptyText="No hay clientes cargados"
        items={data.clients}
        touched={data.touched.clients}
        defaults={defaultEntries}
        icon={() => undefined}
        primary={(c) => c.name}
        secondary={(c) => (c.logo_file ? `Logo: ${c.logo_file}` : `Sigla: ${c.short_name}`)}
        onCreate={openCreate}
        onEdit={openEdit}
        onToggleActive={actions.toggle}
        onDelete={actions.remove}
        onReorder={actions.reorder}
        onImportDefaults={() => actions.importAll(originals.map((c) => ({ name: c.name, short_name: c.shortName, logo_file: c.logo })))}
      />

      <AppDialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField label="Nombre" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required fullWidth inputProps={{ maxLength: 100 }} />
            <TextField label="Sigla" value={draft.short_name} onChange={(e) => setDraft({ ...draft, short_name: e.target.value })} fullWidth inputProps={{ maxLength: 8 }} helperText="Hasta 8 letras. Si la dejás vacía se arma con las primeras del nombre." />
            <TextField
              label="Archivo del logo"
              value={draft.logo_file}
              onChange={(e) => setDraft({ ...draft, logo_file: e.target.value.trim() })}
              fullWidth
              inputProps={{ maxLength: 80 }}
              helperText="Opcional. Nombre de una imagen de la carpeta de la marca (ej. bunge.png); la sube quien administra el sitio. Vacío = se muestra la sigla."
            />
            <FormControlLabel control={<Switch checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} />} label="Visible en el sitio" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
        </DialogActions>
      </AppDialog>
    </>
  );
}
