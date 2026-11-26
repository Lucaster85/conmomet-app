'use client';
import React, { useState } from 'react';
import {
  Button, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Stack, Switch, TextField, Tooltip,
} from '@mui/material';
import AppDialog from '@/components/common/AppDialog';
import { BusinessOutlined as CompanyIcon } from '@mui/icons-material';
import IconSelect from '../IconSelect';
import {
  CompanySettingsService, SiteContentService, type SiteLinkGroup, type SiteLinkKind, type SiteLinkRow,
} from '@/utils/api';
import SiteListSection, { type DefaultEntry } from './SiteListSection';
import { useSiteResource } from './useSiteResource';
import type { SiteTabProps } from './types';

const KINDS: Record<SiteLinkKind, { label: string; valueLabel: string; helper: string; icon: string }> = {
  whatsapp: { label: 'WhatsApp', valueLabel: 'Número con código de país', helper: 'Ej: 5492262679570. Se abre el chat de WhatsApp.', icon: 'whatsapp' },
  phone: { label: 'Teléfono', valueLabel: 'Número', helper: 'Ej: +542262679570 o (2262) 679570. Se puede escribir con espacios y guiones.', icon: 'phone' },
  email: { label: 'Email', valueLabel: 'Dirección de email', helper: 'Ej: ventas@miempresa.com', icon: 'mail' },
  address: { label: 'Dirección', valueLabel: 'Dirección completa', helper: 'Se abre en Google Maps.', icon: 'pin' },
  url: { label: 'Enlace externo', valueLabel: 'URL', helper: 'Tiene que empezar con https:// (ej. la página de Instagram).', icon: 'instagram' },
  internal: { label: 'Página del sitio', valueLabel: 'Ruta', helper: 'Ej: /trabaja-con-nosotros', icon: 'briefcase' },
};
const GROUP_TITLES: Record<SiteLinkGroup, string> = { contact: 'Datos de contacto', quick: 'Enlaces rápidos del pie' };
const GROUP_HELP: Record<SiteLinkGroup, string> = {
  contact: 'Aparecen en la sección «Contacto» (menos las direcciones) y en la columna Contacto del pie. Un cambio acá se ve en los dos lugares.',
  quick: 'La columna «Enlaces rápidos» del pie de página: redes, «Trabajá con nosotros», dónde encontrarnos.',
};

interface Draft {
  kind: SiteLinkKind;
  label: string;
  value: string;
  icon: string;
  is_active: boolean;
}
const emptyDraft = (): Draft => ({ kind: 'phone', label: '', value: '', icon: KINDS.phone.icon, is_active: true });

const digits = (v: string) => v.replace(/[\s().-]/g, '');

