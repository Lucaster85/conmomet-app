'use client';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  BeachAccess as VacationIcon,
  LocalHospital as MedicalIcon,
  FactCheck as JustifiedIcon,
  EventBusy as AbsentIcon,
} from '@mui/icons-material';
import { SelfService, LeaveRequest, LeaveBalance, Attendance } from '@/utils/api';
import dayjs from 'dayjs';

export default function PortalAttendance() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [balData, reqData, attData] = await Promise.all([
          SelfService.getMyVacationBalance(),
          SelfService.getMyLeaveRequests(),
          SelfService.getMyAttendance(),
        ]);
        setBalance(balData);
        setRequests(Array.isArray(reqData) ? reqData : []);
        setAttendances(Array.isArray(attData) ? attData : []);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Error al cargar la información.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getTypeChip = (type: string) => {
    switch (type) {
      case 'vacation': return <Chip size="small" icon={<VacationIcon />} label="Vacaciones" color="primary" variant="outlined" />;
      case 'medical_leave': return <Chip size="small" icon={<MedicalIcon />} label="Lic. Médica" color="error" variant="outlined" />;
      case 'justified': return <Chip size="small" icon={<JustifiedIcon />} label="Justificada" color="warning" variant="outlined" />;
      case 'absent': return <Chip size="small" icon={<AbsentIcon />} label="Ausente" color="error" variant="filled" />;
      default: return <Chip size="small" label={type} variant="outlined" />;
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'approved': return <Chip size="small" label="Aprobada" color="success" />;
      case 'pending': return <Chip size="small" label="Pendiente" color="warning" />;
      case 'rejected': return <Chip size="small" label="Rechazada" color="error" />;
      case 'cancelled': return <Chip size="small" label="Cancelada" color="default" />;
      default: return <Chip size="small" label={status} />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Mi Asistencia y Licencias
      </Typography>

      <Grid container spacing={4}>
        {/* Vacation Balance */}
        <Grid size={{ xs: 12, md: 5, lg: 4 }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}>
                <VacationIcon color="primary" /> Saldo de Vacaciones ({new Date().getFullYear()})
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              {balance ? (
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">Días Correspondientes:</Typography>
                    <Typography variant="body2" fontWeight={600}>{balance.corresponding_days}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">Días Usados:</Typography>
                    <Typography variant="body2" fontWeight={600}>{balance.used_days}</Typography>
                  </Box>
                  
                  <Box mt={3}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body1" fontWeight={600} color="primary">Días Disponibles:</Typography>
                      <Typography variant="body1" fontWeight={600} color="primary">{balance.balance}</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={balance.corresponding_days > 0 ? (balance.used_days / balance.corresponding_days) * 100 : 0} 
                      sx={{ height: 10, borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.05)' }}
                      color={balance.balance === 0 ? "error" : "primary"}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                    * Los días se calculan según tu antigüedad (Art. 150 LCT).
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay información de saldo disponible.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Leave Requests */}
        <Grid size={{ xs: 12, md: 7, lg: 8 }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Mis Solicitudes
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {requests.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Desde</TableCell>
                        <TableCell>Hasta</TableCell>
                        <TableCell align="center">Días</TableCell>
                        <TableCell>Estado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {requests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell>{getTypeChip(req.leave_type)}</TableCell>
                          <TableCell>{dayjs(req.start_date).format('DD/MM/YYYY')}</TableCell>
                          <TableCell>{dayjs(req.end_date).format('DD/MM/YYYY')}</TableCell>
                          <TableCell align="center"><strong>{req.total_days}</strong></TableCell>
                          <TableCell>{getStatusChip(req.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>No tenés solicitudes de licencia registradas.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Attendance History */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Registro de Ausencias (Presentismo)
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {attendances.length > 0 ? (
                <TableContainer component={Paper} elevation={0} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Notas</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendances
                        .slice(0, 30) // Mostramos las últimas 30 para no saturar
                        .map((att) => (
                        <TableRow key={att.id}>
                          <TableCell>{dayjs(att.date).format('DD/MM/YYYY')}</TableCell>
                          <TableCell>{getTypeChip(att.status)}</TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                            {att.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="success" sx={{ mt: 2 }}>No tenés registros de ausencias.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
