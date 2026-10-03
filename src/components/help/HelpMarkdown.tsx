'use client';

import React from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import { Typography, List, ListItem, Box } from '@mui/material';

const components: Components = {
  h1: ({ children }) => (
    <Typography variant="h6" fontWeight={600} gutterBottom>{children}</Typography>
  ),
  h2: ({ children }) => (
    <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 1 }}>{children}</Typography>
  ),
  h3: ({ children }) => (
    <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 1.5, mb: 0.5 }}>{children}</Typography>
  ),
  p: ({ children }) => (
    <Typography variant="body2" sx={{ mb: 1.5 }}>{children}</Typography>
  ),
  ul: ({ children }) => (
    <List sx={{ listStyleType: 'disc', pl: 3, py: 0 }}>{children}</List>
  ),
  ol: ({ children }) => (
    <List component="ol" sx={{ listStyleType: 'decimal', pl: 3, py: 0 }}>{children}</List>
  ),
  li: ({ children }) => (
    <ListItem sx={{ display: 'list-item', px: 0, py: 0.5 }}>
      <Typography variant="body2" component="span">{children}</Typography>
    </ListItem>
  ),
  strong: ({ children }) => (
    <Box component="strong" sx={{ fontWeight: 700 }}>{children}</Box>
  ),
  // Bloques de código: se usan para los diagramas de flujo en ASCII de la Ayuda. Sin este
  // override caían al estilo por defecto del navegador y se desbordaban a lo ancho en mobile,
  // que es donde más se usa la app. `overflowX: auto` los deja scrollear solos sin romper el
  // ancho de la página.
  pre: ({ children }) => (
    <Box
      component="pre"
      sx={{
        bgcolor: 'grey.50',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: 1.5,
        my: 2,
        overflowX: 'auto',
        maxWidth: '100%',
        fontFamily: 'monospace',
        fontSize: { xs: '0.68rem', sm: '0.78rem' },
        lineHeight: 1.45,
        whiteSpace: 'pre',
      }}
    >
      {children}
    </Box>
  ),
  // Inline (`algo` dentro de un párrafo). El `pre` de arriba también envuelve un `code`, pero
  // ahí ya viene todo el estilo del contenedor — por eso este queda neutro cuando está dentro.
  code: ({ children }) => (
    <Box
      component="code"
      sx={{
        fontFamily: 'monospace',
        fontSize: 'inherit',
        'pre &': { bgcolor: 'transparent', px: 0, py: 0 },
        bgcolor: 'grey.100',
        px: 0.5,
        py: 0.1,
        borderRadius: 0.5,
      }}
    >
      {children}
    </Box>
  ),
};

export default function HelpMarkdown({ content }: { content: string }) {
  return <ReactMarkdown components={components}>{content}</ReactMarkdown>;
}
