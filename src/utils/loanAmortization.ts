// Espejo de api_conmomet/services/loanAmortizationService.js — SOLO para mostrar la cuota
// calculada en vivo en el formulario de alta/aprobación de un préstamo, antes de confirmar. El
// backend es la única fuente de verdad real (genera y persiste el plan de cuotas); si se cambia
// la fórmula ahí, hay que cambiarla acá también.

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export interface InstallmentPreviewRow {
  installment_number: number;
  principal_amount: number;
  interest_amount: number;
  total_amount: number;
  remaining_principal_after: number;
}

export interface FrenchSchedulePreview {
  installmentAmount: number;
  rows: InstallmentPreviewRow[];
}

export function computeFrenchSchedule(amount: number, monthlyInterestPercent: number, numInstallments: number): FrenchSchedulePreview | null {
  const P = Number(amount);
  const n = Number(numInstallments);
  const i = Number(monthlyInterestPercent || 0) / 100;

  if (!(P > 0) || !Number.isInteger(n) || n <= 0) return null;

  const installmentAmount = i > 0
    ? round2((P * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1))
    : round2(P / n);

  const rows: InstallmentPreviewRow[] = [];
  let balance = P;

  for (let k = 1; k <= n; k++) {
    const interestAmount = round2(balance * i);
    const principalAmount = k < n ? round2(installmentAmount - interestAmount) : balance;
    const totalAmount = round2(principalAmount + interestAmount);
    balance = round2(balance - principalAmount);

    rows.push({
      installment_number: k,
      principal_amount: principalAmount,
      interest_amount: interestAmount,
      total_amount: totalAmount,
      remaining_principal_after: balance,
    });
  }

  return { installmentAmount, rows };
}
