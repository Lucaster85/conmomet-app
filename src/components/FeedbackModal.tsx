'use client';
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box,
} from '@mui/material';
import {
  ErrorOutline as ErrorIcon,
  CheckCircleOutline as SuccessIcon,
  InfoOutlined as InfoIcon,
  WarningAmberOutlined as WarningIcon,
} from '@mui/icons-material';

type FeedbackType = 'error' | 'success' | 'info' | 'warning';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  message: string;
  type?: FeedbackType;
  title?: string;
  onConfirm?: () => void;
  confirmLabel?: string;
}

const CONFIG: Record<FeedbackType, { icon: React.ReactNode; color: string; defaultTitle: string }> = {
  error: {
    icon: <ErrorIcon sx={{ fontSize: 48 }} />,
    color: '#d32f2f',
    defaultTitle: 'Error',
  },
  success: {
    icon: <SuccessIcon sx={{ fontSize: 48 }} />,
    color: '#2e7d32',
    defaultTitle: 'Operación exitosa',
  },
  info: {
    icon: <InfoIcon sx={{ fontSize: 48 }} />,
    color: '#0288d1',
    defaultTitle: 'Información',
  },
  warning: {
    icon: <WarningIcon sx={{ fontSize: 48 }} />,
    color: '#ed6c02',
    defaultTitle: 'Atención',
  },
};

export default function FeedbackModal({ open, onClose, message, type = 'error', title, onConfirm, confirmLabel = 'Confirmar' }: FeedbackModalProps) {
  const config = CONFIG[type];

  if (!message) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
          },
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
        },
      }}
    >
      <Box
        sx={{
          bgcolor: config.color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 3,
          py: 2,
        }}
      >
        {config.icon}
        <DialogTitle sx={{ p: 0, color: 'white', fontWeight: 700, fontSize: '1.15rem' }}>
          {title || config.defaultTitle}
        </DialogTitle>
      </Box>
      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Typography variant="body1" color="text.primary">
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        {onConfirm ? (
          <>
            <Button
              onClick={onClose}
              variant="outlined"
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3 }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => { onConfirm(); onClose(); }}
              variant="contained"
              sx={{
                bgcolor: config.color,
                '&:hover': { bgcolor: config.color, filter: 'brightness(0.9)' },
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 4,
              }}
            >
              {confirmLabel}
            </Button>
          </>
        ) : (
          <Button
            onClick={onClose}
            variant="contained"
            sx={{
              bgcolor: config.color,
              '&:hover': { bgcolor: config.color, filter: 'brightness(0.9)' },
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 4,
            }}
          >
            Aceptar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
