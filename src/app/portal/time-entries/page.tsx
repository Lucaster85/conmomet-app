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
  TextField,
  Button,
  Stack
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { SelfService, TimeEntry } from '@/utils/api';
import dayjs from 'dayjs';

export default function PortalTimeEntries() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dateFrom, setDateFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [dateTo, setDateTo] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const data = await SelfService.getMyTimeEntries(dateFrom, dateTo);
      setEntries(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al cargar las horas registradas');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalNormal = entries.reduce((acc, curr) => acc + (Number(curr.regular_hours) || 0), 0);
  const totalExtra = entries.reduce((acc, curr) => acc + (Number(curr.overtime_50_hours) || 0) + (Number(curr.overtime_100_hours) || 0), 0);

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Mis Horas Registradas
      </Typography>

      <Card sx={{ mb: 3, p: 2, borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            label="Desde"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            fullWidth
          />
          <TextField
            label="Hasta"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            fullWidth
          />
          <Button 
            variant="contained" 
            onClick={fetchEntries}
            startIcon={<SearchIcon />}
            sx={{ minWidth: 120 }}
          >
            Filtrar
          </Button>
        </Stack>
      </Card>

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
        ) : error ? (
          <Typography color="error" textAlign="center" py={2}>{error}</Typography>
        ) : entries.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>No hay horas registradas en este período.</Typography>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            {entries.map((entry) => (
              <Card key={entry.id} sx={{ borderRadius: 3, p: 2, boxShadow: '0 2px 4px rgb(0 0 0 / 0.1)' }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {dayjs(entry.date).format('DD/MM/YYYY')}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2" color="text.secondary">Horas Normales:</Typography>
                  <Typography variant="body2" fontWeight={500}>{entry.regular_hours}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">Horas Extras:</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {Number(entry.overtime_50_hours || 0) + Number(entry.overtime_100_hours || 0)}
                  </Typography>
                </Box>
                {entry.notes && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Nota: {entry.notes}
                  </Typography>
                )}
              </Card>
            ))}
            
            <Card sx={{ borderRadius: 3, p: 2, bgcolor: 'info.50', mt: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>Total del período</Typography>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Normales:</Typography>
                <Typography variant="body2" fontWeight={600} color="primary.main">{totalNormal}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Extras:</Typography>
                <Typography variant="body2" fontWeight={600} color="primary.main">{totalExtra}</Typography>
              </Box>
            </Card>
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
                  <TableCell>Fecha</TableCell>
                  <TableCell>Horas Normales</TableCell>
                  <TableCell>Horas Extras</TableCell>
                  <TableCell>Observaciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      <CircularProgress size={30} />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      <Typography color="error">{error}</Typography>
                    </TableCell>
                  </TableRow>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">No hay horas registradas en este período.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {entries.map((entry) => (
                      <TableRow key={entry.id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{dayjs(entry.date).format('DD/MM/YYYY')}</TableCell>
                        <TableCell>{entry.regular_hours}</TableCell>
                        <TableCell>{Number(entry.overtime_50_hours || 0) + Number(entry.overtime_100_hours || 0)}</TableCell>
                        <TableCell>{entry.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: 'info.50' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Total del período</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{totalNormal}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{totalExtra}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </Box>
  );
}
