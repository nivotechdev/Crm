import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Download, Minus, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import type { Configuracoes, Etapa, ModeloMensagem, NivelContato } from '../types';
import { useData } from '../store/DataContext';
import { useAcoes } from '../store/AcoesContext';
import { useToast } from '../store/ToastContext';
import { useTheme } from '../store/ThemeContext';
import { exportarTudo } from '../services';
import { descricaoFaixas, NIVEL_ESTILO } from '../lib/contactStatus';
import { CORES_ETAPA } from '../lib/etapas';
import { preencherModelo, VARIAVEIS_MODELO } from '../lib/whatsapp';
import { uid } from '../lib/uid';
import { cn } from '../lib/cn';
import { Button, IconButton } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Field, Input, Textarea } from '../components/ui/Field';
import { Segmented } from '../components/ui/Segmented';
import { PageHeader } from '../components/layout/PageHeader';

const LEAD_EXEMPLO = { nome: 'Maria Souza', valorCarta: 250000, objetivo: 'imovel' as const, cidade: 'Goiânia' };

export default function SettingsPage() {
  const data = useData();
  const { confirmar } = useAcoes();
  const toast = useToast();
  const { tema, setTema } = useTheme();
  const [cfg, setCfg] = useState<Configuracoes>(data.config);
  const [novaOrigem, setNovaOrigem] = useState('');

  useEffect(() => setCfg(data.config), [data.config]);
  useEffect(() => {
    if (window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
  }, []);

  const sujo = useMemo(() => JSON.stringify(cfg) !== JSON.stringify(data.config), [cfg, data.config]);
  const set = <K extends keyof Configuracoes>(k: K, v: Configuracoes[K]) => setCfg((c) => ({ ...c, [k]: v }));

  const erroFaixas = cfg.amareloAteDias < 1 ? 'Amarelo deve começar em pelo menos 1 dia' : cfg.laranjaAteDias <= cfg.amareloAteDias ? 'O limite do laranja deve ser maior que o do amarelo' : null;

  const salvar = async () => {
    if (erroFaixas) return toast(erroFaixas, { tipo: 'erro' });
    if (cfg.etapas.some((e) => !e.nome.trim())) return toast('Toda etapa precisa de nome', { tipo: 'erro' });
    const idsNovos = new Set(cfg.etapas.map((e) => e.id));
    const removidas = data.config.etapas.filter((e) => !idsNovos.has(e.id));
    const afetados = data.leads.filter((l) => removidas.some((r) => r.id === l.etapaId));
    if (afetados.length) {
      const destino = cfg.etapas.find((e) => e.tipo === 'aberta')!;
      const ok = await confirmar({
        titulo: `${afetados.length} lead(s) estão em etapas removidas`,
        mensagem: `Eles serão movidos para "${destino.nome}".`,
        confirmarLabel: 'Mover e salvar',
      });
      if (!ok) return;
      await data.salvarConfig(cfg);
      await data.moverEtapaEmMassa(afetados.map((l) => l.id), destino.id);
    } else {
      await data.salvarConfig(cfg);
    }
    toast('Configurações salvas');
  };

  // ── Etapas
  const abertas = cfg.etapas.filter((e) => e.tipo === 'aberta');
  const finais = cfg.etapas.filter((e) => e.tipo !== 'aberta');
  const setAbertas = (novas: Etapa[]) => set('etapas', [...novas, ...finais]);
  const atualizarEtapa = (id: string, patch: Partial<Etapa>) => set('etapas', cfg.etapas.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const mover = (i: number, dir: -1 | 1) => {
    const arr = [...abertas];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setAbertas(arr);
  };

  // ── Modelos
  const atualizarModelo = (id: string, patch: Partial<ModeloMensagem>) => set('modelos', cfg.modelos.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  return (
    <div className="mx-auto max-w-4xl px-3 py-4 md:px-6 md:py-6">
      <PageHeader titulo="Configurações" />

      <div className="space-y-4">
        <Card>
          <CardHeader titulo="Perfil e meta" />
          <div className="grid gap-4 px-4 pb-5 sm:grid-cols-2 sm:px-5">
            <Field label="Seu nome (usado em {vendedor} nas mensagens)">
              <Input value={cfg.nomeVendedor} placeholder="Seu nome" onChange={(e) => set('nomeVendedor', e.target.value)} />
            </Field>
            <Field label="Meta diária de contatos (ligações + WhatsApps)">
              <Stepper valor={cfg.metaDiaria} min={1} max={500} onChange={(v) => set('metaDiaria', v)} />
            </Field>
            <label className="flex items-center gap-3 text-sm sm:col-span-2">
              <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={cfg.autoAvancarLeadNovo} onChange={(e) => set('autoAvancarLeadNovo', e.target.checked)} />
              Ao registrar o 1º contato, mover automaticamente de "{abertas[0]?.nome}" para "{abertas[1]?.nome}"
            </label>
          </div>
        </Card>

        <Card>
          <CardHeader titulo="Indicador de último contato" subtitulo="Defina os intervalos de cada cor" />
          <div className="px-4 pb-5 sm:px-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amarelo: de 1 dia até (dias)">
                <Stepper valor={cfg.amareloAteDias} min={1} max={60} onChange={(v) => set('amareloAteDias', v)} />
              </Field>
              <Field label="Laranja: até (dias) — depois disso fica vermelho">
                <Stepper valor={cfg.laranjaAteDias} min={2} max={120} onChange={(v) => set('laranjaAteDias', v)} />
              </Field>
            </div>
            {erroFaixas && <p className="mt-2 text-sm font-medium text-red-600">{erroFaixas}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {(Object.entries(descricaoFaixas(cfg)) as Array<[NivelContato, string]>).map(([nivel, desc]) => (
                <span key={nivel} className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset', NIVEL_ESTILO[nivel].badge)}>
                  <span className={cn('h-2 w-2 rounded-full', NIVEL_ESTILO[nivel].ponto)} />
                  {nivel.charAt(0).toUpperCase() + nivel.slice(1)}: {desc}
                </span>
              ))}
            </div>
          </div>
        </Card>

        <Card id="etapas">
          <CardHeader
            titulo="Etapas do funil"
            subtitulo="Renomeie, reordene, mude a cor ou adicione etapas"
            acao={
              <Button tamanho="sm" icone={<Plus className="h-4 w-4" />} onClick={() => setAbertas([...abertas, { id: uid(), nome: 'Nova etapa', tipo: 'aberta', cor: 'slate' }])}>
                Etapa
              </Button>
            }
          />
          <ul className="divide-y divide-slate-100 px-4 pb-3 dark:divide-slate-800 sm:px-5">
            {abertas.map((e, i) => (
              <EtapaLinha
                key={e.id}
                etapa={e}
                qtdLeads={data.leads.filter((l) => l.etapaId === e.id).length}
                onChange={(p) => atualizarEtapa(e.id, p)}
                onSubir={i > 0 ? () => mover(i, -1) : undefined}
                onDescer={i < abertas.length - 1 ? () => mover(i, 1) : undefined}
                onRemover={abertas.length > 2 ? () => setAbertas(abertas.filter((x) => x.id !== e.id)) : undefined}
              />
            ))}
            {finais.map((e) => (
              <EtapaLinha key={e.id} etapa={e} qtdLeads={data.leads.filter((l) => l.etapaId === e.id).length} onChange={(p) => atualizarEtapa(e.id, p)} fixa />
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader titulo="Origens de lead" />
          <div className="px-4 pb-5 sm:px-5">
            <div className="mb-3 flex flex-wrap gap-2">
              {cfg.origens.map((o, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 py-1 pl-1 pr-1 dark:bg-slate-800">
                  <input
                    value={o}
                    onChange={(e) => set('origens', cfg.origens.map((x, j) => (j === i ? e.target.value : x)))}
                    className="w-auto rounded border-0 bg-transparent px-1.5 py-0.5 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 dark:focus:bg-slate-900"
                    size={Math.max(4, o.length)}
                    aria-label="Nome da origem"
                  />
                  <button aria-label={`Remover ${o}`} className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-red-600 dark:hover:bg-slate-700" onClick={() => set('origens', cfg.origens.filter((_, j) => j !== i))}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const v = novaOrigem.trim();
                if (v && !cfg.origens.includes(v)) set('origens', [...cfg.origens, v]);
                setNovaOrigem('');
              }}
            >
              <Input value={novaOrigem} onChange={(e) => setNovaOrigem(e.target.value)} placeholder="Nova origem (ex.: Google, Feira)" className="max-w-xs" />
              <Button type="submit" icone={<Plus className="h-4 w-4" />}>
                Adicionar
              </Button>
            </form>
          </div>
        </Card>

        <Card id="modelos">
          <CardHeader
            titulo="Modelos de mensagem do WhatsApp"
            subtitulo="Abrem o wa.me com o texto já preenchido"
            acao={
              <Button tamanho="sm" icone={<Plus className="h-4 w-4" />} onClick={() => set('modelos', [...cfg.modelos, { id: uid(), nome: 'Novo modelo', texto: 'Olá, {primeiroNome}! ' }])}>
                Modelo
              </Button>
            }
          />
          <div className="space-y-4 px-4 pb-5 sm:px-5">
            {cfg.modelos.map((m) => (
              <ModeloEditor key={m.id} modelo={m} cfg={cfg} onChange={(p) => atualizarModelo(m.id, p)} onRemover={() => set('modelos', cfg.modelos.filter((x) => x.id !== m.id))} />
            ))}
            {cfg.modelos.length === 0 && <p className="text-sm text-slate-500">Nenhum modelo. Crie um para agilizar suas mensagens.</p>}
          </div>
        </Card>

        <Card>
          <CardHeader titulo="Aparência" />
          <div className="px-4 pb-5 sm:px-5">
            <Segmented
              valor={tema}
              onChange={setTema}
              opcoes={[
                { value: 'claro', label: '☀ Claro' },
                { value: 'escuro', label: '☾ Escuro' },
                { value: 'sistema', label: 'Sistema' },
              ]}
            />
          </div>
        </Card>

        <Card>
          <CardHeader titulo="Dados" subtitulo="Por enquanto os dados ficam salvos neste navegador (localStorage)" />
          <div className="flex flex-wrap gap-2 px-4 pb-5 sm:px-5">
            <Button
              icone={<Download className="h-4 w-4" />}
              onClick={async () => {
                const json = await exportarTudo();
                const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
                const a = document.createElement('a');
                a.href = url;
                a.download = `crm-consorcio-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
                toast('Backup exportado');
              }}
            >
              Exportar backup (JSON)
            </Button>
            <Button
              icone={<RotateCcw className="h-4 w-4" />}
              onClick={async () => {
                if (await confirmar({ titulo: 'Restaurar dados de exemplo?', mensagem: 'Todos os dados atuais serão substituídos pelos 30 leads de exemplo.', confirmarLabel: 'Restaurar', perigo: true })) {
                  await data.restaurarExemplo();
                  toast('Dados de exemplo restaurados');
                }
              }}
            >
              Restaurar dados de exemplo
            </Button>
            <Button
              variante="perigo"
              icone={<Trash2 className="h-4 w-4" />}
              onClick={async () => {
                if (await confirmar({ titulo: 'Apagar TODOS os dados?', mensagem: 'Leads, histórico, agenda, clientes e configurações serão apagados. Exporte um backup antes. Não é possível desfazer.', confirmarLabel: 'Apagar tudo', perigo: true })) {
                  await data.apagarTudo();
                  toast('Todos os dados foram apagados', { tipo: 'info' });
                }
              }}
            >
              Apagar tudo
            </Button>
          </div>
        </Card>
      </div>

      {sujo && (
        <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-xl animate-slide-up items-center gap-3 rounded-2xl bg-slate-900 p-3 pl-4 text-sm text-white shadow-2xl dark:bg-slate-800 md:bottom-6">
          <span className="flex-1">Você tem alterações não salvas</span>
          <Button variante="fantasma" className="text-slate-300 hover:bg-white/10 hover:text-white" onClick={() => setCfg(data.config)}>
            Descartar
          </Button>
          <Button variante="primario" onClick={salvar}>
            Salvar
          </Button>
        </div>
      )}
    </div>
  );
}

function Stepper({ valor, onChange, min, max }: { valor: number; onChange: (v: number) => void; min: number; max: number }) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div className="flex items-center gap-2">
      <IconButton label="Diminuir" className="ring-1 ring-slate-300 dark:ring-slate-600" onClick={() => onChange(clamp(valor - 1))}>
        <Minus className="h-4 w-4" />
      </IconButton>
      <Input type="number" value={valor} min={min} max={max} onChange={(e) => onChange(clamp(Number(e.target.value) || min))} className="w-20 text-center tabular-nums" />
      <IconButton label="Aumentar" className="ring-1 ring-slate-300 dark:ring-slate-600" onClick={() => onChange(clamp(valor + 1))}>
        <Plus className="h-4 w-4" />
      </IconButton>
    </div>
  );
}

function EtapaLinha({
  etapa,
  qtdLeads,
  onChange,
  onSubir,
  onDescer,
  onRemover,
  fixa,
}: {
  etapa: Etapa;
  qtdLeads: number;
  onChange: (p: Partial<Etapa>) => void;
  onSubir?: () => void;
  onDescer?: () => void;
  onRemover?: () => void;
  fixa?: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center gap-2 py-2.5">
      <div className="flex gap-1" role="radiogroup" aria-label="Cor da etapa">
        {Object.entries(CORES_ETAPA).map(([k, c]) => (
          <button
            key={k}
            role="radio"
            aria-checked={etapa.cor === k}
            aria-label={k}
            onClick={() => onChange({ cor: k })}
            className={cn('h-5 w-5 rounded-full', c.dot, etapa.cor === k ? 'ring-2 ring-slate-900 ring-offset-2 dark:ring-white dark:ring-offset-slate-900' : 'opacity-60 hover:opacity-100')}
          />
        ))}
      </div>
      <Input value={etapa.nome} onChange={(e) => onChange({ nome: e.target.value })} className="h-9 min-w-[160px] flex-1" aria-label="Nome da etapa" />
      <span className="w-16 text-right text-xs tabular-nums text-slate-500">{qtdLeads} leads</span>
      {fixa ? (
        <span className="w-[120px] text-right text-xs text-slate-400">{etapa.tipo === 'ganho' ? 'Etapa de venda' : 'Etapa de perda'}</span>
      ) : (
        <div className="flex">
          <IconButton label="Subir" disabled={!onSubir} onClick={onSubir} className="disabled:opacity-30">
            <ArrowUp className="h-4 w-4" />
          </IconButton>
          <IconButton label="Descer" disabled={!onDescer} onClick={onDescer} className="disabled:opacity-30">
            <ArrowDown className="h-4 w-4" />
          </IconButton>
          <IconButton label="Remover etapa" disabled={!onRemover} onClick={onRemover} className="hover:text-red-600 disabled:opacity-30">
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      )}
    </li>
  );
}

function ModeloEditor({ modelo, cfg, onChange, onRemover }: { modelo: ModeloMensagem; cfg: Configuracoes; onChange: (p: Partial<ModeloMensagem>) => void; onRemover: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const inserir = (v: string) => {
    const el = ref.current;
    if (!el) return onChange({ texto: modelo.texto + v });
    const ini = el.selectionStart ?? modelo.texto.length;
    const fim = el.selectionEnd ?? ini;
    onChange({ texto: modelo.texto.slice(0, ini) + v + modelo.texto.slice(fim) });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(ini + v.length, ini + v.length);
    });
  };
  return (
    <div className="rounded-xl ring-1 ring-slate-200 dark:ring-slate-700">
      <div className="flex items-center gap-2 border-b border-slate-100 p-2 dark:border-slate-800">
        <Input value={modelo.nome} onChange={(e) => onChange({ nome: e.target.value })} className="h-9 font-medium" aria-label="Nome do modelo" />
        <IconButton label="Remover modelo" onClick={onRemover} className="hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>
      <div className="grid gap-3 p-3 md:grid-cols-2">
        <div>
          <Textarea ref={ref} rows={4} value={modelo.texto} onChange={(e) => onChange({ texto: e.target.value })} aria-label="Texto do modelo" />
          <div className="mt-1.5 flex flex-wrap gap-1">
            {VARIAVEIS_MODELO.map((v) => (
              <button key={v} onClick={() => inserir(v)} className="rounded-md bg-brand-50 px-1.5 py-0.5 font-mono text-[11px] text-brand-700 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300">
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-[#e7f9ee] p-3 text-sm text-slate-800 dark:bg-emerald-950/40 dark:text-emerald-50">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Prévia</p>
          <p className="whitespace-pre-wrap">{preencherModelo(modelo.texto, LEAD_EXEMPLO, cfg)}</p>
        </div>
      </div>
    </div>
  );
}
