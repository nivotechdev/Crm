import { useEffect, useState } from 'react';
import { PartyPopper } from 'lucide-react';
import type { Lead, SimNaoTalvez, TipoBem } from '../../types';
import { useData } from '../../store/DataContext';
import { useToast } from '../../store/ToastContext';
import { SIM_NAO_TALVEZ, TIPOS_BEM, opcoes } from '../../lib/labels';
import { etapaGanho } from '../../lib/etapas';
import { fromInputDate, toInputDate } from '../../lib/dates';
import { parseValor } from '../../lib/format';
import { Button } from '../ui/Button';
import { Field, Input, Select } from '../ui/Field';
import { Modal } from '../ui/Modal';

/** Ao fechar a venda, o lead vira cliente (pós-venda). Todos os campos são opcionais. */
export function WonModal({ lead, onFechar }: { lead: Lead | null; onFechar: () => void }) {
  const { moverEtapa, criarCliente, clientes, config } = useData();
  const toast = useToast();
  const [f, setF] = useState({
    administradora: '',
    grupo: '',
    cota: '',
    tipoBem: '' as TipoBem | '',
    valor: '',
    prazo: '',
    dataVenda: toInputDate(new Date().toISOString()),
    assembleia: '',
    lance: '' as SimNaoTalvez | '',
  });

  useEffect(() => {
    if (!lead) return;
    const tb: TipoBem | '' = lead.objetivo && lead.objetivo !== 'investimento' ? lead.objetivo : lead.objetivo ? 'imovel' : '';
    setF({
      administradora: '',
      grupo: '',
      cota: '',
      tipoBem: tb,
      valor: lead.valorCarta ? String(lead.valorCarta) : '',
      prazo: '',
      dataVenda: toInputDate(new Date().toISOString()),
      assembleia: '',
      lance: lead.recursoLance ?? '',
    });
  }, [lead]);

  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  const concluir = async (comDados: boolean) => {
    if (!lead) return;
    await moverEtapa(lead.id, etapaGanho(config).id);
    if (!clientes.some((c) => c.leadId === lead.id)) {
      await criarCliente({
        leadId: lead.id,
        nome: lead.nome,
        telefone: lead.telefone,
        status: 'ativo',
        dataVenda: fromInputDate(f.dataVenda) ?? new Date().toISOString(),
        valorCarta: comDados ? parseValor(f.valor) : lead.valorCarta,
        ...(comDados && {
          administradora: f.administradora || undefined,
          grupo: f.grupo || undefined,
          cota: f.cota || undefined,
          tipoBem: f.tipoBem || undefined,
          prazoMeses: f.prazo ? Number(f.prazo) : undefined,
          proximaAssembleia: fromInputDate(f.assembleia, '19:00'),
          pretendeLance: f.lance || undefined,
        }),
      });
    }
    toast(`🎉 Venda fechada com ${lead.nome}!`);
    onFechar();
  };

  return (
    <Modal
      aberto={!!lead}
      onFechar={onFechar}
      titulo={
        <span className="flex items-center gap-2">
          <PartyPopper className="h-5 w-5 text-emerald-500" /> Venda fechada!
        </span>
      }
      subtitulo={`${lead?.nome ?? ''} vai para Clientes. Preencha agora ou depois.`}
      rodape={
        <>
          <Button variante="fantasma" onClick={onFechar}>
            Cancelar
          </Button>
          <Button onClick={() => concluir(false)}>Preencher depois</Button>
          <Button variante="sucesso" onClick={() => concluir(true)}>
            Salvar cliente
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Administradora" className="col-span-2">
          <Input data-autofocus value={f.administradora} onChange={(e) => set('administradora', e.target.value)} />
        </Field>
        <Field label="Grupo">
          <Input value={f.grupo} onChange={(e) => set('grupo', e.target.value)} />
        </Field>
        <Field label="Cota">
          <Input value={f.cota} onChange={(e) => set('cota', e.target.value)} />
        </Field>
        <Field label="Tipo de bem">
          <Select value={f.tipoBem} onChange={(e) => set('tipoBem', e.target.value)} vazio="—" opcoes={opcoes(TIPOS_BEM)} />
        </Field>
        <Field label="Valor da carta">
          <Input value={f.valor} inputMode="decimal" onChange={(e) => set('valor', e.target.value)} />
        </Field>
        <Field label="Prazo (meses)">
          <Input value={f.prazo} inputMode="numeric" onChange={(e) => set('prazo', e.target.value.replace(/\D/g, ''))} />
        </Field>
        <Field label="Data da venda">
          <Input type="date" value={f.dataVenda} onChange={(e) => set('dataVenda', e.target.value)} />
        </Field>
        <Field label="Próxima assembleia">
          <Input type="date" value={f.assembleia} onChange={(e) => set('assembleia', e.target.value)} />
        </Field>
        <Field label="Pretende dar lance?">
          <Select value={f.lance} onChange={(e) => set('lance', e.target.value)} vazio="—" opcoes={opcoes(SIM_NAO_TALVEZ)} />
        </Field>
      </div>
    </Modal>
  );
}
