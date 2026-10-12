'use client';
import React, { useMemo, useState } from 'react';
import { Box, Paper, Typography, Chip, Stack, Button, IconButton, Tooltip } from '@mui/material';
import {
  VisibilityOutlined as SeenIcon,
  DoneAllOutlined as MarkAllIcon,
  ReplayOutlined as ResetIcon,
} from '@mui/icons-material';
import { AlertType, AlertItemRef, MAX_VISIBLE_ITEMS } from '../../utils/alerts';
import { useAlertViews } from './AlertViewsProvider';

// El shell visual de un aviso del tablero (ver FLOWS.md §36). Antes de este flujo este Paper
// estaba copiado y pegado en los 5 componentes de aviso; ahora vive una sola vez y agrega el
// acuse de vista encima.
//
// El contenido de cada item lo pone quien lo usa vía `renderItem`: el shell no sabe nada de
// chips de vencimiento, de comentarios ni de botones de Renovar/Resolver.

export interface DashboardAlertItem extends AlertItemRef {
  /** Lo que se dibuja para este item. */
  content: React.ReactNode;
}

interface DashboardAlertCardProps {
  type: AlertType;
  title: string;
  icon: React.ReactNode;
  color: 'info' | 'warning' | 'error' | 'primary' | 'success';
  /** TODOS los items del aviso, vistos y no vistos. El filtrado lo hace el shell. */
  items: DashboardAlertItem[];
  /** Contenido extra al pie (botones del tipo "Ver pedidos pendientes"). */
  footer?: React.ReactNode;
  /** Secciones libres arriba de la lista, para avisos con más de un bloque. */
  children?: React.ReactNode;
}

export default function DashboardAlertCard({
  type,
  title,
  icon,
  color,
  items,
  footer,
  children,
}: DashboardAlertCardProps) {
  const alertViews = useAlertViews();
  const [showSeen, setShowSeen] = useState(false);
  const [showAllUnseen, setShowAllUnseen] = useState(false);

  // Sin provider (ej. un aviso montado fuera del tablero), se comporta como antes: todo visible.
  const unseen = useMemo(
    () => (alertViews ? items.filter((i) => !alertViews.isSeen(type, i.entity_id, i.revision)) : items),
    [alertViews, items, type]
  );
  const seenItems = useMemo(
    () => (alertViews ? items.filter((i) => alertViews.isSeen(type, i.entity_id, i.revision)) : []),
    [alertViews, items, type]
  );

  // La tarjeta desaparece cuando no queda nada nuevo — el total sigue visible en la barra de
  // resumen, que es exactamente el pedido: "seguir viendo la cantidad general".
  if (items.length === 0) return null;
  if (unseen.length === 0 && !showSeen) return null;

  const visibleUnseen = showAllUnseen ? unseen : unseen.slice(0, MAX_VISIBLE_ITEMS);
  const hiddenUnseenCount = unseen.length - visibleUnseen.length;

  const markOne = (item: DashboardAlertItem) =>
    alertViews?.markSeen(type, [{ entity_id: item.entity_id, revision: item.revision }]);
  const markAll = () =>
    alertViews?.markSeen(type, unseen.map((i) => ({ entity_id: i.entity_id, revision: i.revision })));

  const renderRow = (item: DashboardAlertItem, isSeenRow: boolean) => (
    <Box
      key={item.entity_id}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 1,
        opacity: isSeenRow ? 0.6 : 1,
      }}
    >
      <Box flex={1} minWidth={0}>{item.content}</Box>
      {alertViews && !isSeenRow && (
        <Tooltip title="Marcar como visto">
          <IconButton size="small" onClick={() => markOne(item)} aria-label="Marcar como visto">
            <SeenIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );

  return (
    <Paper sx={{ p: 3, borderRadius: 2, mb: 3, borderLeft: '4px solid', borderLeftColor: `${color}.main` }}>
      <Box display="flex" alignItems="center" gap={1} mb={2} flexWrap="wrap">
        <Box sx={{ display: 'flex', color: `${color}.main` }}>{icon}</Box>
        <Typography variant="h6" fontWeight="bold">{title}</Typography>
        {/* El total es el de TODOS los items, no el de los no vistos: marcar visto esconde el
            detalle, nunca baja el contador. */}
        <Chip label={items.length} color={color} size="small" />
        {alertViews && unseen.length > 0 && unseen.length < items.length && (
          <Chip label={`${unseen.length} sin ver`} size="small" variant="outlined" />
        )}
        <Box flexGrow={1} />
        {alertViews && unseen.length > 0 && (
          <Button size="small" startIcon={<MarkAllIcon />} onClick={markAll}>
            Marcar todos como vistos
          </Button>
        )}
      </Box>

      {children}

      <Stack spacing={1.5}>
        {visibleUnseen.map((item) => renderRow(item, false))}
      </Stack>

      {hiddenUnseenCount > 0 && (
        <Button size="small" sx={{ mt: 1 }} onClick={() => setShowAllUnseen(true)}>
          Ver {hiddenUnseenCount} más sin ver
        </Button>
      )}

      {showSeen && seenItems.length > 0 && (
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            Ya vistos ({seenItems.length})
          </Typography>
          <Stack spacing={1.5}>
            {seenItems.map((item) => renderRow(item, true))}
          </Stack>
        </Box>
      )}

      {(footer || (alertViews && seenItems.length > 0)) && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {footer}
          {alertViews && seenItems.length > 0 && (
            <>
              <Button size="small" onClick={() => setShowSeen((v) => !v)}>
                {showSeen ? 'Ocultar vistos' : `Mostrar los ${seenItems.length} vistos`}
              </Button>
              <Button size="small" startIcon={<ResetIcon />} onClick={() => alertViews.resetSeen(type)}>
                Volver a mostrar todo
              </Button>
            </>
          )}
        </Box>
      )}
    </Paper>
  );
}
