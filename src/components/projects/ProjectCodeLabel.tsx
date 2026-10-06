'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Box, Chip, Typography } from '@mui/material';
import { ProjectCodeRef } from '../../utils/projectCode';

interface Props {
  project: ProjectCodeRef;
  // El padre como chip que lleva a su ficha (por defecto) o como texto secundario.
  linkParent?: boolean;
}

// Código principal fuerte + el padre a un costado: "A-2026-001 ↳ P-2026-063".
export default function ProjectCodeLabel({ project, linkParent = true }: Props) {
  const router = useRouter();
  const parent = project.parent;
  return (
    <Box component="span" display="inline-flex" alignItems="center" gap={0.75} flexWrap="wrap">
      <Typography component="span" variant="body2" fontWeight={700}>{project.code || '—'}</Typography>
      {parent && (linkParent ? (
        <Chip
          size="small" variant="outlined" clickable label={`↳ ${parent.code}`}
          onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/projects/${parent.id}`); }}
        />
      ) : (
        <Typography component="span" variant="caption" color="text.secondary">↳ {parent.code}</Typography>
      ))}
    </Box>
  );
}
