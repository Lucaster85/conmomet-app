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
import { HelpTopicWithContent } from '../../utils/helpContent';

export default function HelpPageClient({ topics }: { topics: HelpTopicWithContent[] }) {
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({});

  const normalizedSearch = search.trim().toLowerCase();
  const isSearching = normalizedSearch.length > 0;

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
          const haystack = [topic.title, topic.category, ...topic.keywords]
            .join(' ')
            .toLowerCase();
          return haystack.includes(normalizedSearch);
        });
        return { category, topics: categoryTopics };
      })
      .filter((group) => group.topics.length > 0);
  }, [topics, normalizedSearch, isSearching]);

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
        onChange={(e) => setSearch(e.target.value)}
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
        const categoryExpanded = isSearching ? true : !!openCategories[category];
        return (
          <Accordion
            key={category}
            expanded={categoryExpanded}
            onChange={(_, expanded) =>
              setOpenCategories((prev) => ({ ...prev, [category]: expanded }))
            }
            disableGutters
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={600}>{category}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              {categoryTopics.map((topic) => {
                const topicExpanded = isSearching ? true : !!openTopics[topic.id];
                return (
                  <Accordion
                    key={topic.id}
                    expanded={topicExpanded}
                    onChange={(_, expanded) =>
                      setOpenTopics((prev) => ({ ...prev, [topic.id]: expanded }))
                    }
                    disableGutters
                    variant="outlined"
                    sx={{ mb: 1, '&:before': { display: 'none' } }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>{topic.title}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ '& > *:last-child': { mb: 0 } }}>
                        <HelpMarkdown content={topic.content} />
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
