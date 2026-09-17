'use client';
import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Box, Typography, Button } from '@mui/material';

interface SignaturePadProps {
  label?: string;
  required?: boolean;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  error?: boolean;
}

const CANVAS_HEIGHT = 180;

export default function SignaturePad({ label, required, onChange, disabled, error }: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas>(null);

  const handleEnd = () => {
    const sig = sigRef.current;
    if (!sig || sig.isEmpty()) {
      onChange(null);
      return;
    }
    sig.getTrimmedCanvas().toBlob((blob) => {
      onChange(blob ? new File([blob], 'firma.png', { type: 'image/png' }) : null);
    }, 'image/png');
  };

  const handleClear = () => {
    sigRef.current?.clear();
    onChange(null);
  };

  return (
    <Box>
      {label && (
        <Typography variant="body2" color={error ? 'error' : 'text.secondary'} gutterBottom>
          {label}{required && ' *'}
        </Typography>
      )}
      <Box
        sx={{
          border: '1px dashed',
          borderColor: error ? 'error.main' : 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          onEnd={handleEnd}
          canvasProps={{
            style: {
              width: '100%',
              height: CANVAS_HEIGHT,
              touchAction: 'none',
              opacity: disabled ? 0.5 : 1,
              pointerEvents: disabled ? 'none' : 'auto',
            },
          }}
        />
      </Box>
      <Button size="small" onClick={handleClear} disabled={disabled} sx={{ mt: 0.5 }}>
        Borrar firma
      </Button>
    </Box>
  );
}
