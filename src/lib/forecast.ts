/** @format */

export function estimateGoalDate(params: {
  currentVault: number;
  target: number;
  monthlySave: number; // estimasi tabungan/bulan
  start?: Date;
}) {
  const start = params.start ?? new Date();
  const remaining = Math.max(0, params.target - params.currentVault);
  if (params.monthlySave <= 0)
    return { months: Infinity, date: null as Date | null };

  const months = Math.ceil(remaining / params.monthlySave);
  const date = new Date(start);
  date.setMonth(date.getMonth() + months);
  return { months, date };
}
