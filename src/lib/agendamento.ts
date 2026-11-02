import { addDays } from './dates';

export const ATALHOS_AGENDA = [
  { label: 'Amanhã', dias: 1 },
  { label: 'Em 2 dias', dias: 2 },
  { label: 'Em 1 semana', dias: 7 },
] as const;

/** Data N dias à frente às 09:00 (retornos são "dia inteiro"). Pula domingo. */
export function dataDaquiA(dias: number, base = new Date()): string {
  let d = addDays(base, dias);
  if (d.getDay() === 0) d = addDays(d, 1);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}
