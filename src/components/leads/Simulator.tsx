import { useMemo, useState } from 'react';
import { AlertTriangle, Calculator, Save } from 'lucide-react';
import type { Lead } from '../../types';
import { useData } from '../../store/DataContext';
import { useAcoes } from '../../store/AcoesContext';
import { useToast } from '../../store/ToastContext';
import { calcularParcela } from '../../services';
import { formatBRL, parseValor, primeiroNome } from '../../lib/format';
import { formatDataHora } from '../../lib/dates';
import { Button } from '../ui/Button';
import { Field, Input } from '../ui/Field';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';

const num = (v: string) => {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};

/**
 * Calculadora rápida. NENHUM valor de taxa vem pré-preenchido:
 * o vendedor informa os dados da administradora.
 */
export function Simulator({ lead }: { lead: Lead }) {
  const { criarSimulacao, simulacoes, config } = useData();
  const { contatoRapido, pedirMoverEtapa } = useAcoes();
  const toast = useToast();
  const [valor, setValor] = useState(lead.valorCarta ? String(lead.valorCarta) : '');
  const [prazo, setPrazo] = useState('');
  const [taxa, setTaxa] = useState('');
  const [fundo, setFundo] = useState('');

  const entrada = {
    valorCarta: parseValor(valor) ?? NaN,
    prazoMeses: num(prazo),
    taxaAdmPct: num(taxa),
    fundoReservaPct: num(fundo),
  };
  const completo = Object.values(entrada).every((v) => Number.isFinite(v)) && entrada.prazoMeses > 0 && entrada.valorCarta > 0;
  const calc = completo ? calcularParcela(entrada) : null;

  const historico = useMemo(
    () => simulacoes.filter((s) => s.leadId === lead.id).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)),
    [simulacoes, lead.id],
  );

  const salvar = async () => {
    if (!calc) return;
    await criarSimulacao({ leadId: lead.id, ...entrada });
    const etapaSim = config.etapas.find((e) => e.id === 'simulacao' && e.tipo === 'aberta');
    const idxAtual = config.etapas.findIndex((e) => e.id === lead.etapaId);
    const idxSim = config.etapas.findIndex((e) => e.id === etapaSim?.id);
    toast('Simulação salva no histórico', etapaSim && idxAtual < idxSim ? { acao: { label: `Mover p/ ${etapaSim.nome}`, onClick: () => pedirMoverEtapa(lead, etapaSim.id) } } : undefined);
  };

  const enviar = () => {
    if (!calc) return;
    const texto =
      `Olá, ${primeiroNome(lead.nome)}! Segue a simulação que conversamos:\n\n` +
      `• Carta de crédito: ${formatBRL(entrada.valorCarta)}\n` +
      `• Prazo: ${entrada.prazoMeses} meses\n` +
      `• Parcela estimada: ${formatBRL(calc.parcela, true)}\n\n` +
      `*Valores estimados, sujeitos à confirmação da administradora.*`;
    contatoRapido(lead, 'whatsapp', { texto });
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Valor da carta (R$)">
          <Input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" placeholder="Ex.: 300000" />
        </Field>
        <Field label="Prazo (meses)">
          <Input value={prazo} onChange={(e) => setPrazo(e.target.value.replace(/[^\d]/g, ''))} inputMode="numeric" placeholder="Informe" />
        </Field>
        <Field label="Taxa de adm. total (%)">
          <Input value={taxa} onChange={(e) => setTaxa(e.target.value)} inputMode="decimal" placeholder="Informe" />
        </Field>
        <Field label="Fundo de reserva (%)">
          <Input value={fundo} onChange={(e) => setFundo(e.target.value)} inputMode="decimal" placeholder="Informe (0 se não houver)" />
        </Field>
      </div>

      <div className="mt-4 rounded-3xl bg-slate-50 p-5 dark:bg-slate-800/60">
        {calc ? (
          <>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Parcela estimada</p>
            <p className="num mt-0.5 text-[34px] font-bold tracking-tight text-slate-900 dark:text-white">{formatBRL(calc.parcela, true)}</p>
            <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <dt className="text-slate-500">Fundo comum</dt>
                <dd className="font-medium tabular-nums">{formatBRL(calc.fundoComum, true)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Taxa adm.</dt>
                <dd className="font-medium tabular-nums">{formatBRL(calc.taxaAdm, true)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Fundo reserva</dt>
                <dd className="font-medium tabular-nums">{formatBRL(calc.fundoReserva, true)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-slate-500">Total estimado no prazo: {formatBRL(calc.totalPago)}</p>
          </>
        ) : (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Calculator className="h-4 w-4" /> Preencha os 4 campos para calcular.
          </p>
        )}
        <p className="mt-4 flex items-start gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
          Estimativa — confirme no sistema da administradora. Não inclui seguro, reajustes, lance ou regras específicas do grupo.
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variante="primario" icone={<Save className="h-4 w-4" />} disabled={!calc} onClick={salvar}>
          Salvar no histórico
        </Button>
        <Button variante="whatsapp" icone={<WhatsAppIcon className="h-4 w-4" />} disabled={!calc} onClick={enviar}>
          Enviar no WhatsApp
        </Button>
      </div>

      {historico.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Simulações anteriores</p>
          <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
            {historico.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 py-2">
                <button
                  className="min-w-0 text-left hover:text-brand-700 dark:hover:text-brand-300"
                  title="Carregar estes valores"
                  onClick={() => {
                    setValor(String(s.valorCarta));
                    setPrazo(String(s.prazoMeses));
                    setTaxa(String(s.taxaAdmPct));
                    setFundo(String(s.fundoReservaPct));
                  }}
                >
                  <span className="font-medium">{formatBRL(s.valorCarta)}</span> · {s.prazoMeses}m · adm {s.taxaAdmPct}% · FR {s.fundoReservaPct}%
                  <span className="block text-xs text-slate-400">{formatDataHora(s.criadoEm)}</span>
                </button>
                <span className="shrink-0 font-semibold tabular-nums">{formatBRL(s.parcelaEstimada, true)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
