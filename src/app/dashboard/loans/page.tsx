'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Tooltip, Stack, TextField, InputAdornment,
  MenuItem, FormControl, InputLabel, Select
} from '@mui/material';
import {
  AddOutlined as AddIcon, DeleteOutlined as DeleteIcon, VisibilityOutlined as VisibilityIcon,
  RefreshOutlined as RefreshIcon, SearchOutlined as SearchIcon,
  CheckCircleOutlined as ApproveIcon, CancelOutlined as RejectIcon,
  WarningAmberOutlined as ConflictIcon, PercentOutlined as InterestIcon,
  LocalAtmOutlined as CashIcon, AccountBalanceOutlined as BankIcon,
  PaymentsOutlined as PaidIcon, AttachFileOutlined as ProofIcon,
  WhatsApp as WhatsAppIcon, AssignmentReturnOutlined as SettleIcon
} from '@mui/icons-material';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FeedbackModal from '@/components/FeedbackModal';
import CurrencyInput from '@/components/CurrencyInput';
import { Loan, Employee, LoanPayment, LoanInterestApplication, LoanInstallment, PayPeriod, LoanService, EmployeeService } from '@/utils/api';
import { buildWhatsAppLink } from '@/utils/whatsapp';
import { computeFrenchSchedule } from '@/utils/loanAmortization';

const LOAN_STATUS_LABEL: Record<string, { label: string; color: 'warning' | 'success' | 'error' | 'default' | 'primary' | 'info' }> = {
  pending: { label: 'Pendiente de aprobación', color: 'warning' },
  approved: { label: 'Aprobado — pend. de pago', color: 'info' },
  active: { label: 'Activo', color: 'primary' },
  rejected: { label: 'Rechazado', color: 'error' },
  completed: { label: 'Completado', color: 'success' },
  cancelled: { label: 'Cancelado', color: 'default' },
};

// Todo préstamo nuevo se otorga siempre en ARS con cuota fija (amortización francesa) — el
// formato "a discreción" (currency/exchange_rate_at_origin, interés manual) queda congelado
// solo para los préstamos que ya existían antes de este rediseño.
const emptyForm = {
  employee_id: 0,
  start_date: '',
  amount: 0,
  num_installments: 0,
  monthly_interest_percent: 0,
  notes: '',
  payment_method: 'transferencia' as 'efectivo' | 'transferencia',
  mark_as_paid: true,
};

