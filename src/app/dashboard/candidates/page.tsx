'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Paper, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, DialogTitle, DialogContent, DialogActions, Tooltip,
  Stack, Chip, TextField, useMediaQuery, useTheme,
} from '@mui/material';
import AppDialog from '@/components/common/AppDialog';
import FeedbackModal from '../../../components/FeedbackModal';
import GearSpinner from '../../../components/GearSpinner';
import ListFilters, { FilterSelect, FilterSwitch } from '../../../components/common/ListFilters';
import CandidateFormFields, { emptyCandidateForm } from '../../../components/candidates/CandidateFormFields';
import CandidateDuplicateAlerts from '../../../components/candidates/CandidateDuplicateAlerts';
import CandidateFilePicker from '../../../components/candidates/CandidateFilePicker';
import {
  PersonSearchOutlined as TitleIcon, RefreshOutlined as RefreshIcon, AddOutlined as AddIcon,
  VisibilityOutlined as ViewIcon, AttachFileOutlined as AttachIcon,
} from '@mui/icons-material';
import {
  Candidate, CandidateService, CandidateStage, CandidateSource, CandidateFormValues,
  CandidateUploadFile, LookupCategory, LookupService,
} from '../../../utils/api';
import { useAuth, userHasPermission } from '../../../utils/auth';
import { relativeTime } from '../../../utils/dates';
import {
  CANDIDATE_STAGE_LABELS, CANDIDATE_SOURCE_LABELS, currentApplication, fullName,
} from '../../../utils/candidates';

// Postulantes (ver FLOWS.md §59): personas que se presentaron a trabajar, cargadas a mano por alguien
// de Personal. Este listado muestra a la PERSONA con la etapa de su postulación vigente; la ficha
// (/dashboard/candidates/[id]) tiene el detalle, los papeles y el historial.

