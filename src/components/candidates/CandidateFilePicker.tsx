'use client';
import React, { useRef } from 'react';
import { Box, Button, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { AttachFileOutlined as AttachIcon, CloseOutlined as CloseIcon } from '@mui/icons-material';
import { CandidateUploadFile, CandidateFileKind } from '../../utils/api';
import {
  CANDIDATE_ACCEPT, CANDIDATE_FILE_KIND_OPTIONS, CANDIDATE_MAX_FILES, validateCandidateFile,
} from '../../utils/candidates';

interface Props {
  files: CandidateUploadFile[];
  onChange: (files: CandidateUploadFile[]) => void;
  // Cuántos archivos se pueden sumar en total (el backend acepta hasta 5 por envío).
  max?: number;
  // Se llama con el mensaje cuando un archivo se descarta, para mostrarlo con el FeedbackModal de la página.
  onError: (message: string) => void;
}

const formatSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

// Papeles del postulante, cada uno con su tipo (CV, carta, certificado). Valida formato y tamaño al
// elegirlos, para no hacerle esperar una subida que el servidor va a rechazar. El primero que se agrega
// sin CV previo se marca como CV: es lo más común y ahorra un click.
export default function CandidateFilePicker({ files, onChange, max = CANDIDATE_MAX_FILES, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    const next = [...files];
    for (const file of picked) {
      if (next.length >= max) {
        onError(`Podés adjuntar hasta ${max} archivos.`);
        break;
      }
      const problem = validateCandidateFile(file);
      if (problem) {
        onError(problem);
        continue;
      }
      const hasCv = next.some((f) => f.kind === 'cv');
      next.push({ file, kind: hasCv ? 'other' : 'cv' });
    }
    onChange(next);
  };

  const setKind = (index: number, kind: CandidateFileKind) =>
    onChange(files.map((f, i) => (i === index ? { ...f, kind } : f)));

  return (
    <Box>
      <input ref={inputRef} type="file" hidden multiple accept={CANDIDATE_ACCEPT} onChange={handlePick} />
      <Button size="small" variant="outlined" startIcon={<AttachIcon />} onClick={() => inputRef.current?.click()} disabled={files.length >= max}>
        Adjuntar archivos
      </Button>
      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
        PDF, Word, JPG o PNG · hasta 10 MB cada uno
      </Typography>
      {files.length > 0 && (
        <Stack spacing={1} sx={{ mt: 1.5 }}>
          {files.map((f, index) => (
            <Box key={`${f.file.name}-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 140 }}>
                <Typography variant="body2" noWrap>{f.file.name}</Typography>
                <Typography variant="caption" color="text.secondary">{formatSize(f.file.size)}</Typography>
              </Box>
              <TextField select size="small" label="Tipo" value={f.kind} onChange={(e) => setKind(index, e.target.value as CandidateFileKind)} sx={{ minWidth: 170 }}>
                {CANDIDATE_FILE_KIND_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
              <IconButton size="small" aria-label="Quitar archivo" onClick={() => onChange(files.filter((_, i) => i !== index))}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
