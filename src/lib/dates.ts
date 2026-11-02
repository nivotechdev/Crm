const DIA_MS = 24 * 60 * 60 * 1000;

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Diferença em dias de CALENDÁRIO (ontem às 23h → hoje às 8h = 1 dia). */
export function diffDiasCalendario(from: Date | string, to: Date = new Date()): number {
  const a = startOfDay(new Date(from)).getTime();
  const b = startOfDay(to).getTime();
  return Math.round((b - a) / DIA_MS);
}

export function isSameDay(a: Date | string, b: Date | string = new Date()): boolean {
  return diffDiasCalendario(a, new Date(b)) === 0;
}

/** "Hoje", "Ontem", "Há 3 dias", "Há 2 semanas", "Há 3 meses"... */
export function tempoRelativoPassado(iso: string | undefined, now: Date = new Date()): string {
  if (!iso) return 'Nunca contatado';
  const dias = diffDiasCalendario(iso, now);
  if (dias <= 0) return 'Hoje';
  if (dias === 1) return 'Ontem';
  if (dias < 7) return `Há ${dias} dias`;
  if (dias < 30) {
    const s = Math.floor(dias / 7);
    return s === 1 ? 'Há 1 semana' : `Há ${s} semanas`;
  }
  if (dias < 365) {
    const m = Math.floor(dias / 30);
    return m === 1 ? 'Há 1 mês' : `Há ${m} meses`;
  }
  const a = Math.floor(dias / 365);
  return a === 1 ? 'Há 1 ano' : `Há ${a} anos`;
}

/** Para datas futuras/passadas de agenda: "Hoje", "Amanhã", "Em 3 dias", "Atrasado 2 dias". */
export function tempoRelativoAgenda(iso: string, now: Date = new Date()): string {
  const dias = -diffDiasCalendario(iso, now);
  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Amanhã';
  if (dias === -1) return 'Ontem';
  if (dias > 1) return dias < 7 ? `Em ${dias} dias` : `Em ${Math.round(dias / 7)} sem.`;
  return `Atrasado ${-dias} dias`;
}

export function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatData(iso: string, opts?: { ano?: boolean }): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    ...(opts?.ano === false ? {} : { year: 'numeric' }),
  });
}

export function formatDataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}

export function formatDataHora(iso: string): string {
  return `${formatData(iso)} ${formatHora(iso)}`;
}

export function formatDiaSemana(iso: string): string {
  const s = new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Converte ISO para valor de <input type="date"> (horário local). */
export function toInputDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function toInputDateTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${toInputDate(iso)}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** "2026-11-05" → ISO no meio-dia local (evita problemas de fuso). */
export function fromInputDate(v: string, hora = '09:00'): string | undefined {
  if (!v) return undefined;
  return new Date(`${v}T${hora}:00`).toISOString();
}

export function fromInputDateTime(v: string): string | undefined {
  if (!v) return undefined;
  return new Date(v).toISOString();
}

export function inicioDaSemana(d: Date): Date {
  const x = startOfDay(d);
  const dow = (x.getDay() + 6) % 7; // segunda = 0
  return addDays(x, -dow);
}

export function saudacao(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}
