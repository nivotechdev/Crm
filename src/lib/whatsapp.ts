import type { Configuracoes, Lead } from '../types';
import { formatBRL, primeiroNome, somenteDigitos } from './format';
import { OBJETIVOS } from './labels';

/** Número no formato internacional exigido pelo wa.me (55 + DDD + número). */
export function numeroWhatsApp(telefone: string): string {
  const d = somenteDigitos(telefone);
  if (d.startsWith('55') && d.length >= 12) return d;
  return `55${d}`;
}

export function linkWhatsApp(telefone: string, texto?: string): string {
  const base = `https://wa.me/${numeroWhatsApp(telefone)}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}

export function linkTelefone(telefone: string): string {
  return `tel:+${numeroWhatsApp(telefone)}`;
}

export const VARIAVEIS_MODELO = ['{nome}', '{primeiroNome}', '{valor}', '{objetivo}', '{cidade}', '{vendedor}'] as const;

type DadosModelo = Partial<Pick<Lead, 'nome' | 'valorCarta' | 'objetivo' | 'cidade'>>;

export function preencherModelo(texto: string, dados: DadosModelo, cfg: Pick<Configuracoes, 'nomeVendedor'>): string {
  return texto
    .replace(/\{nome\}/g, dados.nome ?? '')
    .replace(/\{primeiroNome\}/g, primeiroNome(dados.nome ?? ''))
    .replace(/\{valor\}/g, dados.valorCarta ? formatBRL(dados.valorCarta) : '')
    .replace(/\{objetivo\}/g, dados.objetivo ? OBJETIVOS[dados.objetivo].toLowerCase() : '')
    .replace(/\{cidade\}/g, dados.cidade ?? '')
    .replace(/\{vendedor\}/g, cfg.nomeVendedor ?? '');
}

/** Abre o WhatsApp numa nova aba. Deve ser chamado direto no handler do clique. */
export function abrirWhatsApp(telefone: string, texto?: string) {
  const a = document.createElement('a');
  a.href = linkWhatsApp(telefone, texto);
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
