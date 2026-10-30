'use client';
import React, { useState } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { SettingsOutlined as SettingsIcon } from '@mui/icons-material';
import CreatableSelect from '../common/CreatableSelect';
import DocumentCategoryQuickDialog from './DocumentCategoryQuickDialog';
import { DocumentCategory, DocumentCategoryService } from '../../utils/api';
import { TokenManager, userHasPermission } from '../../utils/auth';

interface Props {
  appliesTo: 'employee' | 'vehicle';
  categories: DocumentCategory[];
  value: number | null;
  onChange: (category: DocumentCategory | null) => void;
  // El padre recarga `categories` (después de un alta o de gestionar desde el diálogo).
  onCategoriesChanged: () => void | Promise<void>;
  label?: string;
  helperText?: React.ReactNode;
}

// Selector de categoría de documento con alta inline ("Agregar «X»") y un botón que abre el ABM
// rápido para renombrar/eliminar. Las categorías de un legajo son siempre de su `appliesTo`.
export default function DocumentCategorySelect({
  appliesTo, categories, value, onChange, onCategoriesChanged, label = 'Categoría', helperText,
}: Props) {
  const user = TokenManager.getUser();
  const canCreate = userHasPermission(user, 'document_categories_write');
  const canManage = canCreate
    || userHasPermission(user, 'document_categories_update')
    || userHasPermission(user, 'document_categories_delete');

  const [manageOpen, setManageOpen] = useState(false);
  const [error, setError] = useState('');

  const handleChanged = async () => {
    await onCategoriesChanged();
  };

  const handleClose = () => {
    setManageOpen(false);
    // Si la elegida se eliminó desde el diálogo, ya no está en la lista: se limpia la selección.
    if (value && !categories.some((c) => c.id === value)) onChange(null);
  };

  return (
    <Box display="flex" alignItems="flex-start" gap={0.5}>
      <CreatableSelect<DocumentCategory>
        options={categories}
        getLabel={(c) => `${c.name}${c.is_plant_specific ? ' ⚙' : ''}`}
        value={value}
        onChange={(c) => { setError(''); onChange(c); }}
        onCreate={canCreate ? async (name) => {
          setError('');
          const created = await DocumentCategoryService.create({ name, applies_to: appliesTo });
          await onCategoriesChanged();
          return created;
        } : undefined}
        onError={setError}
        label={label}
        placeholder="— Sin categoría —"
        error={!!error}
        helperText={error || helperText}
        noOptionsText="Sin categorías"
      />
      {canManage && (
        <Tooltip title="Gestionar categorías">
          <IconButton size="small" onClick={() => setManageOpen(true)} sx={{ mt: 0.5 }}>
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      <DocumentCategoryQuickDialog
        open={manageOpen}
        onClose={handleClose}
        appliesTo={appliesTo}
        categories={categories}
        onChanged={handleChanged}
      />
    </Box>
  );
}
