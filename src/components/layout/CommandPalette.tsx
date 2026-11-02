import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, Plus, Search, UserCheck } from 'lucide-react';
import { useData } from '../../store/DataContext';
import { useAcoes } from '../../store/AcoesContext';
import { formatTelefone, normalizarBusca, somenteDigitos } from '../../lib/format';
import { cn } from '../../lib/cn';
import { NAV } from './nav';
import { Avatar } from '../ui/Avatar';
import { LastContactBadge } from '../leads/LastContactBadge';
import { EtapaBadge } from '../leads/Badges';
import { QuickContactButtons } from '../leads/QuickContactButtons';
import type { Cliente, Lead } from '../../types';

type Item =
  | { tipo: 'lead'; lead: Lead }
  | { tipo: 'cliente'; cliente: Cliente }
  | { tipo: 'cmd'; label: string; icone: typeof Plus; run: () => void };

/** Busca global instantânea (Ctrl+K ou "/"). */
export function CommandPalette() {
  const { buscaAberta, setBuscaAberta, abrirNovoLead } = useAcoes();
  const { leads, clientes } = useData();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (buscaAberta) {
      setQ('');
      setSel(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [buscaAberta]);

  const fechar = () => setBuscaAberta(false);

  const itens = useMemo<Item[]>(() => {
    const termo = normalizarBusca(q.trim());
    const dig = somenteDigitos(q);
    const casa = (nome: string, tel: string, extra: string) =>
      !termo ||
      normalizarBusca(nome).includes(termo) ||
      normalizarBusca(extra).includes(termo) ||
      (dig.length >= 3 && tel.includes(dig));
    const ls: Item[] = leads
      .filter((l) => casa(l.nome, l.telefone, `${l.cidade ?? ''} ${l.etiquetas.join(' ')} ${l.email ?? ''}`))
      .slice(0, termo ? 12 : 6)
      .map((lead) => ({ tipo: 'lead', lead }));
    const cs: Item[] = termo
      ? clientes
          .filter((c) => casa(c.nome, c.telefone, `${c.administradora ?? ''} ${c.grupo ?? ''}`))
          .slice(0, 5)
          .map((cliente) => ({ tipo: 'cliente', cliente }))
      : [];
    const cmds: Item[] = [
      {
        tipo: 'cmd',
        label: dig.length >= 10 && ls.length === 0 ? `Criar lead com ${formatTelefone(dig)}` : 'Novo lead',
        icone: Plus,
        run: () => abrirNovoLead(dig.length >= 10 ? { telefone: dig } : !dig && termo ? { nome: q.trim() } : undefined),
      },
      ...NAV.filter((n) => !termo || normalizarBusca(n.label).includes(termo)).map((n) => ({
        tipo: 'cmd' as const,
        label: `Ir para ${n.label}`,
        icone: n.icone,
        run: () => navigate(n.to),
      })),
    ];
    return [...ls, ...cs, ...cmds];
  }, [q, leads, clientes, navigate, abrirNovoLead]);

  useEffect(() => setSel(0), [q]);
  useEffect(() => {
    listaRef.current?.querySelector(`[data-idx="${sel}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  const executar = (it: Item) => {
    fechar();
    if (it.tipo === 'lead') navigate(`/leads/${it.lead.id}`);
    else if (it.tipo === 'cliente') navigate(`/clientes?id=${it.cliente.id}`);
    else it.run();
  };

  if (!buscaAberta) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center sm:p-4 sm:pt-[10vh]" role="dialog" aria-modal="true" aria-label="Busca global">
      <div className="absolute inset-0 animate-fade-in bg-slate-900/50 backdrop-blur-[2px]" onClick={fechar} />
      <div className="relative flex h-dvh w-full animate-slide-up flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[70vh] sm:max-w-2xl sm:rounded-2xl">
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 pt-[env(safe-area-inset-top)] dark:border-slate-800">
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') (e.preventDefault(), setSel((s) => Math.min(itens.length - 1, s + 1)));
              if (e.key === 'ArrowUp') (e.preventDefault(), setSel((s) => Math.max(0, s - 1)));
              if (e.key === 'Enter' && itens[sel]) executar(itens[sel]);
              if (e.key === 'Escape') fechar();
            }}
            placeholder="Buscar por nome, telefone ou cidade…"
            className="h-14 flex-1 border-0 bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:ring-0 dark:text-white"
            aria-label="Buscar"
          />
          <button onClick={fechar} className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            Esc
          </button>
        </div>
        <div ref={listaRef} className="flex-1 overflow-y-auto p-2" role="listbox">
          {itens.map((it, i) => {
            const ativo = i === sel;
            const base = cn('flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left', ativo ? 'bg-brand-50 dark:bg-brand-500/15' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60');
            if (it.tipo === 'lead')
              return (
                <div key={it.lead.id} data-idx={i} role="option" aria-selected={ativo} className={base} onMouseMove={() => setSel(i)} onClick={() => executar(it)}>
                  <Avatar nome={it.lead.nome} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{it.lead.nome}</p>
                    <p className="truncate text-xs text-slate-500">
                      {formatTelefone(it.lead.telefone)}
                      {it.lead.cidade && ` · ${it.lead.cidade}`}
                    </p>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    <EtapaBadge etapaId={it.lead.etapaId} />
                  </div>
                  <LastContactBadge ultimoContatoEm={it.lead.ultimoContatoEm} canal={it.lead.ultimoContatoCanal} compacto />
                  <QuickContactButtons lead={it.lead} tamanho="sm" soIcone />
                </div>
              );
            if (it.tipo === 'cliente')
              return (
                <div key={it.cliente.id} data-idx={i} role="option" aria-selected={ativo} className={base} onMouseMove={() => setSel(i)} onClick={() => executar(it)}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <UserCheck className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{it.cliente.nome}</p>
                    <p className="truncate text-xs text-slate-500">
                      Cliente · {it.cliente.administradora ?? '—'} · grupo {it.cliente.grupo ?? '—'}
                    </p>
                  </div>
                </div>
              );
            return (
              <div key={it.label} data-idx={i} role="option" aria-selected={ativo} className={base} onMouseMove={() => setSel(i)} onClick={() => executar(it)}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800">
                  <it.icone className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{it.label}</span>
                {ativo && <CornerDownLeft className="h-4 w-4 text-slate-400" />}
              </div>
            );
          })}
          {q && itens.every((i) => i.tipo === 'cmd') && (
            <p className="px-3 py-4 text-center text-sm text-slate-500">Nenhum lead encontrado para “{q}”.</p>
          )}
        </div>
      </div>
    </div>
  );
}
