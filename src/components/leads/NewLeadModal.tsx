import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronDown } from 'lucide-react';
import type { NovoLeadInput, Objetivo, Temperatura } from '../../types';
import { useData } from '../../store/DataContext';
import { useToast } from '../../store/ToastContext';
import { mascaraTelefone, parseValor, somenteDigitos } from '../../lib/format';
import { OBJETIVOS, TEMPERATURAS, opcoes } from '../../lib/labels';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/Field';
import { Modal } from '../ui/Modal';

const vazio = {
  nome: '',
  telefone: '',
  objetivo: '' as Objetivo | '',
  valor: '',
  origem: '',
  indicadoPor: '',
  cidade: '',
  temperatura: 'morno' as Temperatura,
  observacoes: '',
};

/** Criação de lead: só nome + telefone obrigatórios. Enter salva. */
export function NewLeadModal({ aberto, onFechar, prefill }: { aberto: boolean; onFechar: () => void; prefill?: Partial<NovoLeadInput> }) {
  const { criarLead, leads, config } = useData();
  const toast = useToast();
  const navigate = useNavigate();
  const [f, setF] = useState(vazio);
  const [mais, setMais] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const nomeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aberto) {
      setF({ ...vazio, nome: prefill?.nome ?? '', telefone: prefill?.telefone ? mascaraTelefone(prefill.telefone) : '' });
      setErro(null);
      setMais(false);
    }
  }, [aberto, prefill]);

  const set = <K extends keyof typeof vazio>(k: K, v: (typeof vazio)[K]) => setF((s) => ({ ...s, [k]: v }));

  const duplicado = useMemo(() => {
    const d = somenteDigitos(f.telefone);
    return d.length >= 10 ? leads.find((l) => l.telefone.endsWith(d.slice(-8))) : undefined;
  }, [f.telefone, leads]);

  const salvar = async (depois: 'fechar' | 'abrir' | 'outro') => {
    setErro(null);
    if (!f.nome.trim()) return setErro('Informe o nome'), nomeRef.current?.focus();
    if (somenteDigitos(f.telefone).length < 10) return setErro('Telefone precisa ter DDD + número');
    setSalvando(true);
    try {
      const lead = await criarLead({
        nome: f.nome,
        telefone: f.telefone,
        objetivo: f.objetivo || undefined,
        valorCarta: parseValor(f.valor),
        origem: f.origem || undefined,
        indicadoPor: f.indicadoPor || undefined,
        cidade: f.cidade || undefined,
        temperatura: f.temperatura,
        observacoes: f.observacoes || undefined,
      });
      toast(`Lead "${lead.nome}" criado`);
      if (depois === 'outro') {
        setF(vazio);
        nomeRef.current?.focus();
      } else {
        onFechar();
        if (depois === 'abrir') navigate(`/leads/${lead.id}`);
      }
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Novo lead"
      subtitulo="Só nome e telefone são obrigatórios"
      rodape={
        <>
          <Button variante="fantasma" className="mr-auto hidden sm:inline-flex" onClick={() => salvar('outro')} disabled={salvando}>
            Salvar e adicionar outro
          </Button>
          <Button onClick={() => salvar('abrir')} disabled={salvando}>
            Salvar e abrir
          </Button>
          <Button variante="primario" onClick={() => salvar('fechar')} disabled={salvando}>
            Salvar <kbd className="ml-1 hidden rounded bg-white/20 px-1 text-[10px] sm:inline">Enter</kbd>
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          salvar('fechar');
        }}
        className="space-y-3"
      >
        <Field label="Nome" obrigatorio>
          <Input ref={nomeRef} data-autofocus value={f.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Ex.: Maria Silva" autoComplete="off" />
        </Field>
        <Field label="Telefone / WhatsApp" obrigatorio>
          <Input
            value={f.telefone}
            inputMode="tel"
            onChange={(e) => set('telefone', mascaraTelefone(e.target.value))}
            placeholder="(62) 99999-9999"
            autoComplete="off"
          />
        </Field>
        {duplicado && (
          <p className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0" /> Já existe um lead com esse telefone:{' '}
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => {
                onFechar();
                navigate(`/leads/${duplicado.id}`);
              }}
            >
              {duplicado.nome}
            </button>
          </p>
        )}

        <div>
          <p className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">Objetivo</p>
          <div className="flex flex-wrap gap-1.5">
            {opcoes(OBJETIVOS).map((o) => (
              <button
                type="button"
                key={o.value}
                onClick={() => set('objetivo', f.objetivo === o.value ? '' : o.value)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                  f.objetivo === o.value
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300',
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMais((m) => !m)}
          className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-400"
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform', mais && 'rotate-180')} />
          {mais ? 'Menos detalhes' : 'Mais detalhes (opcional)'}
        </button>

        {mais && (
          <div className="grid animate-fade-in grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Valor da carta">
              <Input value={f.valor} inputMode="decimal" onChange={(e) => set('valor', e.target.value)} placeholder="Ex.: 250 mil" />
            </Field>
            <Field label="Origem">
              <Select value={f.origem} onChange={(e) => set('origem', e.target.value)} vazio="—" opcoes={config.origens.map((o) => ({ value: o, label: o }))} />
            </Field>
            {f.origem === 'Indicação' && (
              <Field label="Quem indicou">
                <Input value={f.indicadoPor} onChange={(e) => set('indicadoPor', e.target.value)} />
              </Field>
            )}
            <Field label="Cidade">
              <Input value={f.cidade} onChange={(e) => set('cidade', e.target.value)} />
            </Field>
            <Field label="Temperatura">
              <Select value={f.temperatura} onChange={(e) => set('temperatura', e.target.value as Temperatura)} opcoes={opcoes(TEMPERATURAS)} />
            </Field>
            <Field label="Observações" className="sm:col-span-2">
              <Textarea value={f.observacoes} onChange={(e) => set('observacoes', e.target.value)} rows={2} />
            </Field>
          </div>
        )}

        {erro && <p className="text-sm font-medium text-red-600 dark:text-red-400">{erro}</p>}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
