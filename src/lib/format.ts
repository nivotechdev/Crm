const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const brl2 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatBRL(v?: number, centavos = false): string {
  if (v === undefined || v === null || Number.isNaN(v)) return '—';
  return centavos ? brl2.format(v) : brl.format(v);
}

/** R$ 250 mil, R$ 1,2 mi */
export function formatBRLCompacto(v?: number): string {
  if (v === undefined || v === null) return '—';
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`;
  return brl.format(v);
}

export function somenteDigitos(s: string): string {
  return (s || '').replace(/\D/g, '');
}

/** 62999998888 → (62) 99999-8888 */
export function formatTelefone(t: string): string {
  const d = somenteDigitos(t).replace(/^55(?=\d{10,11}$)/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return t;
}

/** Máscara progressiva enquanto digita. */
export function mascaraTelefone(v: string): string {
  const d = somenteDigitos(v).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** "250.000" / "250000,50" / "250 mil" / "1,2 mi" → número */
export function parseValor(v: string): number | undefined {
  if (!v) return undefined;
  const s = normalizarBusca(v).trim();
  let mult = 1;
  if (/(milhao|milhoes|\bmi\b|\bmm\b)/.test(s)) mult = 1_000_000;
  else if (/(\bmil\b|\dk\b)/.test(s)) mult = 1_000;
  let num = s.replace(/[^\d,.]/g, '');
  if (num.includes(',')) num = num.replace(/\./g, '').replace(',', '.');
  else if (/\.\d{3}(\.|$)/.test(num)) num = num.replace(/\./g, '');
  const n = parseFloat(num);
  return Number.isNaN(n) ? undefined : n * mult;
}

export function primeiroNome(nome: string): string {
  return (nome || '').trim().split(/\s+/)[0] ?? '';
}

export function iniciais(nome: string): string {
  const p = (nome || '').trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

export function normalizarBusca(s: string): string {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function pct(n: number, d: number): string {
  if (!d) return '—';
  return `${Math.round((n / d) * 100)}%`;
}
