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
};

export default function HelpMarkdown({ content }: { content: string }) {
  return <ReactMarkdown components={components}>{content}</ReactMarkdown>;
}
