import type { Configuracoes, Lead } from '../types';
import { formatBRL, primeiroNome, somenteDigitos } from './format';
import { OBJETIVOS } from './labels';

/**
 * Número no formato internacional (55 + DDD + número), só dígitos.
 * Aceita "(62) 99999-8888", "062 99999-8888", "+55 62 99999-8888" e "5562999998888".
 */
export function numeroInternacional(telefone: string): string {
  const d = somenteDigitos(telefone).replace(/^0+/, '');
  if (d.startsWith('55') && d.length >= 12) return d;
  return `55${d}`;
}

/** Link oficial do WhatsApp: abre o app no celular e o WhatsApp Web/desktop no computador. */
export function linkWhatsApp(telefone: string, texto?: string): string {
  const base = `https://wa.me/${numeroInternacional(telefone)}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}

/** Link de ligação: abre o aplicativo de telefone já com o número. */
export function linkTelefone(telefone: string): string {
  return `tel:+${numeroInternacional(telefone)}`;
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

/**
 * Abre o WhatsApp a partir de código (atalho de teclado, por exemplo).
 * Nos botões, prefira um <a href={linkWhatsApp(...)}>: é o caminho mais confiável.
 */
export function abrirWhatsApp(telefone: string, texto?: string) {
  const a = document.createElement('a');
  a.href = linkWhatsApp(telefone, texto);
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
