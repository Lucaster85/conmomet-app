'use client';
import React, { useState } from 'react';
import { Box, Button, Card, CardContent, FormControlLabel, IconButton, Stack, Switch, TextField, Tooltip, Typography } from '@mui/material';
import { AddOutlined as AddIcon, DeleteOutlined as DeleteIcon } from '@mui/icons-material';
import { SiteContentService, type SiteBlockRow } from '@/utils/api';
import type { SiteTabProps } from './types';

const BLOCK_TITLES: Record<string, string> = {
  hero: 'Inicio',
  about: 'Nosotros',
  services: 'Servicios',
  works: 'Nuestro trabajo',
  clients: 'Clientes',
  contact: 'Contacto',
};

// Campos editables por bloque: los mismos que acepta la API (siteContentController.BLOCK_FIELDS).
const BLOCK_FIELDS: Record<string, string[]> = {
  hero: ['eyebrow', 'subtitle', 'primaryCta', 'secondaryCta', 'imageAlt'],
  about: ['eyebrow', 'title', 'paragraphs', 'banner'],
  services: ['eyebrow', 'title'],
  works: ['eyebrow', 'title', 'empty'],
  clients: ['eyebrow', 'title', 'subtitle'],
  contact: ['eyebrow', 'title', 'subtitle'],
};

const FIELD_LABELS: Record<string, { label: string; helper?: string; multiline?: boolean }> = {
  eyebrow: { label: 'Texto chico sobre el título', helper: 'Se muestra en mayúsculas, arriba del título.' },
  title: { label: 'Título' },
  subtitle: { label: 'Subtítulo / bajada', multiline: true },
  primaryCta: { label: 'Botón principal' },
  secondaryCta: { label: 'Botón secundario' },
  imageAlt: { label: 'Descripción de la foto', helper: 'La lee el lector de pantalla; no se ve en la web.' },
  banner: { label: 'Frase destacada', multiline: true },
  empty: { label: 'Mensaje cuando no hay obras cargadas', multiline: true },
};
const MAX_PARAGRAPHS = 6;

type Values = Record<string, string | string[]>;

function BlockCard({ type, defaults, row, onSuccess, onError, reload }: {
  type: string;
  defaults: Record<string, unknown>;
  row: SiteBlockRow | undefined;
  onSuccess: SiteTabProps['onSuccess'];
  onError: SiteTabProps['onError'];
  reload: SiteTabProps['reload'];
}) {
  const fields = BLOCK_FIELDS[type] || [];
  const initial = (): Values =>
    Object.fromEntries(fields.map((f) => {
      const value = row?.content[f] ?? defaults[f];
      return [f, f === 'paragraphs' ? (Array.isArray(value) ? value.map(String) : []) : typeof value === 'string' ? value : ''];
    }));

  const [values, setValues] = useState<Values>(initial);
  const [visible, setVisible] = useState(row?.is_visible ?? true);
  const [saving, setSaving] = useState(false);

  const set = (field: string, value: string | string[]) => setValues((v) => ({ ...v, [field]: value }));

  const handleSave = async () => {
    // Solo se guarda lo que difiere del texto original: lo que no se tocó sigue al manifiesto de la marca.
    const content: Record<string, unknown> = {};
    for (const f of fields) {
      if (f === 'paragraphs') {
        const list = (values.paragraphs as string[]).map((p) => p.trim()).filter(Boolean);
        if (list.length > 0 && JSON.stringify(list) !== JSON.stringify(defaults.paragraphs)) content.paragraphs = list;
      } else {
        const text = (values[f] as string).trim();
        if (text && text !== defaults[f]) content[f] = text;
      }
    }
    setSaving(true);
    try {
      await SiteContentService.updateBlock(type, { content, is_visible: visible });
      onSuccess(`Se guardó la sección «${BLOCK_TITLES[type] || type}».`);
      await reload();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al guardar la sección');
    } finally {
      setSaving(false);
    }
  };

  const restore = () => {
    setValues(Object.fromEntries(fields.map((f) => [f, f === 'paragraphs' ? ((defaults.paragraphs as string[]) || []) : String(defaults[f] ?? '')])));
    setVisible(true);
  };

  return (
    <Card sx={{ borderRadius: 3, mb: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={2}>
          <Typography variant="h6" fontWeight={600}>{BLOCK_TITLES[type] || type}</Typography>
          <FormControlLabel control={<Switch checked={visible} onChange={(e) => setVisible(e.target.checked)} />} label="Mostrar esta sección en el sitio" />
        </Box>
        {type === 'hero' && (
          <Typography variant="body2" color="text.secondary" mb={2}>El título grande es el nombre de la empresa; no se edita desde acá.</Typography>
        )}
        <Stack spacing={2.5}>
          {fields.map((f) => {
            if (f === 'paragraphs') {
              const list = values.paragraphs as string[];
              return (
                <Stack key={f} spacing={1.5}>
                  <Typography variant="body2" color="text.secondary">Párrafos</Typography>
                  {list.map((p, i) => (
                    <Box key={i} display="flex" gap={1} alignItems="flex-start">
                      <TextField label={`Párrafo ${i + 1}`} value={p} onChange={(e) => set('paragraphs', list.map((x, j) => (j === i ? e.target.value : x)))} multiline minRows={3} fullWidth inputProps={{ maxLength: 2000 }} />
                      <Tooltip title="Quitar párrafo"><IconButton color="error" onClick={() => set('paragraphs', list.filter((_, j) => j !== i))}><DeleteIcon /></IconButton></Tooltip>
                    </Box>
                  ))}
                  <Button size="small" startIcon={<AddIcon />} disabled={list.length >= MAX_PARAGRAPHS} onClick={() => set('paragraphs', [...list, ''])} sx={{ alignSelf: 'flex-start' }}>Agregar párrafo</Button>
                </Stack>
              );
            }
            const meta = FIELD_LABELS[f];
            return (
              <TextField
                key={f}
                label={meta.label}
                value={values[f] as string}
                onChange={(e) => set(f, e.target.value)}
                multiline={meta.multiline}
                minRows={meta.multiline ? 2 : undefined}
                fullWidth
                inputProps={{ maxLength: 1000 }}
                helperText={meta.helper}
              />
            );
          })}
        </Stack>
        <Box display="flex" gap={1} mt={3} flexWrap="wrap">
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
          <Button onClick={restore} disabled={saving}>Volver a los textos originales</Button>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function BlockTextsTab({ data, defaults, reload, onSuccess, onError }: SiteTabProps) {
  return (
    <>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Los textos de cada sección del sitio. Si borrás un campo y guardás, vuelve al texto original. Lo que no
        cambies sigue el texto original de la marca.
      </Typography>
      {defaults.blocks.filter((b) => BLOCK_FIELDS[b.type]).map((b) => {
        const row = data.blocks.find((r) => r.block_type === b.type);
        // La key incluye lo guardado: al recargar tras guardar, el formulario se vuelve a armar con lo que quedó.
        return (
          <BlockCard
            key={`${b.type}-${JSON.stringify(row ?? null)}`}
            type={b.type}
            defaults={b.content}
            row={row}
            onSuccess={onSuccess}
            onError={onError}
            reload={reload}
          />
        );
      })}
    </>
  );
}
