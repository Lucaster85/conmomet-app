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
  Alert,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { VisibilityOutlined as ViewIcon, ArticleOutlined as TitleIcon } from '@mui/icons-material';
import { SelfService, EntityDocument } from '@/utils/api';
import GearSpinner from '@/components/GearSpinner';
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

  // Deriva el chip solo de `computed_status` + `is_renewable` — sin flags inventados. Un
  // documento sin vencimiento queda "Activo" para siempre; uno no renovable (ej. una multa)
  // se resuelve con un comprobante y pasa a "Pendiente"/"Resuelto"; uno renovable sigue el
  // ciclo Vigente/Por Vencer/Vencido, y si ya se renovó (queda como historial) se ve "Renovado".
  const getStatusChip = (doc: EntityDocument) => {
    switch (doc.computed_status) {
      case 'permanent':
        return <Chip label="Activo" color="success" size="small" />;
      case 'resolved':
        return doc.is_renewable
          ? <Chip label="Renovado" size="small" />
          : <Chip label="Resuelto" color="success" size="small" />;
      case 'expired':
        return doc.is_renewable
          ? <Chip label="Vencido" color="error" size="small" />
          : <Chip label="Pendiente" color="warning" size="small" />;
      case 'expiring_soon':
        return doc.is_renewable
          ? <Chip label="Por Vencer" color="warning" size="small" />
          : <Chip label="Pendiente" color="warning" size="small" />;
      default:
        return <Chip label="Vigente" color="success" size="small" />;
    }
  };

  // TODO: más adelante agregar acá un switch — no "ver solo vencidos", sino "también ver
  // vencidos" (la lista pasaría a ocultarlos por defecto, análogo al switch "Mostrar
  // resueltos" que ya existe en Empleados/Vehículos). Por ahora se muestra todo sin filtrar,
  // a propósito, para salir rápido con esta versión.
  if (loading) return <Box display="flex" justifyContent="center" mt={8}><GearSpinner /></Box>;
  if (error) return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <TitleIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" fontWeight={600}>
          Mis Documentos
        </Typography>
      </Box>

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
                      Tipo: {doc.is_renewable ? 'Renovable' : 'Informativo'}
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
                        {doc.is_renewable ? 'Renovable' : 'Informativo'}
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