export default function LinksTab(props: SiteTabProps) {
  const { data, defaults, reload, onSuccess, onError } = props;
  const [group, setGroup] = useState<SiteLinkGroup>('contact');
  const [editing, setEditing] = useState<SiteLinkRow | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const actions = useSiteResource<SiteLinkRow>({ resource: 'links', reload, onSuccess, onError });

  const originalsOf = (g: SiteLinkGroup) => (g === 'contact' ? defaults.footer.contact : defaults.footer.links);

  const openCreate = (g: SiteLinkGroup) => { setGroup(g); setEditing(null); setDraft(emptyDraft()); setOpen(true); };
  const openEdit = (item: SiteLinkRow) => {
    setGroup(item.group);
    setEditing(item);
    setDraft({ kind: item.kind, label: item.label, value: item.value, icon: item.icon, is_active: item.is_active });
    setOpen(true);
  };

  // Al cambiar el tipo, el ícono acompaña mientras todavía sea el que sugiere el tipo anterior.
  const changeKind = (kind: SiteLinkKind) =>
    setDraft((d) => ({ ...d, kind, icon: d.icon === KINDS[d.kind].icon ? KINDS[kind].icon : d.icon }));

  const handleSave = async () => {
    if (!draft.label.trim() || !draft.value.trim()) return onError('El texto y el valor son obligatorios.');
    setSaving(true);
    try {
      if (editing) await SiteContentService.update('links', editing.id, draft);
      else await SiteContentService.create('links', { ...draft, group });
      onSuccess(editing ? 'Enlace actualizado.' : 'Enlace creado.');
      setOpen(false);
      await reload();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // Prellena teléfono, email y dirección desde los Datos de mi empresa. Se copian y se pueden editar: el perfil
  // de la empresa es el emisor fiscal de las facturas y no se lee en vivo desde el sitio (FLOWS.md §82/§86).
  const importFromCompany = async () => {
    setImporting(true);
    try {
      const { profile } = await CompanySettingsService.get();
      const address = [[profile.address_street, profile.address_number].filter(Boolean).join(' '), profile.address_locality, profile.address_province]
        .filter(Boolean).join(', ');
      const candidates: { kind: SiteLinkKind; label: string; value: string }[] = [];
      if (profile.phone?.trim()) candidates.push({ kind: 'phone', label: `Teléfono ${profile.phone.trim()}`, value: profile.phone });
      if (profile.email?.trim()) candidates.push({ kind: 'email', label: profile.email.trim(), value: profile.email });
      if (address) candidates.push({ kind: 'address', label: address, value: address });

      const existing = data.links.filter((l) => l.group === 'contact');
      const fresh = candidates.filter((c) => !existing.some((l) => l.kind === c.kind && digits(l.value).toLowerCase() === digits(c.value).toLowerCase()));
      if (fresh.length === 0) {
        onSuccess('No hay datos nuevos para traer: los de la empresa ya están cargados o están vacíos.');
        return;
      }
      for (const c of fresh) await SiteContentService.create('links', { ...c, group: 'contact', icon: KINDS[c.kind].icon });
      onSuccess(`Se trajeron ${fresh.length} dato(s) de la empresa. Revisá el texto de cada uno.`);
      await reload();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al traer los datos de la empresa');
    } finally {
      setImporting(false);
    }
  };

  const section = (g: SiteLinkGroup) => {
    const originals = originalsOf(g);
    const defaultEntries: DefaultEntry[] = originals.map((l) => ({ key: `${l.kind}-${l.value}-${l.label}`, icon: l.icon, primary: l.label, secondary: l.value }));
    return (
      <SiteListSection<SiteLinkRow>
        key={g}
        title={GROUP_TITLES[g]}
        description={GROUP_HELP[g]}
        newLabel="Nuevo enlace"
        emptyText="No hay enlaces cargados"
        items={data.links.filter((l) => l.group === g)}
        touched={g === 'contact' ? data.touched.contact_links : data.touched.quick_links}
        defaults={defaultEntries}
        icon={(l) => l.icon}
        primary={(l) => l.label}
        secondary={(l) => `${KINDS[l.kind].label}: ${l.value}`}
        onCreate={() => openCreate(g)}
        onEdit={openEdit}
        onToggleActive={actions.toggle}
        onDelete={actions.remove}
        onReorder={actions.reorder}
        onImportDefaults={() => actions.importAll(originals.map((l) => ({ group: g, kind: l.kind, label: l.label, value: l.value, icon: l.icon })))}
        extraActions={g === 'contact' ? (locked) => (
          <Tooltip title={locked ? 'Cargá primero los valores originales para no perderlos' : 'Copia teléfono, email y dirección de Datos de mi empresa'}>
            <span>
              <Button variant="outlined" size="small" startIcon={<CompanyIcon />} onClick={importFromCompany} disabled={locked || importing}>
                {importing ? 'Trayendo…' : 'Traer de Datos de mi empresa'}
              </Button>
            </span>
          </Tooltip>
        ) : undefined}
      />
    );
  };

  const meta = KINDS[draft.kind];
  return (
    <>
      {section('contact')}
      {section('quick')}

      <AppDialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Editar enlace' : 'Nuevo enlace'} — {GROUP_TITLES[group]}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField select label="Tipo" value={draft.kind} onChange={(e) => changeKind(e.target.value as SiteLinkKind)} fullWidth>
              {(Object.keys(KINDS) as SiteLinkKind[]).map((k) => <MenuItem key={k} value={k}>{KINDS[k].label}</MenuItem>)}
            </TextField>
            <TextField label="Texto que se muestra" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} required fullWidth inputProps={{ maxLength: 120 }} helperText="Ej: Cotizaciones (2262) 679570" />
            <TextField label={meta.valueLabel} value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} required fullWidth inputProps={{ maxLength: 255 }} helperText={meta.helper} />
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
