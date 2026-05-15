'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  useTheme,
  useMediaQuery,
  Stack,
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
} from '@mui/icons-material';
import {
  ExpenseSummaryService,
  ExpenseSummaryMonthly,
  ExpenseSummaryAnnual,
} from '../../../utils/api';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const monthsList = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

const getMonthLabel = (m: number) => monthsList.find((x) => x.value === m)?.label || String(m);

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

const formatNumber = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// ============== EXPORT HELPERS ==============

async function exportMonthlyExcel(data: ExpenseSummaryMonthly) {
  const XLSX = await import('xlsx');
  const monthLabel = getMonthLabel(data.month);
  const fileName = `Costos_Laborales_${monthLabel}_${data.year}.xlsx`;

  // Sheet 1: Resumen
  const summaryRows = [
    ['RESUMEN DE COSTOS LABORALES'],
    [`Período: ${monthLabel} ${data.year}`],
    [''],
    ['Concepto', 'Monto'],
    ['Sueldos Brutos', data.expenses.payroll_gross.total],
    ['  - 1ra Quincena', data.expenses.payroll_gross.detail.first_half],
    ['  - 2da Quincena', data.expenses.payroll_gross.detail.second_half],
    ['Cargas Patronales', data.expenses.employer_costs.total],
    ...data.expenses.employer_costs.breakdown.map((b) => [`  - ${b.category}`, b.amount]),
    [''],
    ['GASTO TOTAL', data.grand_total],
    [''],
    ['(Informativo) Adelantos', data.info.advances.total],
    [`  Registros: ${data.info.advances.count}`, ''],
    [`  ${data.info.advances.note}`, ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(summaryRows);

  // Ancho de columnas
  ws['!cols'] = [{ wch: 35 }, { wch: 20 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Resumen');
  XLSX.writeFile(wb, fileName);
}

async function exportAnnualExcel(data: ExpenseSummaryAnnual) {
  const XLSX = await import('xlsx');
  const fileName = `Costos_Laborales_Anual_${data.year}.xlsx`;

  const rows = [
    ['RESUMEN ANUAL DE COSTOS LABORALES'],
    [`Año: ${data.year}`],
    [''],
    ['Mes', 'Sueldos Brutos', 'Cargas Patronales', 'Gasto Total'],
    ...data.months.map((m) => [getMonthLabel(m.month), m.payroll_gross, m.employer_costs, m.total]),
    [''],
    ['TOTALES', data.annual_totals.payroll_gross, data.annual_totals.employer_costs, data.annual_totals.total],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Resumen Anual');
  XLSX.writeFile(wb, fileName);
}

async function exportMonthlyPdf(data: ExpenseSummaryMonthly) {
  const { default: jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const monthLabel = getMonthLabel(data.month);
  const doc = new jsPDF();

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen de Costos Laborales', 14, 20);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Período: ${monthLabel} ${data.year}`, 14, 28);

  // Separator
  doc.setDrawColor(200);
  doc.line(14, 32, 196, 32);

  // Main table
  const body: (string | number)[][] = [
    ['Sueldos Brutos', formatNumber(data.expenses.payroll_gross.total)],
    ['  1ra Quincena', formatNumber(data.expenses.payroll_gross.detail.first_half)],
    ['  2da Quincena', formatNumber(data.expenses.payroll_gross.detail.second_half)],
    ['Cargas Patronales', formatNumber(data.expenses.employer_costs.total)],
    ...data.expenses.employer_costs.breakdown.map((b) => [`  ${b.category}`, formatNumber(b.amount)]),
  ];

  autoTable(doc, {
    startY: 36,
    head: [['Concepto', 'Monto ($)']],
    body,
    theme: 'striped',
    headStyles: { fillColor: [33, 33, 33], fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: { 1: { halign: 'right' } },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || 100;

  // Grand total box
  doc.setFillColor(25, 118, 210);
  doc.roundedRect(14, finalY + 6, 182, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('GASTO TOTAL', 20, finalY + 15);
  doc.text(formatNumber(data.grand_total), 190, finalY + 15, { align: 'right' });

  // Advances info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text(
    `Adelantos (informativo, no suma al total): ${formatNumber(data.info.advances.total)} — ${data.info.advances.count} registros`,
    14,
    finalY + 28
  );

  // Footer
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150);
  doc.text(`Generado el ${new Date().toLocaleDateString('es-AR')} — CONMOMET S.A.`, 14, 285);

  doc.save(`Costos_Laborales_${monthLabel}_${data.year}.pdf`);
}

async function exportAnnualPdf(data: ExpenseSummaryAnnual) {
  const { default: jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen Anual de Costos Laborales', 14, 20);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Año: ${data.year}`, 14, 28);

  doc.setDrawColor(200);
  doc.line(14, 32, 196, 32);

  // Table
  const body = data.months.map((m) => [
    getMonthLabel(m.month),
    formatNumber(m.payroll_gross),
    formatNumber(m.employer_costs),
    formatNumber(m.total),
  ]);

  autoTable(doc, {
    startY: 36,
    head: [['Mes', 'Sueldos Brutos ($)', 'Cargas Patronales ($)', 'Gasto Total ($)']],
    body,
    foot: [[
      'TOTALES',
      formatNumber(data.annual_totals.payroll_gross),
      formatNumber(data.annual_totals.employer_costs),
      formatNumber(data.annual_totals.total),
    ]],
    theme: 'striped',
    headStyles: { fillColor: [33, 33, 33], fontSize: 9 },
    footStyles: { fillColor: [25, 118, 210], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
  });

  // Footer
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150);
  doc.text(`Generado el ${new Date().toLocaleDateString('es-AR')} — CONMOMET S.A.`, 14, 285);

  doc.save(`Costos_Laborales_Anual_${data.year}.pdf`);
}

// ============== COMPONENT ==============

export default function ExpenseSummaryPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [tabValue, setTabValue] = useState(0);
  const [year, setYear] = useState<number>(currentYear);
  const [month, setMonth] = useState<number>(currentMonth);

  const [monthlyData, setMonthlyData] = useState<ExpenseSummaryMonthly | null>(null);
  const [annualData, setAnnualData] = useState<ExpenseSummaryAnnual | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Export menu
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);
  const exportMenuOpen = Boolean(exportAnchor);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tabValue === 0) {
        const data = await ExpenseSummaryService.getMonthly(year, month);
        setMonthlyData(data);
      } else {
        const data = await ExpenseSummaryService.getAnnual(year);
        setAnnualData(data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al obtener datos');
    } finally {
      setLoading(false);
    }
  }, [tabValue, year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    setExportAnchor(null);
    try {
      if (tabValue === 0 && monthlyData) {
        if (format === 'excel') await exportMonthlyExcel(monthlyData);
        else await exportMonthlyPdf(monthlyData);
      } else if (tabValue === 1 && annualData) {
        if (format === 'excel') await exportAnnualExcel(annualData);
        else await exportAnnualPdf(annualData);
      }
    } catch (err) {
      console.error('Error al exportar:', err);
    }
  };

  const hasData = (tabValue === 0 && monthlyData) || (tabValue === 1 && annualData);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Resumen de Costos Laborales
        </Typography>

        {/* EXPORT BUTTON */}
        {hasData && !loading && (
          <>
            {isMobile ? (
              <IconButton 
                color="primary" 
                onClick={(e) => setExportAnchor(e.currentTarget)}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
              >
                <FileDownloadIcon />
              </IconButton>
            ) : (
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={(e) => setExportAnchor(e.currentTarget)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2.5,
                }}
              >
                Exportar
              </Button>
            )}
            <Menu
              anchorEl={exportAnchor}
              open={exportMenuOpen}
              onClose={() => setExportAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{
                paper: {
                  sx: {
                    borderRadius: 2,
                    mt: 0.5,
                    minWidth: 180,
                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)',
                  },
                },
              }}
            >
              <MenuItem onClick={() => handleExport('excel')} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <ExcelIcon sx={{ color: '#217346' }} />
                </ListItemIcon>
                <ListItemText primary="Excel (.xlsx)" />
              </MenuItem>
              <MenuItem onClick={() => handleExport('pdf')} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <PdfIcon sx={{ color: '#d32f2f' }} />
                </ListItemIcon>
                <ListItemText primary="PDF (.pdf)" />
              </MenuItem>
            </Menu>
          </>
        )}
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Resumen Mensual" />
          <Tab label="Resumen Anual" />
        </Tabs>
      </Box>

      {/* FILTROS */}
      <Card sx={{ mb: 4, borderRadius: 2, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Año</InputLabel>
            <Select
              value={year}
              label="Año"
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {tabValue === 0 && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Mes</InputLabel>
              <Select
                value={month}
                label="Mes"
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {monthsList.map((m) => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" p={5}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          {/* VISTA MENSUAL */}
          {tabValue === 0 && monthlyData && (
            <Grid container spacing={3}>
              {/* TOTALES PRINCIPALES */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ height: '100%', borderRadius: 2, bgcolor: 'primary.main', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ opacity: 0.9 }}>
                      Gasto Total (Mes)
                    </Typography>
                    <Typography variant="h3" fontWeight="bold">
                      {formatCurrency(monthlyData.grand_total)}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 2, opacity: 0.8 }}>
                      Sueldos brutos + Cargas patronales
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* SUELDOS BRUTOS */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ height: '100%', borderRadius: 2, borderLeft: '6px solid #2e7d32' }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      {monthlyData.expenses.payroll_gross.label}
                    </Typography>
                    <Typography variant="h4">
                      {formatCurrency(monthlyData.expenses.payroll_gross.total)}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="textSecondary">1ra Quincena:</Typography>
                      <Typography variant="body2">{formatCurrency(monthlyData.expenses.payroll_gross.detail.first_half)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="textSecondary">2da Quincena:</Typography>
                      <Typography variant="body2">{formatCurrency(monthlyData.expenses.payroll_gross.detail.second_half)}</Typography>
                    </Box>
                    <Typography variant="caption" color="textSecondary" display="block" textAlign="right">
                      {monthlyData.expenses.payroll_gross.detail.entry_count} recibos procesados
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* CARGAS PATRONALES */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ height: '100%', borderRadius: 2, borderLeft: '6px solid #ed6c02' }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      {monthlyData.expenses.employer_costs.label}
                    </Typography>
                    <Typography variant="h4">
                      {formatCurrency(monthlyData.expenses.employer_costs.total)}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />
                    {monthlyData.expenses.employer_costs.breakdown.length === 0 ? (
                      <Typography variant="body2" color="textSecondary" fontStyle="italic">
                        No hay cargas patronales cargadas
                      </Typography>
                    ) : (
                      monthlyData.expenses.employer_costs.breakdown.map((item, index) => (
                        <Box key={index} display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2" color="textSecondary">{item.category}:</Typography>
                          <Typography variant="body2">{formatCurrency(item.amount)}</Typography>
                        </Box>
                      ))
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* INFORMATIVO: ADELANTOS */}
              <Grid size={{ xs: 12 }}>
                <Alert severity="info" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {monthlyData.info.advances.label}
                      </Typography>
                      <Typography variant="body2">
                        {monthlyData.info.advances.note} ({monthlyData.info.advances.count} registros)
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(monthlyData.info.advances.total)}
                    </Typography>
                  </Box>
                </Alert>
              </Grid>
            </Grid>
          )}

          {/* VISTA ANUAL */}
          {tabValue === 1 && annualData && (
            <Box>
              <Grid container spacing={3} mb={4}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>Gasto Total Anual</Typography>
                      <Typography variant="h4" fontWeight="bold">{formatCurrency(annualData.annual_totals.total)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{ borderRadius: 2, borderLeft: '6px solid #2e7d32' }}>
                    <CardContent>
                      <Typography color="textSecondary" variant="subtitle2">Total Sueldos Brutos</Typography>
                      <Typography variant="h5" fontWeight="bold">{formatCurrency(annualData.annual_totals.payroll_gross)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{ borderRadius: 2, borderLeft: '6px solid #ed6c02' }}>
                    <CardContent>
                      <Typography color="textSecondary" variant="subtitle2">Total Cargas Patronales</Typography>
                      <Typography variant="h5" fontWeight="bold">{formatCurrency(annualData.annual_totals.employer_costs)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {isMobile ? (
                <Stack spacing={2}>
                  {annualData.months.map((row) => (
                    <Card key={row.month} sx={{ borderRadius: 2, boxShadow: '0 2px 4px rgb(0 0 0 / 0.05)' }}>
                      <CardContent>
                        <Typography variant="h6" color="primary.main" gutterBottom fontWeight="bold">
                          {getMonthLabel(row.month)}
                        </Typography>
                        <Divider sx={{ mb: 1.5 }} />
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2" color="textSecondary">Sueldos Brutos:</Typography>
                          <Typography variant="body2" fontWeight="medium">{formatCurrency(row.payroll_gross)}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={1.5}>
                          <Typography variant="body2" color="textSecondary">Cargas Patronales:</Typography>
                          <Typography variant="body2" fontWeight="medium">{formatCurrency(row.employer_costs)}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" bgcolor="grey.50" p={1} borderRadius={1}>
                          <Typography variant="subtitle2">Gasto Total:</Typography>
                          <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                            {formatCurrency(row.total)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                  <Table>
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Mes</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Sueldos Brutos</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Cargas Patronales</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Gasto Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {annualData.months.map((row) => (
                        <TableRow key={row.month} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell component="th" scope="row">
                            {getMonthLabel(row.month)}
                          </TableCell>
                          <TableCell align="right">{formatCurrency(row.payroll_gross)}</TableCell>
                          <TableCell align="right">{formatCurrency(row.employer_costs)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {formatCurrency(row.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </>
      )}
    </Container>
  );
}
