import React from 'react';
import { Box } from '@mui/material';

// Sin mayúsculas ni tildes: "habiles" resalta "hábiles". Para letras con tilde (precomposed) el largo
// no cambia al plegar, así que los índices del texto plegado sirven sobre el original.
export const fold = (v: string) => v.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const escapeRegExp = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Parte `text` en trozos, marcando los que coinciden con alguno de los `terms` (ya plegados). */
function splitByTerms(text: string, terms: string[]): Array<{ text: string; match: boolean }> {
  const usable = terms.filter((t) => t.length >= 2);
  if (usable.length === 0 || !text) return [{ text, match: false }];
  const folded = fold(text);
  // Si plegar cambió el largo (caracteres raros) no se puede mapear a posiciones: se deja sin resaltar.
  if (folded.length !== text.length) return [{ text, match: false }];

  const pattern = new RegExp(
    [...usable].sort((a, b) => b.length - a.length).map(escapeRegExp).join('|'),
    'g',
  );
  const parts: Array<{ text: string; match: boolean }> = [];
  let last = 0;
  for (const m of folded.matchAll(pattern)) {
    const start = m.index ?? 0;
    if (start > last) parts.push({ text: text.slice(last, start), match: false });
    parts.push({ text: text.slice(start, start + m[0].length), match: true });
    last = start + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), match: false });
  return parts.length > 0 ? parts : [{ text, match: false }];
}

/**
 * Resalta, dentro de los hijos de React, las palabras buscadas. Solo toca los textos: los elementos
 * hijos (negritas, código, etc.) se resaltan solos porque cada uno aplica esto a sus propios hijos.
 */
export function highlightChildren(children: React.ReactNode, terms: string[]): React.ReactNode {
  if (terms.length === 0) return children;
  return React.Children.map(children, (child) => {
    if (typeof child !== 'string') return child;
    const parts = splitByTerms(child, terms);
    if (parts.length === 1 && !parts[0].match) return child;
    return parts.map((p, i) => (p.match ? (
      <Box
        key={i}
        component="mark"
        sx={{ bgcolor: 'warning.light', color: 'inherit', px: 0.25, borderRadius: 0.5 }}
      >
        {p.text}
      </Box>
    ) : (
      <React.Fragment key={i}>{p.text}</React.Fragment>
    )));
  });
}
