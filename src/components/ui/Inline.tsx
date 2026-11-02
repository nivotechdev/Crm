import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, Pencil, Plus, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { formatBRL, parseValor } from '../../lib/format';

/**
 * Campos com edição inline: clicar → editar → Enter/sair do campo salva, Esc cancela.
 * Não existe "modo edição" separado.
 */

const display =
  'group -mx-2 flex min-h-[36px] w-[calc(100%+1rem)] items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 dark:text-slate-100 dark:hover:bg-slate-800';
const editor =
  'block w-full rounded-lg border-0 bg-white px-2 py-1.5 text-sm text-slate-900 ring-2 ring-inset ring-brand-500 dark:bg-slate-800 dark:text-slate-100';

function Vazio({ texto = 'Adicionar' }: { texto?: string }) {
  return <span className="text-slate-400 dark:text-slate-500">{texto}</span>;
}

export function InlineText({
  valor,
  onSalvar,
  placeholder,
  tipo = 'text',
  formatar,
  className,
  inputMode,
}: {
  valor?: string;
  onSalvar: (v: string) => void;
  placeholder?: string;
  tipo?: string;
  formatar?: (v: string) => ReactNode;
  className?: string;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric' | 'decimal';
}) {
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(valor ?? '');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editando) {
      setRascunho(valor ?? '');
      requestAnimationFrame(() => ref.current?.select());
    }
  }, [editando, valor]);

  const salvar = () => {
    setEditando(false);
    if ((rascunho ?? '').trim() !== (valor ?? '')) onSalvar(rascunho.trim());
  };

  if (editando)
    return (
      <input
        ref={ref}
        type={tipo}
        inputMode={inputMode}
        className={cn(editor, className)}
        value={rascunho}
        placeholder={placeholder}
        onChange={(e) => setRascunho(e.target.value)}
        onBlur={salvar}
        onKeyDown={(e) => {
          if (e.key === 'Enter') salvar();
          if (e.key === 'Escape') {
            e.stopPropagation();
            setEditando(false);
          }
        }}
      />
    );

  return (
    <button type="button" className={cn(display, className)} onClick={() => setEditando(true)}>
      <span className="min-w-0 flex-1 truncate">{valor ? (formatar ? formatar(valor) : valor) : <Vazio texto={placeholder} />}</span>
      <Pencil className="h-3.5 w-3.5 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-600" />
    </button>
  );
}

export function InlineMoney({ valor, onSalvar, placeholder = 'R$ 0' }: { valor?: number; onSalvar: (v: number | undefined) => void; placeholder?: string }) {
  return (
    <InlineText
      valor={valor !== undefined ? String(valor) : ''}
      placeholder={placeholder}
      inputMode="decimal"
      formatar={(v) => formatBRL(Number(v))}
      onSalvar={(v) => onSalvar(parseValor(v))}
    />
  );
}

export function InlineSelect<T extends string>({
  valor,
  opcoes,
  onSalvar,
  vazio = 'Selecionar',
  className,
}: {
  valor?: T;
  opcoes: Array<{ value: T; label: string }>;
  onSalvar: (v: T | undefined) => void;
  vazio?: string;
  className?: string;
}) {
  return (
    <select
      value={valor ?? ''}
      onChange={(e) => onSalvar((e.target.value || undefined) as T | undefined)}
      className={cn(
        '-mx-2 block min-h-[36px] w-[calc(100%+1rem)] cursor-pointer appearance-none rounded-lg border-0 bg-transparent px-2 py-1.5 text-sm text-slate-900 hover:bg-slate-100 focus:ring-2 focus:ring-brand-500 dark:text-slate-100 dark:hover:bg-slate-800',
        !valor && 'text-slate-400 dark:text-slate-500',
        className,
      )}
    >
      <option value="">{vazio}</option>
      {opcoes.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function InlineTextarea({ valor, onSalvar, placeholder = 'Adicionar observações' }: { valor?: string; onSalvar: (v: string) => void; placeholder?: string }) {
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(valor ?? '');
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (editando) {
      setRascunho(valor ?? '');
      requestAnimationFrame(() => ref.current?.focus());
    }
  }, [editando, valor]);
  const salvar = () => {
    setEditando(false);
    if (rascunho.trim() !== (valor ?? '')) onSalvar(rascunho.trim());
  };
  if (editando)
    return (
      <textarea
        ref={ref}
        rows={3}
        className={cn(editor, 'resize-y')}
        value={rascunho}
        onChange={(e) => setRascunho(e.target.value)}
        onBlur={salvar}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) salvar();
          if (e.key === 'Escape') {
            e.stopPropagation();
            setEditando(false);
          }
        }}
      />
    );
  return (
    <button type="button" className={cn(display, 'items-start whitespace-pre-wrap')} onClick={() => setEditando(true)}>
      <span className="flex-1">{valor || <Vazio texto={placeholder} />}</span>
    </button>
  );
}

export function InlineTags({ valor, onSalvar, sugestoes = [] }: { valor: string[]; onSalvar: (v: string[]) => void; sugestoes?: string[] }) {
  const [adicionando, setAdicionando] = useState(false);
  const [texto, setTexto] = useState('');
  const listId = useRef('tags-' + Math.random().toString(36).slice(2)).current;
  const add = () => {
    const t = texto.trim();
    if (t && !valor.includes(t)) onSalvar([...valor, t]);
    setTexto('');
    setAdicionando(false);
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1">
      {valor.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 rounded-md bg-brand-50 py-0.5 pl-2 pr-1 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
        >
          {t}
          <button aria-label={`Remover etiqueta ${t}`} className="rounded p-0.5 hover:bg-brand-100 dark:hover:bg-brand-500/20" onClick={() => onSalvar(valor.filter((x) => x !== t))}>
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {adicionando ? (
        <span className="inline-flex items-center gap-1">
          <input
            autoFocus
            list={listId}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={add}
            onKeyDown={(e) => {
              if (e.key === 'Enter') add();
              if (e.key === 'Escape') {
                e.stopPropagation();
                setAdicionando(false);
              }
            }}
            className="h-7 w-32 rounded-md border-0 bg-white px-2 text-xs ring-2 ring-brand-500 dark:bg-slate-800 dark:text-slate-100"
            placeholder="Nova etiqueta"
          />
          <datalist id={listId}>
            {sugestoes.filter((s) => !valor.includes(s)).map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <Check className="h-4 w-4 text-slate-400" />
        </span>
      ) : (
        <button
          onClick={() => setAdicionando(true)}
          className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-xs font-medium text-slate-500 border border-dashed border-slate-300 hover:bg-slate-100 dark:text-slate-400 dark:border-slate-600 dark:hover:bg-slate-800"
        >
          <Plus className="h-3 w-3" /> Etiqueta
        </button>
      )}
    </div>
  );
}

/** Linha "rótulo: campo" usada nas fichas. */
export function CampoLinha({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,40%)_minmax(0,1fr)] items-center gap-2 border-b border-slate-100 py-0.5 last:border-0 dark:border-slate-800 sm:grid-cols-[150px_minmax(0,1fr)]">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <div className="min-w-0 pr-2">{children}</div>
    </div>
  );
}
