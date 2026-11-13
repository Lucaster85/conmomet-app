'use client';

import React, { useMemo, useState } from 'react';
import {
  Box,
  Container,
  TextField,
  InputAdornment,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpMarkdown from './HelpMarkdown';
import { fold, highlightChildren } from './highlight';
import { HelpTopicWithContent } from '../../utils/helpContent';

export default function HelpPageClient({ topics }: { topics: HelpTopicWithContent[] }) {
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({});
  // Lo que el usuario abrió o cerró a mano MIENTRAS busca (clave "c:<categoría>" o "t:<tema>"). Se
  // limpia al cambiar la búsqueda y es independiente del estado de cuando no hay búsqueda.
  const [searchOpen, setSearchOpen] = useState<Record<string, boolean>>({});

  // Cada palabra de la búsqueda tiene que aparecer (en cualquier orden) en el título, la categoría o las
  // palabras clave del tema: "carga horas adicionales" encuentra Adicionales aunque ninguna palabra
  // clave sea esa frase exacta.
  const searchTerms = useMemo(() => fold(search).split(/\s+/).filter(Boolean), [search]);
  const isSearching = searchTerms.length > 0;

  const groupedByCategory = useMemo(() => {
    const categories: string[] = [];
    for (const topic of topics) {
      if (!categories.includes(topic.category)) categories.push(topic.category);
    }

    return categories
      .map((category) => {
        const categoryTopics = topics.filter((topic) => {
          if (topic.category !== category) return false;
          if (!isSearching) return true;
          const haystack = fold([topic.title, topic.category, ...topic.keywords].join(' '));
          return searchTerms.every((term) => haystack.includes(term));
        });
        return { category, topics: categoryTopics };
      })
      .filter((group) => group.topics.length > 0);
  }, [topics, searchTerms, isSearching]);

  const singleResult = groupedByCategory.reduce((sum, g) => sum + g.topics.length, 0) === 1;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Centro de Ayuda
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Encontrá acá el paso a paso de los flujos correctos de la app, organizados por tema.
      </Typography>

      <TextField
        fullWidth
        placeholder="Buscar por palabra clave (ej: rechazar, tarifas, usuarios)..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setSearchOpen({}); }}
        sx={{ mb: 3 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />

      {groupedByCategory.length === 0 && (
        <Typography color="text.secondary" textAlign="center" py={4}>
          No se encontraron temas de ayuda para &quot;{search}&quot;.
        </Typography>
      )}

      {groupedByCategory.map(({ category, topics: categoryTopics }) => {
        // Buscando: las categorías arrancan abiertas para ver qué temas coinciden, y los temas
        // cerrados (solo el título) para elegir el que interesa; con un único resultado se abre solo.
        // Todo se puede abrir y cerrar a mano.
        const categoryExpanded = isSearching ? (searchOpen[`c:${category}`] ?? true) : !!openCategories[category];
        return (
          <Accordion
            key={category}
            expanded={categoryExpanded}
            onChange={(_, expanded) =>
              isSearching
                ? setSearchOpen((prev) => ({ ...prev, [`c:${category}`]: expanded }))
                : setOpenCategories((prev) => ({ ...prev, [category]: expanded }))
            }
            disableGutters
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={600}>{highlightChildren(category, searchTerms)}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              {categoryTopics.map((topic) => {
                const topicExpanded = isSearching ? (searchOpen[`t:${topic.id}`] ?? singleResult) : !!openTopics[topic.id];
                return (
                  <Accordion
                    key={topic.id}
                    expanded={topicExpanded}
                    onChange={(_, expanded) =>
                      isSearching
                        ? setSearchOpen((prev) => ({ ...prev, [`t:${topic.id}`]: expanded }))
                        : setOpenTopics((prev) => ({ ...prev, [topic.id]: expanded }))
                    }
                    disableGutters
                    variant="outlined"
                    sx={{ mb: 1, '&:before': { display: 'none' } }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>{highlightChildren(topic.title, searchTerms)}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ '& > *:last-child': { mb: 0 } }}>
                        <HelpMarkdown content={topic.content} highlightTerms={searchTerms} />
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Container>
  );
}
