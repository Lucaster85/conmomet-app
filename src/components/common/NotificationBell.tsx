'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge, IconButton, Popover, Box, Typography, Button, Divider, Stack,
  CircularProgress, Tooltip,
} from '@mui/material';
import {
  NotificationsOutlined as BellIcon,
  RequestQuoteOutlined as QuoteIcon,
  AssignmentTurnedInOutlined as ValidateIcon,
  ReplyOutlined as ReturnedIcon,
  SendOutlined as SentIcon,
  DoneAllOutlined as MarkAllIcon,
  BuildOutlined as RepairIcon,
  DescriptionOutlined as DocumentIcon,
  SecurityOutlined as EppIcon,
  ErrorOutlineOutlined as ExpiredIcon,
} from '@mui/icons-material';
import { NotificationService, AppNotification, NotificationType } from '../../utils/api';
import { useAuth } from '../../utils/auth';

// Campanita del header (ver FLOWS.md §37). Es el historial de lo que ya se manda por push: a
// diferencia del push —que es fire-and-forget y si no llega no deja rastro— acá queda registro
// con leído/no leído.
//
// Sin permiso que la gatee: las notificaciones de cada usuario son suyas. Si no tiene ninguna,
// la campanita se muestra igual pero sin badge (a diferencia de los avisos del tablero, que
// desaparecen: un header con un ícono que aparece y desaparece se siente roto).

const PAGE_SIZE = 10;

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  quote_request_assigned: <QuoteIcon fontSize="small" color="info" />,
  quote_request_delivered: <ValidateIcon fontSize="small" color="info" />,
  quote_request_returned: <ReturnedIcon fontSize="small" color="warning" />,
  budget_sent: <SentIcon fontSize="small" color="success" />,
  tool_in_repair_assigned: <RepairIcon fontSize="small" color="warning" />,
  oca_budget_pending: <QuoteIcon fontSize="small" color="info" />,
  // Vencido en rojo, por vencer en amarillo: el color es la única diferencia visual rápida entre
  // "ya es tarde" y "te queda tiempo".
  document_expiring: <DocumentIcon fontSize="small" color="warning" />,
  document_expired: <ExpiredIcon fontSize="small" color="error" />,
  epp_expiring: <EppIcon fontSize="small" color="warning" />,
  epp_expired: <ExpiredIcon fontSize="small" color="error" />,
};

// Defensiva a propósito: con una fecha inválida, `getTime()` da NaN, TODAS las comparaciones de
// abajo dan false y se cae hasta el último return, que renderiza el string "Invalid Date" en la
// campanita. Un formateador de fecha en la UI nunca debería poder mostrar eso — si la fecha no
// sirve, mejor no decir nada que mentirle al usuario.
function relativeTime(iso?: string | null): string {
  if (!iso) return '';
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return '';

  const diff = Date.now() - time;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} días`;
  return new Date(iso).toLocaleDateString('es-AR');
}

export default function NotificationBell() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = (user as unknown as Record<string, unknown>)?.id as number | undefined;

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const open = Boolean(anchorEl);

  const refreshCount = useCallback(async () => {
    if (!userId) return;
    try {
      setUnreadCount(await NotificationService.getUnreadCount());
    } catch {
      // Silencioso: un badge que no se pudo actualizar no justifica molestar al usuario.
    }
  }, [userId]);

  const loadFirstPage = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const feed = await NotificationService.getAll({ limit: PAGE_SIZE });
      setItems(feed.data);
      setUnreadCount(feed.unread_count);
      setHasMore(feed.has_more);
      setCursor(feed.next_cursor);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadMore = async () => {
    if (!cursor) return;
    setLoading(true);
    try {
      const feed = await NotificationService.getAll({ limit: PAGE_SIZE, before: cursor });
      setItems((prev) => [...prev, ...feed.data]);
      setHasMore(feed.has_more);
      setCursor(feed.next_cursor);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // Badge al montar.
  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  // Refresco sin polling: al volver la pestaña al foco, y cuando el service worker avisa que
  // acaba de llegar un push (ver public/sw.js). Un setInterval pegaría a la API para siempre en
  // cada pestaña abierta, incluso de noche y sin nadie mirando.
  useEffect(() => {
    if (!userId) return;

    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshCount();
    };
    document.addEventListener('visibilitychange', onVisible);

    const onSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'push-received') refreshCount();
    };
    navigator.serviceWorker?.addEventListener?.('message', onSwMessage);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      navigator.serviceWorker?.removeEventListener?.('message', onSwMessage);
    };
  }, [userId, refreshCount]);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    loadFirstPage();
  };

  // Abrir la campanita NO marca todo como leído: el usuario puede querer dejar algo pendiente de
  // atender. Se marca al tocar cada fila, o con "Marcar todas como leídas".
  const handleItemClick = async (n: AppNotification) => {
    setAnchorEl(null);
    if (!n.read_at) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        setUnreadCount(await NotificationService.markRead(n.id));
      } catch {
        refreshCount();
      }
    }
    if (n.url) router.push(n.url);
  };

  const handleMarkAll = async () => {
    const previous = items;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((x) => (x.read_at ? x : { ...x, read_at: now })));
    setUnreadCount(0);
    try {
      await NotificationService.markAllRead();
    } catch {
      setItems(previous);
      refreshCount();
    }
  };

  if (!userId) return null;

  return (
    <>
      <Tooltip title="Notificaciones">
        <IconButton color="inherit" onClick={handleOpen} aria-label="Notificaciones">
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <BellIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: 'calc(100vw - 32px)', sm: 400 },
              maxWidth: 400,
              maxHeight: '70vh',
              borderRadius: 2,
            },
          },
        }}
      >
        <Box sx={{ p: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">Notificaciones</Typography>
          <Box flexGrow={1} />
          {unreadCount > 0 && (
            <Button size="small" startIcon={<MarkAllIcon />} onClick={handleMarkAll}>
              Marcar todas
            </Button>
          )}
        </Box>
        <Divider />

        {loading && items.length === 0 ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
        ) : items.length === 0 ? (
          <Box textAlign="center" py={4} px={2}>
            <Typography variant="body2" color="text.secondary">
              No tenés notificaciones todavía.
            </Typography>
          </Box>
        ) : (
          <Stack divider={<Divider />}>
            {items.map((n) => (
              <Box
                key={n.id}
                onClick={() => handleItemClick(n)}
                sx={{
                  p: 2,
                  display: 'flex',
                  gap: 1.5,
                  cursor: 'pointer',
                  bgcolor: n.read_at ? 'transparent' : 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' },
                }}
              >
                <Box sx={{ mt: 0.25, flexShrink: 0 }}>{TYPE_ICON[n.type] ?? <BellIcon fontSize="small" />}</Box>
                <Box flex={1} minWidth={0}>
                  <Typography variant="body2" fontWeight={n.read_at ? 400 : 700}>
                    {n.title}
                  </Typography>
                  {n.body && (
                    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                      {n.body}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {relativeTime(n.created_at)}
                  </Typography>
                </Box>
                {!n.read_at && (
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main', mt: 1, flexShrink: 0 }} />
                )}
              </Box>
            ))}
          </Stack>
        )}

        {hasMore && (
          <Box sx={{ p: 1, textAlign: 'center' }}>
            <Button size="small" onClick={loadMore} disabled={loading}>
              {loading ? 'Cargando…' : 'Ver más'}
            </Button>
          </Box>
        )}
      </Popover>
    </>
  );
}
