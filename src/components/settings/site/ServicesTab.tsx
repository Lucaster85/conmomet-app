'use client';
import React, { useState } from 'react';
import { Button, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, Switch, TextField } from '@mui/material';
import AppDialog from '@/components/common/AppDialog';
import IconSelect from '../IconSelect';
import { SiteContentService, type SiteDefaults, type SiteServiceRow } from '@/utils/api';
import SiteListSection, { type DefaultEntry } from './SiteListSection';
import { useSiteResource } from './useSiteResource';
import type { SiteTabProps } from './types';

interface Draft {
  title: string;
  text: string;
  bulletsText: string;
  icon: string;
  is_active: boolean;
}
const emptyDraft = (): Draft => ({ title: '', text: '', bulletsText: '', icon: 'wrench', is_active: true });

interface ServiceDefault { icon: string; title: string; text: string; bullets: string[] }
const defaultServices = (defaults: SiteDefaults): ServiceDefault[] => {
  const block = defaults.blocks.find((b) => b.type === 'services');
  return Array.isArray(block?.content.items) ? (block.content.items as ServiceDefault[]) : [];
};

export default function ServicesTab({ data, defaults, reload, onSuccess, onError }: SiteTabProps) {
  const [editing, setEditing] = useState<SiteServiceRow | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const actions = useSiteResource<SiteServiceRow>({ resource: 'services', reload, onSuccess, onError });

  const originals = defaultServices(defaults);
  const defaultEntries: DefaultEntry[] = originals.map((s) => ({ key: s.title, icon: s.icon, primary: s.title, secondary: s.text || s.bullets.join(' · ') }));

  const openCreate = () => { setEditing(null); setDraft(emptyDraft()); setOpen(true); };
  const openEdit = (item: SiteServiceRow) => {
    setEditing(item);
    setDraft({ title: item.title, text: item.text, bulletsText: item.bullets.join('\n'), icon: item.icon, is_active: item.is_active });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!draft.title.trim()) return onError('El título es obligatorio.');
    setSaving(true);
    try {
      const body = { title: draft.title, text: draft.text, bullets: draft.bulletsText.split('\n'), icon: draft.icon, is_active: draft.is_active };
      if (editing) await SiteContentService.update('services', editing.id, body);
      else await SiteContentService.create('services', body);
      onSuccess(editing ? 'Servicio actualizado.' : 'Servicio creado.');
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
      <SiteListSection<SiteServiceRow>
        title="Servicios"
        description="Las tarjetas de la sección «Servicios» del sitio. Cada una lleva un título, un ícono y un texto o una lista de puntos."
        newLabel="Nuevo servicio"
        emptyText="No hay servicios cargados"
        items={data.services}
        touched={data.touched.services}
        defaults={defaultEntries}
        icon={(s) => s.icon}
        primary={(s) => s.title}
        secondary={(s) => s.text || s.bullets.join(' · ') || undefined}
        onCreate={openCreate}
        onEdit={openEdit}
        onToggleActive={actions.toggle}
        onDelete={actions.remove}
        onReorder={actions.reorder}
        onImportDefaults={() => actions.importAll(originals.map((s) => ({ title: s.title, text: s.text, bullets: s.bullets, icon: s.icon })))}
      />

      <AppDialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField label="Título" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required fullWidth inputProps={{ maxLength: 150 }} />
            <TextField label="Texto" value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} multiline minRows={2} fullWidth inputProps={{ maxLength: 1000 }} helperText="Opcional. Se muestra debajo del título." />
            <TextField label="Puntos" value={draft.bulletsText} onChange={(e) => setDraft({ ...draft, bulletsText: e.target.value })} multiline minRows={3} fullWidth helperText="Opcional. Uno por línea; se muestran como lista." />
            <IconSelect value={draft.icon} onChange={(icon) => setDraft({ ...draft, icon })} />
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

