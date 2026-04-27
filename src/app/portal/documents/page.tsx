'use client';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';
import { SelfService, EntityDocument } from '@/utils/api';
import dayjs from 'dayjs';

export default function PortalDocuments() {
  const [documents, setDocuments] = useState<EntityDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const data = await SelfService.getMyDocuments();
        setDocuments(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Error al cargar documentos');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const getStatusChip = (doc: EntityDocument) => {
    if (!doc.is_renewable && !doc.is_transactional) {
      return <Chip label="Activo" color="success" size="small" />;
    }

    if (doc.is_transactional) {
      if (doc.computed_status === 'resolved') {
        return <Chip label="Resuelto" color="success" size="small" />;
      }
      return <Chip label="Pendiente" color="warning" size="small" />;
    }

    if (doc.computed_status === 'expired') {
      return <Chip label="Vencido" color="error" size="small" />;
    }
    if (doc.computed_status === 'expiring_soon') {
      return <Chip label="Por Vencer" color="warning" size="small" />;
    }
    return <Chip label="Vigente" color="success" size="small" />;
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Mis Documentos
      </Typography>

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {documents.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>No tenés documentos cargados.</Typography>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            {documents.map((doc) => (
              <Card key={doc.id} sx={{ borderRadius: 3, p: 2, boxShadow: '0 2px 4px rgb(0 0 0 / 0.1)' }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>{doc.title}</Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Tipo: {doc.is_transactional ? 'Transaccional' : doc.is_renewable ? 'Renovable' : 'Informativo'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Creado: {dayjs(doc.created_at).format('DD/MM/YYYY')}
                    </Typography>
                    {doc.expiration_date && (
                      <Typography variant="body2" color="text.secondary">
                        Vencimiento: {dayjs(doc.expiration_date).format('DD/MM/YYYY')}
                      </Typography>
                    )}
                  </Box>
                  <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
                    {getStatusChip(doc)}
                    {doc.file_url && (
                      <IconButton component="a" href={doc.file_url} target="_blank" size="small" color="primary" sx={{ mt: 1 }}>
                        <ViewIcon />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell>Documento</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Fecha Creación</TableCell>
                  <TableCell>Vencimiento / Plazo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">No tenés documentos cargados.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow key={doc.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{doc.title}</TableCell>
                      <TableCell>
                        {doc.is_transactional ? 'Transaccional' : doc.is_renewable ? 'Renovable' : 'Informativo'}
                      </TableCell>
                      <TableCell>{dayjs(doc.created_at).format('DD/MM/YYYY')}</TableCell>
                      <TableCell>
                        {doc.expiration_date ? dayjs(doc.expiration_date).format('DD/MM/YYYY') : '-'}
                      </TableCell>
                      <TableCell>{getStatusChip(doc)}</TableCell>
                      <TableCell align="right">
                        {doc.file_url && (
                          <Tooltip title="Ver/Descargar">
                            <IconButton component="a" href={doc.file_url} target="_blank" size="small" color="primary">
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </Box>
  );
}