const SETTLE_REASON_LABEL: Record<string, string> = {
  resignation: 'Renuncia',
  dismissal: 'Despido',
  other: 'Otro motivo',
};

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const formatPeriodLabel = (p?: PayPeriod) => {
  if (!p) return 'Sin liquidación asociada';
  const half = p.type === 'first_half' ? '1ª Quincena' : '2ª Quincena';
  const month = MONTHS[(p.month ?? 1) - 1];
  return `${half} de ${month} ${p.year}`;
};

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<Loan | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: Loan | null }>({ open: false, item: null });
  const [form, setForm] = useState(emptyForm);
  const [detailLoan, setDetailLoan] = useState<Loan | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [approvingLoan, setApprovingLoan] = useState<Loan | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Loan | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [markPaidTarget, setMarkPaidTarget] = useState<Loan | null>(null);
  const [markPaidMethod, setMarkPaidMethod] = useState<'efectivo' | 'transferencia'>('transferencia');
  const [markPaidProofFile, setMarkPaidProofFile] = useState<File | null>(null);
  const [interestTarget, setInterestTarget] = useState<Loan | null>(null);
  const [interestRate, setInterestRate] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [settleTarget, setSettleTarget] = useState<Loan | null>(null);
  const [settleReason, setSettleReason] = useState<'resignation' | 'dismissal' | 'other'>('resignation');
  const [settleNotes, setSettleNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [loansData, empsData] = await Promise.all([
        LoanService.getAll(),
        EmployeeService.getAll()
      ]);
      setLoans(loansData);
      setEmployees(empsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar préstamos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenCreate = () => {
    setEditing(null);
    setApprovingLoan(null);
    setForm({ ...emptyForm, start_date: new Date().toISOString().slice(0, 10) });
    setProofFile(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setApprovingLoan(null);
  };

  const isProofRequired = form.payment_method === 'transferencia' && form.mark_as_paid;

  const notifyLoanApprovedByWhatsApp = (employee: Employee | undefined, loan: Loan) => {
    if (!employee?.phone) return;
    const installmentAmount = loan.installment_amount ? formatCurrency(Number(loan.installment_amount)) : '';
    const message = `Hola ${employee.name}, tu préstamo de ${formatCurrency(Number(loan.amount))} fue aprobado. Se va a descontar en ${loan.num_installments} cuota(s) fija(s)${installmentAmount ? ` de ${installmentAmount} por mes` : ''}.`;
    window.open(buildWhatsAppLink(employee.phone, message), '_blank');
  };

  const handleSubmit = async () => {
    if (!form.employee_id) return setError('El empleado es obligatorio');
    if (!form.start_date) return setError('La fecha es obligatoria');
    if (!form.amount || form.amount <= 0) return setError('El monto debe ser mayor a 0');
    if (!form.num_installments || form.num_installments <= 0) return setError('La cantidad de cuotas debe ser mayor a 0');
    if (!form.payment_method) return setError('El método de pago es obligatorio');
    if (isProofRequired && !proofFile) return setError('El comprobante de pago es obligatorio para transferencias.');

    const employee = employees.find(e => e.id === form.employee_id);

    try {
      if (approvingLoan) {
        const updatedLoan = await LoanService.approve(approvingLoan.id, {
          amount: form.amount,
          num_installments: form.num_installments,
          monthly_interest_percent: form.monthly_interest_percent,
          payment_method: form.payment_method,
          notes: form.notes || undefined,
          start_date: form.start_date,
          mark_as_paid: form.mark_as_paid,
        }, proofFile);
        setSuccess(form.mark_as_paid ? 'Préstamo aprobado y marcado como pagado' : 'Préstamo aprobado — queda pendiente de pago');
        if (form.mark_as_paid) notifyLoanApprovedByWhatsApp(approvingLoan.employee || employee, updatedLoan);
      } else if (editing) {
        setError('No se pueden editar préstamos. Elimine y vuelva a crear si hay un error.');
        return;
      } else {
        const createData: Parameters<typeof LoanService.create>[0] = {
          employee_id: form.employee_id,
          start_date: form.start_date,
          amount: form.amount,
          num_installments: form.num_installments,
          monthly_interest_percent: form.monthly_interest_percent,
          payment_method: form.payment_method,
          notes: form.notes || undefined,
          mark_as_paid: form.mark_as_paid,
        };
        const createdLoan = await LoanService.create(createData, proofFile);
        setSuccess('Préstamo registrado exitosamente');
        if (form.mark_as_paid) notifyLoanApprovedByWhatsApp(employee, createdLoan);
      }
      handleCloseDialog();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleOpenDetail = async (loan: Loan) => {
    setDetailLoan(loan);
    setDetailLoading(true);
    try {
      const fullLoan = await LoanService.getById(loan.id);
      setDetailLoan(fullLoan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener el detalle del préstamo');
      setDetailLoan(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.item) return;
    try {
      await LoanService.delete(deleteDialog.item.id);
      setDeleteDialog({ open: false, item: null });
      setSuccess('Préstamo eliminado');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const handleOpenApprove = (loan: Loan) => {
    setEditing(null);
    setApprovingLoan(loan);
    setForm({
      employee_id: loan.employee_id,
      start_date: new Date().toISOString().slice(0, 10),
      amount: Number(loan.requested_amount ?? loan.amount),
      num_installments: Number(loan.requested_num_installments || 0),
      monthly_interest_percent: 0,
      notes: loan.notes || '',
      payment_method: 'transferencia',
      mark_as_paid: true,
    });
    setProofFile(null);
    setOpenDialog(true);
  };

  const handleOpenMarkPaid = (loan: Loan) => {
    setMarkPaidTarget(loan);
    setMarkPaidMethod(loan.payment_method || 'transferencia');
    setMarkPaidProofFile(null);
  };

  const isMarkPaidProofRequired = markPaidMethod === 'transferencia';

  const handleConfirmMarkPaid = async () => {
    if (!markPaidTarget) return;
    if (isMarkPaidProofRequired && !markPaidProofFile) {
      setError('El comprobante de pago es obligatorio para transferencias.');
      return;
    }
    setProcessing(true);
    try {
      await LoanService.markAsPaid(markPaidTarget.id, { payment_method: markPaidMethod }, markPaidProofFile);
      setSuccess('Préstamo marcado como pagado');
      setMarkPaidTarget(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al marcar como pagado');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    setProcessing(true);
    try {
      await LoanService.reject(rejectTarget.id, rejectNotes || undefined);
      setSuccess('Préstamo rechazado');
      setRejectTarget(null);
      setRejectNotes('');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar');
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenInterest = (loan: Loan) => {
    setInterestTarget(loan);
    setInterestRate(loan.interest_rate_percent !== undefined && loan.interest_rate_percent !== null ? Number(loan.interest_rate_percent) : null);
  };

  const handleConfirmInterest = async () => {
    if (!interestTarget || !interestRate) return;
    setProcessing(true);
    try {
      await LoanService.applyInterest(interestTarget.id, { rate_percent: interestRate });
      setSuccess('Interés aplicado al saldo del préstamo');
      setInterestTarget(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aplicar interés');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmSettle = async () => {
    if (!settleTarget) return;
    setProcessing(true);
    try {
      await LoanService.settle(settleTarget.id, { reason: settleReason, notes: settleNotes || undefined });
      setSuccess('Préstamo liquidado por baja del empleado');
      setSettleTarget(null);
      setSettleNotes('');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al liquidar el préstamo');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (val: number) =>
    `$${Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

  const formatLoanAmount = (loan: Loan) =>
    loan.currency === 'USD'
      ? `USD ${Number(loan.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : formatCurrency(loan.amount);

  const formatLoanBalance = (loan: Loan) =>
    loan.currency === 'USD'
      ? `USD ${Number(loan.remaining_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : formatCurrency(loan.remaining_balance);

  const renderPaymentMethodChip = (method?: 'efectivo' | 'transferencia' | null) => {
    if (!method) return <Typography variant="body2" color="text.secondary">—</Typography>;
    return method === 'efectivo' ? (
      <Tooltip title="Efectivo">
        <CashIcon fontSize="small" sx={{ color: 'warning.main', display: 'block' }} />
      </Tooltip>
    ) : (
      <Tooltip title="Transferencia bancaria">
        <BankIcon fontSize="small" sx={{ color: 'info.main', display: 'block' }} />
      </Tooltip>
    );
  };

  const renderProofLink = (loan: Loan) => {
    if (!loan.payment_proof_url) return null;
    return (
      <Tooltip title="Ver comprobante de pago">
        <IconButton size="small" color="primary" component="a" href={loan.payment_proof_url} target="_blank" rel="noopener noreferrer">
          <ProofIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  };

  const filtered = loans.filter(c => {
    const term = search.toLowerCase();
    const empName = c.employee ? `${c.employee.lastname} ${c.employee.name}`.toLowerCase() : '';
    const notes = c.notes?.toLowerCase() || '';
    return empName.includes(term) || notes.includes(term);
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Box display="flex" alignItems="center" gap={1}>
            <BankIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em" color="#1E293B">
              Préstamos
            </Typography>
          </Box>
          <Typography variant="body2" color="#64748B">
            Gestioná los adelantos o préstamos otorgados al personal en Pesos o Dólares.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">
            Actualizar
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small">
            Otorgar Préstamo
          </Button>
        </Box>
      </Box>

      {/* Search */}
      <TextField
        placeholder="Buscar por empleado o notas..."
        fullWidth size="small" sx={{ mb: 2 }}
        value={search} onChange={(e) => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
      />

      {/* Mobile view */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {filtered.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No hay préstamos registrados</Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {filtered.map((loan) => (
              <Card key={loan.id} sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                  <Box>
                    {loan.employee && <Typography fontWeight={600}>{loan.employee.lastname}, {loan.employee.name}</Typography>}
                    <Typography variant="caption" color="text.secondary">{new Date(loan.start_date).toLocaleDateString('es-AR')}</Typography>
                  </Box>
                  <Chip label={loan.currency} size="small" variant="outlined" color={loan.currency === 'USD' ? 'info' : 'default'} />
                </Box>
                {loan.notes && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>{loan.notes}</Typography>}

                <Stack spacing={0.5} sx={{ mt: 1.5 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">Monto</Typography>
                    <Typography fontWeight="bold">{formatLoanAmount(loan)}</Typography>
                  </Box>
                  {loan.currency === 'USD' && loan.exchange_rate_at_origin && (
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Cotización</Typography>
                      <Typography variant="body2">{formatCurrency(loan.exchange_rate_at_origin)}</Typography>
                    </Box>
                  )}
                  {loan.currency === 'USD' && loan.amount_ars_at_origin && (
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Monto Pesos Orig.</Typography>
                      <Typography variant="body2" color="text.secondary">{formatCurrency(loan.amount_ars_at_origin)}</Typography>
                    </Box>
                  )}
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">Saldo Pendiente</Typography>
                    <Typography fontWeight="bold" color="error.main">{formatLoanBalance(loan)}</Typography>
                  </Box>
                </Stack>

                <Box mt={1.5} display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  <Chip
                    label={LOAN_STATUS_LABEL[loan.status]?.label || loan.status}
                    color={LOAN_STATUS_LABEL[loan.status]?.color || 'default'}
                    size="small"
                  />
                  {loan.plan_type === 'discretionary' && (
                    <Chip label="A discreción (formato anterior)" size="small" variant="outlined" />
                  )}
                  {loan.conflict_warning && (
                    <Tooltip title={loan.conflict_warning}>
                      <ConflictIcon color="warning" fontSize="small" />
                    </Tooltip>
                  )}
                  {renderPaymentMethodChip(loan.payment_method)}
                  {renderProofLink(loan)}
                </Box>

                <Box mt={1.5} display="flex" gap={1} flexWrap="wrap">
                  {loan.status === 'pending' && (
                    <>
                      <Button size="small" variant="contained" color="success" startIcon={<ApproveIcon />} onClick={() => handleOpenApprove(loan)}>Aprobar</Button>
                      <Button size="small" variant="outlined" color="error" startIcon={<RejectIcon />} onClick={() => setRejectTarget(loan)}>Rechazar</Button>
                    </>
                  )}
                  {loan.status === 'approved' && (
                    <Button size="small" variant="contained" color="success" startIcon={<PaidIcon />} onClick={() => handleOpenMarkPaid(loan)} disabled={processing}>Marcar como pagado</Button>
                  )}
                  {loan.status === 'active' && loan.plan_type === 'discretionary' && (
                    <Button size="small" variant="outlined" color="secondary" startIcon={<InterestIcon />} onClick={() => handleOpenInterest(loan)}>Aplicar interés</Button>
                  )}
                  {loan.status === 'active' && loan.plan_type === 'fixed_installments' && (
                    <Button size="small" variant="outlined" color="warning" startIcon={<SettleIcon />} onClick={() => setSettleTarget(loan)}>Liquidar por baja</Button>
                  )}
                  <Button size="small" variant="outlined" startIcon={<VisibilityIcon />} onClick={() => handleOpenDetail(loan)}>Ver Detalle</Button>
                  {loan.status === 'pending' && (
                    <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteDialog({ open: true, item: loan })}>Eliminar</Button>
                  )}
                </Box>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell align="center"><strong>Moneda</strong></TableCell>
                <TableCell align="right"><strong>Monto</strong></TableCell>
                <TableCell align="right"><strong>Cotización</strong></TableCell>
                <TableCell align="right"><strong>Monto Pesos Orig.</strong></TableCell>
                <TableCell align="right"><strong>Saldo Pendiente</strong></TableCell>
                <TableCell align="center"><strong>Método</strong></TableCell>
                <TableCell align="center"><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No hay préstamos registrados</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((loan) => (
                  <TableRow key={loan.id} hover>
                    <TableCell>
                      {new Date(loan.start_date).toLocaleDateString('es-AR')}
                    </TableCell>
                    <TableCell>
                      {loan.employee && <Typography fontWeight={600}>{loan.employee.lastname}, {loan.employee.name}</Typography>}
                      {loan.notes && <Typography variant="caption" color="text.secondary" display="block">{loan.notes}</Typography>}
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={loan.currency} size="small" variant="outlined" color={loan.currency === 'USD' ? 'info' : 'default'} />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {formatLoanAmount(loan)}
                    </TableCell>
                    <TableCell align="right">
                      {loan.currency === 'USD' && loan.exchange_rate_at_origin
                        ? formatCurrency(loan.exchange_rate_at_origin)
                        : '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary' }}>
                      {loan.currency === 'USD' && loan.amount_ars_at_origin
                        ? formatCurrency(loan.amount_ars_at_origin)
                        : '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                      {formatLoanBalance(loan)}
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                        {renderPaymentMethodChip(loan.payment_method)}
                        {renderProofLink(loan)}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                        <Chip
                          label={LOAN_STATUS_LABEL[loan.status]?.label || loan.status}
                          color={LOAN_STATUS_LABEL[loan.status]?.color || 'default'}
                          size="small"
                        />
                        {loan.plan_type === 'discretionary' && (
                          <Chip label="A discreción" size="small" variant="outlined" />
                        )}
                        {loan.conflict_warning && (
                          <Tooltip title={loan.conflict_warning}>
                            <ConflictIcon color="warning" fontSize="small" />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {loan.status === 'pending' && (
                        <>
                          <Tooltip title="Aprobar">
                            <IconButton size="small" color="success" onClick={() => handleOpenApprove(loan)}>
                              <ApproveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Rechazar">
                            <IconButton size="small" color="error" onClick={() => setRejectTarget(loan)}>
                              <RejectIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {loan.status === 'approved' && (
                        <Tooltip title="Marcar como pagado / entregado">
                          <IconButton size="small" color="success" onClick={() => handleOpenMarkPaid(loan)} disabled={processing}>
                            <PaidIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {loan.status === 'active' && loan.plan_type === 'discretionary' && (
                        <Tooltip title="Aplicar interés del mes">
                          <IconButton size="small" color="secondary" onClick={() => handleOpenInterest(loan)}>
                            <InterestIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {loan.status === 'active' && loan.plan_type === 'fixed_installments' && (
                        <Tooltip title="Liquidar por baja (renuncia/despido)">
                          <IconButton size="small" color="warning" onClick={() => setSettleTarget(loan)}>
                            <SettleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Ver Detalle de Movimientos">
                        <IconButton size="small" color="primary" onClick={() => handleOpenDetail(loan)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {loan.status === 'pending' && (
                        <Tooltip title="Eliminar">
                          <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item: loan })}>
                            <DeleteIcon fontSize="small" />
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
      </Box>

      {/* Create / Approve Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{approvingLoan ? 'Aprobar Préstamo Solicitado' : 'Otorgar Préstamo a Empleado'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {approvingLoan && (
              <Typography variant="body2" color="text.secondary">
                Pidió {formatCurrency(Number(approvingLoan.requested_amount ?? approvingLoan.amount))}
                {approvingLoan.notes ? ` — "${approvingLoan.notes}"` : ''}
              </Typography>
            )}
            {approvingLoan?.conflict_warning && (
              <Alert severity="warning">{approvingLoan.conflict_warning}</Alert>
            )}

            <FormControl fullWidth size="small" disabled={!!approvingLoan}>
              <InputLabel>Empleado *</InputLabel>
              <Select
                value={form.employee_id || ''}
                label="Empleado *"
                onChange={(e) => setForm({ ...form, employee_id: Number(e.target.value) })}
              >
                {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.lastname}, {e.name}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField
              label="Fecha de Entrega *"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.start_date.slice(0, 10)}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />

            <CurrencyInput
              label="Monto del Préstamo ($) *"
              value={form.amount}
              onChange={(val) => setForm({ ...form, amount: val ?? 0 })}
              fullWidth
              size="small"
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            />

            <Box display="flex" gap={2}>
              <TextField
                label="Cantidad de Cuotas *"
                type="number"
                fullWidth
                size="small"
                value={form.num_installments || ''}
                onChange={(e) => setForm({ ...form, num_installments: Number(e.target.value) })}
                inputProps={{ min: 1, step: 1 }}
              />
              <CurrencyInput
                label="Interés Mensual (%)"
                value={form.monthly_interest_percent}
                onChange={(val) => setForm({ ...form, monthly_interest_percent: val ?? 0 })}
                fullWidth
                size="small"
                InputProps={{ startAdornment: <InputAdornment position="start">%</InputAdornment> }}
              />
            </Box>

            {(() => {
              const preview = form.amount > 0 && form.num_installments > 0
                ? computeFrenchSchedule(form.amount, form.monthly_interest_percent, form.num_installments)
                : null;
              if (!preview) return null;
              return (
                <Box p={1.5} sx={{ bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
                  <Typography variant="caption" color="text.secondary">Cuota mensual estimada (amortización francesa)</Typography>
                  <Typography variant="body2" fontWeight={700} color="primary.main">
                    {formatCurrency(preview.installmentAmount)} / mes × {form.num_installments} cuotas
                  </Typography>
                </Box>
              );
            })()}

            <TextField
              label="Método de Pago *"
              select
              fullWidth
              size="small"
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value as 'efectivo' | 'transferencia' })}
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
            >
              <option value="transferencia">Transferencia bancaria</option>
              <option value="efectivo">Efectivo</option>
            </TextField>

            <TextField
              label="Notas o Referencia"
              fullWidth
              multiline
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Ej: Para reparación de vehículo..."
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={form.mark_as_paid}
                  onChange={(e) => setForm({ ...form, mark_as_paid: e.target.checked })}
                />
              }
              label="Ya se le entregó el préstamo al empleado"
            />
            {!form.mark_as_paid && (
              <Alert severity="info">
                El préstamo quedará como &quot;Aprobado — pend. de pago&quot;. Cuando se le entregue el dinero, marcalo como pagado desde la tabla.
              </Alert>
            )}
            {isProofRequired && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>Comprobante de Pago *</Typography>
                <Button variant="outlined" component="label" fullWidth color={proofFile ? 'success' : 'primary'}>
                  {proofFile ? proofFile.name : 'Seleccionar Archivo (Requerido)'}
                  <input type="file" hidden accept="image/*,.pdf" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
                </Button>
              </Box>
            )}

          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color={approvingLoan ? 'success' : 'primary'}
            disabled={isProofRequired && !proofFile}
          >
            {approvingLoan ? 'Aprobar Préstamo' : 'Registrar Préstamo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Eliminar el préstamo de <strong>{deleteDialog.item?.employee ? `${deleteDialog.item.employee.lastname}, ${deleteDialog.item.employee.name}` : ""}</strong> por <strong>{deleteDialog.item ? (deleteDialog.item.currency === 'USD' ? `USD ${Number(deleteDialog.item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : formatCurrency(deleteDialog.item.amount)) : ''}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog: descuentos e intereses aplicados */}
      <Dialog open={!!detailLoan} onClose={() => setDetailLoan(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalle de Movimientos
          {detailLoan?.employee && (
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mt={0.5}>
              <Typography variant="body2" color="text.secondary">
                {detailLoan.employee.lastname}, {detailLoan.employee.name}
              </Typography>
              {detailLoan.paid_at && (
                <Typography variant="caption" color="text.secondary">
                  · Pagado el {new Date(detailLoan.paid_at).toLocaleDateString('es-AR')}
                </Typography>
              )}
              {detailLoan.paid_at && renderPaymentMethodChip(detailLoan.payment_method)}
              {detailLoan.paid_at && renderProofLink(detailLoan)}
              {detailLoan.employee.phone && detailLoan.plan_type === 'fixed_installments' && (
                <Tooltip title="Reenviar aviso por WhatsApp">
                  <IconButton size="small" color="success" onClick={() => notifyLoanApprovedByWhatsApp(detailLoan.employee, detailLoan)}>
                    <WhatsAppIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          {detailLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Stack spacing={3}>
              {detailLoan?.plan_type === 'fixed_installments' && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>Plan de Cuotas</Typography>
                  {!detailLoan.installments || detailLoan.installments.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      Todavía no se generó el plan de cuotas.
                    </Typography>
                  ) : (
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                            <TableCell><strong>Cuota</strong></TableCell>
                            <TableCell><strong>Vence</strong></TableCell>
                            <TableCell align="right"><strong>Capital</strong></TableCell>
                            <TableCell align="right"><strong>Interés</strong></TableCell>
                            <TableCell align="right"><strong>Total</strong></TableCell>
                            <TableCell align="center"><strong>Estado</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {detailLoan.installments.map((inst: LoanInstallment) => (
                            <TableRow key={inst.id} hover>
                              <TableCell>{inst.installment_number}/{detailLoan.num_installments}</TableCell>
                              <TableCell>
                                {(inst.due_period_type === 'first_half' ? '1ª Q. ' : '2ª Q. ')}
                                {MONTHS[inst.due_month - 1]} {inst.due_year}
                              </TableCell>
                              <TableCell align="right">{formatCurrency(inst.principal_amount)}</TableCell>
                              <TableCell align="right" sx={{ color: 'text.secondary' }}>{formatCurrency(inst.interest_amount)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(inst.total_amount)}</TableCell>
                              <TableCell align="center">
                                <Chip
                                  size="small"
                                  label={inst.status === 'scheduled' ? 'Pendiente' : inst.status === 'deducted' ? 'Descontada' : inst.status === 'prepaid' ? 'Liquidada' : 'Cancelada'}
                                  color={inst.status === 'scheduled' ? 'default' : inst.status === 'deducted' ? 'success' : inst.status === 'prepaid' ? 'info' : 'default'}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              <Box>
                <Typography variant="subtitle2" fontWeight={700} mb={1}>Cuotas Descontadas</Typography>
                {!detailLoan?.payments || detailLoan.payments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    Todavía no se registraron descuentos para este préstamo.
                  </Typography>
                ) : (
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                          <TableCell><strong>Fecha</strong></TableCell>
                          <TableCell><strong>Quincena</strong></TableCell>
                          {detailLoan.currency === 'USD' ? (
                            <>
                              <TableCell align="right"><strong>USD</strong></TableCell>
                              <TableCell align="right"><strong>Cotización</strong></TableCell>
                              <TableCell align="right"><strong>$ Descontados</strong></TableCell>
                            </>
                          ) : (
                            <TableCell align="right"><strong>Monto</strong></TableCell>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detailLoan.payments.map((payment: LoanPayment) => (
                          <TableRow key={payment.id} hover>
                            <TableCell>{new Date(payment.date).toLocaleDateString('es-AR')}</TableCell>
                            <TableCell>{formatPeriodLabel(payment.payrollEntry?.payPeriod)}</TableCell>
                            {detailLoan.currency === 'USD' ? (
                              <>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                  USD {Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell align="right" sx={{ color: 'text.secondary' }}>
                                  {payment.exchange_rate ? formatCurrency(payment.exchange_rate) : '—'}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                  {payment.amount_ars ? formatCurrency(payment.amount_ars) : '—'}
                                </TableCell>
                              </>
                            ) : (
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                {formatCurrency(payment.amount)}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>

              {detailLoan?.plan_type === 'discretionary' && (
              <Box>
                <Typography variant="subtitle2" fontWeight={700} mb={1}>Intereses Aplicados</Typography>
                {!detailLoan?.interestApplications || detailLoan.interestApplications.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    Todavía no se aplicó interés a este préstamo.
                  </Typography>
                ) : (
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                          <TableCell><strong>Fecha</strong></TableCell>
                          <TableCell align="right"><strong>Tasa</strong></TableCell>
                          <TableCell align="right"><strong>Capital Antes</strong></TableCell>
                          <TableCell align="right"><strong>Interés</strong></TableCell>
                          <TableCell align="right"><strong>Capital Después</strong></TableCell>
                          <TableCell><strong>Aplicado por</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detailLoan.interestApplications.map((app: LoanInterestApplication) => (
                          <TableRow key={app.id} hover>
                            <TableCell>{new Date(app.applied_at).toLocaleDateString('es-AR')}</TableCell>
                            <TableCell align="right">{Number(app.rate_percent_used).toLocaleString('es-AR')}%</TableCell>
                            <TableCell align="right" sx={{ color: 'text.secondary' }}>{formatCurrency(app.capital_before)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'warning.dark' }}>+{formatCurrency(app.interest_amount)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(app.capital_after)}</TableCell>
                            <TableCell>{app.appliedBy ? `${app.appliedBy.lastname}, ${app.appliedBy.name}` : '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailLoan(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Rechazar préstamo */}
      <Dialog open={!!rejectTarget} onClose={() => setRejectTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Rechazar Préstamo</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {rejectTarget?.employee?.lastname}, {rejectTarget?.employee?.name} — {rejectTarget ? formatCurrency(Number(rejectTarget.requested_amount ?? rejectTarget.amount)) : ''}
            </Typography>
            <TextField label="Motivo (opcional)" fullWidth multiline rows={2} value={rejectNotes} onChange={(e) => setRejectNotes(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectTarget(null)}>Cancelar</Button>
          <Button onClick={handleConfirmReject} variant="contained" color="error" disabled={processing}>
            {processing ? 'Rechazando...' : 'Rechazar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmar pago de préstamo */}
      <Dialog open={!!markPaidTarget} onClose={() => setMarkPaidTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmar Pago de Préstamo</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              Vas a marcar como pagado el préstamo de <strong>{markPaidTarget?.employee?.lastname}, {markPaidTarget?.employee?.name}</strong> por <strong>{markPaidTarget ? formatLoanAmount(markPaidTarget) : ''}</strong>.
            </Typography>
            <TextField
              label="Método de Pago *"
              select
              fullWidth
              value={markPaidMethod}
              onChange={(e) => setMarkPaidMethod(e.target.value as 'efectivo' | 'transferencia')}
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
            >
              <option value="transferencia">Transferencia bancaria</option>
              <option value="efectivo">Efectivo</option>
            </TextField>
            {isMarkPaidProofRequired && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>Comprobante de Pago *</Typography>
                <Button variant="outlined" component="label" fullWidth color={markPaidProofFile ? 'success' : 'primary'}>
                  {markPaidProofFile ? markPaidProofFile.name : 'Seleccionar Archivo (Requerido)'}
                  <input type="file" hidden accept="image/*,.pdf" onChange={(e) => setMarkPaidProofFile(e.target.files?.[0] || null)} />
                </Button>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMarkPaidTarget(null)}>Cancelar</Button>
          <Button
            onClick={handleConfirmMarkPaid}
            variant="contained"
            color="success"
            disabled={processing || (isMarkPaidProofRequired && !markPaidProofFile)}
          >
            {processing ? 'Confirmando...' : 'Confirmar Pago'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Aplicar interés mensual */}
      <Dialog open={!!interestTarget} onClose={() => setInterestTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Aplicar Interés Mensual</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {interestTarget?.employee?.lastname}, {interestTarget?.employee?.name} — saldo actual {interestTarget ? formatCurrency(Number(interestTarget.remaining_balance)) : ''}
            </Typography>
            <CurrencyInput
              label="Tasa a aplicar (%) *"
              fullWidth
              value={interestRate}
              onChange={setInterestRate}
              InputProps={{ startAdornment: <InputAdornment position="start">%</InputAdornment> }}
            />
            {interestTarget && interestRate ? (
              <Box p={1.5} sx={{ bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
                <Typography variant="caption" color="text.secondary">Nuevo saldo estimado</Typography>
                <Typography variant="body2" fontWeight={700} color="primary.main">
                  {formatCurrency(Number(interestTarget.remaining_balance) * (1 + interestRate / 100))}
                </Typography>
              </Box>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInterestTarget(null)}>Cancelar</Button>
          <Button onClick={handleConfirmInterest} variant="contained" disabled={!interestRate || processing}>
            {processing ? 'Aplicando...' : 'Aplicar Interés'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Liquidación por baja del empleado (renuncia/despido) */}
      <Dialog open={!!settleTarget} onClose={() => setSettleTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Liquidar Préstamo por Baja</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {settleTarget?.employee?.lastname}, {settleTarget?.employee?.name} — saldo actual {settleTarget ? formatCurrency(Number(settleTarget.remaining_balance)) : ''}
            </Typography>
            <Alert severity="info">
              La cuota de la quincena en curso se cobra completa. El resto de las cuotas pendientes
              se liquidan cobrando solo el capital adeudado — el interés se perdona.
            </Alert>
            <TextField
              label="Motivo"
              select
              fullWidth
              value={settleReason}
              onChange={(e) => setSettleReason(e.target.value as 'resignation' | 'dismissal' | 'other')}
              SelectProps={{ native: true }}
            >
              {Object.entries(SETTLE_REASON_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </TextField>
            <TextField
              label="Notas (opcional)"
              fullWidth
              multiline
              rows={2}
              value={settleNotes}
              onChange={(e) => setSettleNotes(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettleTarget(null)}>Cancelar</Button>
          <Button onClick={handleConfirmSettle} variant="contained" color="warning" disabled={processing}>
            {processing ? 'Liquidando...' : 'Liquidar Préstamo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