export default function CandidatesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const canWrite = userHasPermission(user, 'candidates_write');

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);

  // Filtros del listado — consultan al servidor (ver FLOWS.md §39 y §52).
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [includeClosed, setIncludeClosed] = useState(false);
  const hasActiveFilters = !!(search || filterStage || filterSource || includeClosed);
  const clearFilters = () => {
    setSearch(''); setFilterStage(''); setFilterSource(''); setIncludeClosed(false);
  };

  // Alta
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState<CandidateFormValues>(emptyCandidateForm());
  const [position, setPosition] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [files, setFiles] = useState<CandidateUploadFile[]>([]);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [categories, setCategories] = useState<LookupCategory[]>([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const list = await CandidateService.getAll({
        q: search || undefined,
        stage: (filterStage || undefined) as CandidateStage | undefined,
        source: (filterSource || undefined) as CandidateSource | undefined,
        include_closed: includeClosed,
      });
      setCandidates(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los postulantes');
    } finally {
      setLoading(false);
    }
  }, [search, filterStage, filterSource, includeClosed]);

  // Los filtros consultan al servidor; la búsqueda por texto con un pequeño debounce.
  useEffect(() => {
    const timeout = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [load, search]);

  // El catálogo de categorías solo hace falta al abrir el alta.
  useEffect(() => {
    if (!openCreate || categories.length > 0) return;
    LookupService.getCategories().then(setCategories).catch(() => setCategories([]));
  }, [openCreate, categories.length]);

  const handleOpenCreate = () => {
    setForm(emptyCandidateForm());
    setPosition('');
    setCoverLetter('');
    setFiles([]);
    setSubmitAttempted(false);
    setOpenCreate(true);
  };

  const handleCreate = async () => {
    setSubmitAttempted(true);
    if (!form.name.trim() || !form.lastname.trim()) return;
    try {
      setProcessing(true);
      const created = await CandidateService.create({ ...form, position_of_interest: position, cover_letter: coverLetter }, files);
      setOpenCreate(false);
      setSuccess('Postulante cargado.');
      router.push(`/dashboard/candidates/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el postulante');
    } finally {
      setProcessing(false);
    }
  };

  const stageChip = (candidate: Candidate) => {
    const application = currentApplication(candidate);
    if (!application) return <Chip label="Sin postulación" size="small" variant="outlined" />;
    const { label, color } = CANDIDATE_STAGE_LABELS[application.stage];
    return <Chip label={label} color={color} size="small" />;
  };

  const filesCount = (candidate: Candidate) => Number(candidate.files_count || 0);

  const renderActions = (candidate: Candidate) => (
    <Tooltip title="Ver ficha">
      <IconButton size="small" onClick={() => router.push(`/dashboard/candidates/${candidate.id}`)}><ViewIcon fontSize="small" /></IconButton>
    </Tooltip>
  );

  if (loading && candidates.length === 0 && !hasActiveFilters) return <GearSpinner />;

  const emptyMessage = hasActiveFilters ? 'No hay postulantes que coincidan con los filtros' : 'No hay postulantes cargados';

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <TitleIcon color="primary" />
          <Typography variant="h5" fontWeight="bold">Postulantes</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button startIcon={<RefreshIcon />} onClick={load}>Actualizar</Button>
          {canWrite && <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>Nuevo postulante</Button>}
        </Box>
      </Box>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      <ListFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre, DNI, CUIL, email, teléfono u oficio…"
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      >
        <FilterSelect
          label="Etapa"
          value={filterStage}
          onChange={setFilterStage}
          emptyLabel="Todas las etapas"
          options={(Object.keys(CANDIDATE_STAGE_LABELS) as CandidateStage[]).map((value) => ({ value, label: CANDIDATE_STAGE_LABELS[value].label }))}
        />
        <FilterSelect
          label="Origen"
          value={filterSource}
          onChange={setFilterSource}
          emptyLabel="Todos los orígenes"
          options={(Object.keys(CANDIDATE_SOURCE_LABELS) as CandidateSource[]).map((value) => ({ value, label: CANDIDATE_SOURCE_LABELS[value] }))}
        />
        <FilterSwitch label="Ver terminados" checked={includeClosed} onChange={setIncludeClosed} />
      </ListFilters>

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {candidates.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>{emptyMessage}</Typography>
        ) : (
          <Stack spacing={2}>
            {candidates.map((c) => (
              <Card key={c.id} sx={{ p: 2, borderRadius: 2, cursor: 'pointer' }} onClick={() => router.push(`/dashboard/candidates/${c.id}`)}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1} gap={1}>
                  <Box minWidth={0}>
                    <Typography variant="subtitle2" fontWeight="bold">{fullName(c)}</Typography>
                    {c.trade && <Typography variant="body2" color="text.secondary">{c.trade}</Typography>}
                  </Box>
                  {stageChip(c)}
                </Box>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  <Chip label={CANDIDATE_SOURCE_LABELS[c.source]} variant="outlined" size="small" />
                  {c.dni && <Typography variant="caption" color="text.secondary">DNI {c.dni}</Typography>}
                  <Typography variant="caption" color="text.secondary">{relativeTime(c.createdAt)}</Typography>
                  {filesCount(c) > 0 && (
                    <Box display="flex" alignItems="center" color="text.secondary"><AttachIcon sx={{ fontSize: 16 }} /><Typography variant="caption">{filesCount(c)}</Typography></Box>
                  )}
                </Box>
                <Box mt={1} onClick={(e) => e.stopPropagation()}>{renderActions(c)}</Box>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cargado</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>DNI</TableCell>
                <TableCell>Oficio / puesto</TableCell>
                <TableCell>Origen</TableCell>
                <TableCell>Etapa</TableCell>
                <TableCell>Papeles</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {candidates.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center">{emptyMessage}</TableCell></TableRow>
              ) : (
                candidates.map((c) => (
                  <TableRow key={c.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/dashboard/candidates/${c.id}`)}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{relativeTime(c.createdAt)}</TableCell>
                    <TableCell>{fullName(c)}</TableCell>
                    <TableCell>{c.dni || '—'}</TableCell>
                    <TableCell>{c.trade || currentApplication(c)?.position_of_interest || '—'}</TableCell>
                    <TableCell>{CANDIDATE_SOURCE_LABELS[c.source]}</TableCell>
                    <TableCell>{stageChip(c)}</TableCell>
                    <TableCell>{filesCount(c)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>{renderActions(c)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Alta */}
      <AppDialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>Nuevo postulante</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Cargá los datos de una persona que se presentó en la oficina o en la planta. Solo el nombre y el apellido son
              obligatorios; el resto se puede completar después desde su ficha.
            </Typography>
            <CandidateDuplicateAlerts dni={form.dni} cuil={form.cuil} email={form.email} phone={form.phone} />
            <CandidateFormFields values={form} onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))} categories={categories} forceShowError={submitAttempted} />
            <Typography variant="subtitle2" sx={{ pt: 1 }}>Postulación</Typography>
            <TextField label="Puesto al que se postula" fullWidth value={position} onChange={(e) => setPosition(e.target.value)}
              helperText="Si lo dejás vacío se usa el oficio." />
            <TextField label="Carta o comentario" fullWidth multiline rows={2} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} />
            <Typography variant="subtitle2" sx={{ pt: 1 }}>Papeles</Typography>
            <CandidateFilePicker files={files} onChange={setFiles} onError={setError} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)} disabled={processing}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate} disabled={processing}>
            {processing ? <GearSpinner size={20} /> : 'Cargar postulante'}
          </Button>
        </DialogActions>
      </AppDialog>
    </Box>
  );
}
