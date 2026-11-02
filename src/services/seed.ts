/**
 * Dados de exemplo realistas. As datas são relativas ao momento da criação,
 * para que todas as cores do indicador apareçam.
 */
import type {
  Atividade, Canal, Cliente, Lead, MotivoPerda, Objetivo, ResultadoContato, SimNaoTalvez, Simulacao, Tarefa, Temperatura,
} from '../types';
import { uid } from '../lib/uid';
import { CONFIG_PADRAO } from './defaults';
import { db } from './storage';

// PRNG determinístico (mulberry32) para dados estáveis
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(42);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

function diasAtras(d: number, hora = 9 + Math.floor(rand() * 9), min = Math.floor(rand() * 60)): string {
  const x = new Date();
  x.setDate(x.getDate() - d);
  x.setHours(hora, min, 0, 0);
  // não criar contatos "hoje" no futuro
  if (d === 0 && x.getTime() > Date.now()) x.setTime(Date.now() - (1 + Math.floor(rand() * 90)) * 60_000);
  return x.toISOString();
}

function diasAFrente(d: number, hora = 10, min = 0): string {
  const x = new Date();
  x.setDate(x.getDate() + d);
  x.setHours(hora, min, 0, 0);
  return x.toISOString();
}

type SeedLead = {
  nome: string;
  tel: string;
  cidade: string;
  origem: string;
  indicadoPor?: string;
  objetivo: Objetivo;
  valor: number;
  parcela: number;
  temp: Temperatura;
  etapa: string;
  /** dias desde o último contato; null = nunca */
  ult: number | null;
  canal?: Canal;
  criado: number;
  lance?: SimNaoTalvez;
  valorLance?: number;
  etiquetas?: string[];
  objecao?: string;
  decisor?: string;
  prazoUso?: string;
  perda?: MotivoPerda;
  etapaAntesPerda?: string;
  obs?: string;
  jaTeve?: SimNaoTalvez;
};

const LEADS: SeedLead[] = [
  { nome: 'Mariana Albuquerque', tel: '62981234567', cidade: 'Goiânia', origem: 'Instagram', objetivo: 'imovel', valor: 350000, parcela: 2200, temp: 'quente', etapa: 'negociacao', ult: 0, canal: 'whatsapp', criado: 34, lance: 'sim', valorLance: 60000, etiquetas: ['Apartamento', 'Lance'], decisor: 'Cônjuge (Rafael)', prazoUso: 'Em até 12 meses', obs: 'Quer apartamento de 3 quartos no Setor Bueno.' },
  { nome: 'Rafael Monteiro', tel: '62992341188', cidade: 'Aparecida de Goiânia', origem: 'Indicação', indicadoPor: 'Carlos Pereira', objetivo: 'veiculo', valor: 90000, parcela: 1300, temp: 'morno', etapa: 'diagnostico', ult: 0, canal: 'ligacao', criado: 12, lance: 'talvez', objecao: 'Acha que demora para ser contemplado' },
  { nome: 'Juliana Castro', tel: '61998123344', cidade: 'Brasília', origem: 'Tráfego pago', objetivo: 'imovel', valor: 500000, parcela: 3500, temp: 'quente', etapa: 'simulacao', ult: 1, canal: 'whatsapp', criado: 21, lance: 'sim', valorLance: 100000, etiquetas: ['Casa'], prazoUso: 'Em até 6 meses' },
  { nome: 'Pedro Henrique Lima', tel: '62984776612', cidade: 'Goiânia', origem: 'Lista fria', objetivo: 'veiculo', valor: 70000, parcela: 1000, temp: 'frio', etapa: 'contato', ult: 2, canal: 'ligacao', criado: 9 },
  { nome: 'Ana Beatriz Rocha', tel: '11976542210', cidade: 'São Paulo', origem: 'Instagram', objetivo: 'investimento', valor: 300000, parcela: 2500, temp: 'morno', etapa: 'reuniao', ult: 3, canal: 'whatsapp', criado: 27, etiquetas: ['Investidor'], objecao: 'Comparando com renda fixa' },
  { nome: 'Lucas Fernandes', tel: '62991027788', cidade: 'Anápolis', origem: 'Indicação', indicadoPor: 'Mariana Albuquerque', objetivo: 'pesado', valor: 450000, parcela: 6000, temp: 'quente', etapa: 'negociacao', ult: 1, canal: 'ligacao', criado: 40, lance: 'sim', valorLance: 90000, etiquetas: ['Caminhão', 'PJ'], decisor: 'Sócio (Márcio)' },
  { nome: 'Camila Duarte', tel: '62983459090', cidade: 'Goiânia', origem: 'Tráfego pago', objetivo: 'imovel', valor: 280000, parcela: 1800, temp: 'morno', etapa: 'contato', ult: 5, canal: 'whatsapp', criado: 15 },
  { nome: 'Bruno Carvalho', tel: '34998765432', cidade: 'Uberlândia', origem: 'Evento', objetivo: 'veiculo', valor: 120000, parcela: 1700, temp: 'morno', etapa: 'diagnostico', ult: 4, canal: 'ligacao', criado: 22, jaTeve: 'sim' },
  { nome: 'Fernanda Ribeiro', tel: '62995551234', cidade: 'Goiânia', origem: 'Cliente antigo', objetivo: 'imovel', valor: 400000, parcela: 2800, temp: 'quente', etapa: 'simulacao', ult: 0, canal: 'ligacao', criado: 18, lance: 'talvez', etiquetas: ['Terreno'] },
  { nome: 'Gustavo Almeida', tel: '62982223456', cidade: 'Trindade', origem: 'Lista fria', objetivo: 'veiculo', valor: 60000, parcela: 900, temp: 'frio', etapa: 'novo', ult: null, criado: 1 },
  { nome: 'Patrícia Gomes', tel: '61981112233', cidade: 'Brasília', origem: 'Instagram', objetivo: 'servicos', valor: 30000, parcela: 600, temp: 'frio', etapa: 'novo', ult: null, criado: 0, obs: 'Quer usar para reforma + festa de casamento.' },
  { nome: 'Thiago Nascimento', tel: '62993334455', cidade: 'Goiânia', origem: 'Tráfego pago', objetivo: 'imovel', valor: 250000, parcela: 1600, temp: 'morno', etapa: 'contato', ult: 8, canal: 'whatsapp', criado: 30 },
  { nome: 'Larissa Martins', tel: '19997008899', cidade: 'Campinas', origem: 'Indicação', indicadoPor: 'Fernanda Ribeiro', objetivo: 'imovel', valor: 600000, parcela: 4000, temp: 'quente', etapa: 'reuniao', ult: 2, canal: 'whatsapp', criado: 10, lance: 'sim', valorLance: 150000, decisor: 'Cônjuge' },
  { nome: 'Diego Souza', tel: '62986667788', cidade: 'Senador Canedo', origem: 'Lista fria', objetivo: 'veiculo', valor: 80000, parcela: 1100, temp: 'frio', etapa: 'contato', ult: 12, canal: 'ligacao', criado: 25, objecao: 'Sem tempo para conversar' },
  { nome: 'Aline Teixeira', tel: '62994445566', cidade: 'Goiânia', origem: 'Instagram', objetivo: 'imovel', valor: 320000, parcela: 2000, temp: 'morno', etapa: 'diagnostico', ult: 6, canal: 'whatsapp', criado: 19 },
  { nome: 'Rodrigo Barbosa', tel: '16988881212', cidade: 'Ribeirão Preto', origem: 'Evento', objetivo: 'pesado', valor: 380000, parcela: 5200, temp: 'morno', etapa: 'simulacao', ult: 9, canal: 'ligacao', criado: 33, etiquetas: ['Trator', 'Agro'] },
  { nome: 'Vanessa Pinto', tel: '62989893434', cidade: 'Goiânia', origem: 'Tráfego pago', objetivo: 'veiculo', valor: 110000, parcela: 1500, temp: 'frio', etapa: 'novo', ult: null, criado: 2 },
  { nome: 'Marcelo Azevedo', tel: '62991915656', cidade: 'Aparecida de Goiânia', origem: 'Cliente antigo', objetivo: 'investimento', valor: 200000, parcela: 1800, temp: 'morno', etapa: 'negociacao', ult: 3, canal: 'whatsapp', criado: 45, objecao: 'Quer taxa menor' },
  { nome: 'Beatriz Correia', tel: '31992927878', cidade: 'Belo Horizonte', origem: 'Instagram', objetivo: 'imovel', valor: 450000, parcela: 3000, temp: 'quente', etapa: 'reuniao', ult: 0, canal: 'whatsapp', criado: 8 },
  { nome: 'Felipe Moreira', tel: '62983839191', cidade: 'Goiânia', origem: 'Lista fria', objetivo: 'veiculo', valor: 75000, parcela: 1000, temp: 'frio', etapa: 'contato', ult: 21, canal: 'ligacao', criado: 50 },
  { nome: 'Renata Vieira', tel: '62997972323', cidade: 'Anápolis', origem: 'Indicação', indicadoPor: 'Lucas Fernandes', objetivo: 'imovel', valor: 270000, parcela: 1700, temp: 'morno', etapa: 'diagnostico', ult: 1, canal: 'ligacao', criado: 6 },
  { nome: 'André Cardoso', tel: '41996464545', cidade: 'Curitiba', origem: 'Tráfego pago', objetivo: 'servicos', valor: 40000, parcela: 800, temp: 'frio', etapa: 'novo', ult: null, criado: 0 },
  { nome: 'Gabriela Mendes', tel: '62985856767', cidade: 'Goiânia', origem: 'Evento', objetivo: 'veiculo', valor: 95000, parcela: 1300, temp: 'morno', etapa: 'simulacao', ult: 0, canal: 'whatsapp', criado: 14 },
  { nome: 'Eduardo Santana', tel: '62998981010', cidade: 'Goiânia', origem: 'Indicação', indicadoPor: 'Fernanda Ribeiro', objetivo: 'imovel', valor: 300000, parcela: 2000, temp: 'quente', etapa: 'ganho', ult: 1, canal: 'ligacao', criado: 38 },
  { nome: 'Carolina Freitas', tel: '62987871414', cidade: 'Goiânia', origem: 'Instagram', objetivo: 'veiculo', valor: 85000, parcela: 1200, temp: 'quente', etapa: 'ganho', ult: 0, canal: 'whatsapp', criado: 26 },
  { nome: 'Leonardo Araújo', tel: '61993035050', cidade: 'Brasília', origem: 'Cliente antigo', objetivo: 'investimento', valor: 250000, parcela: 2100, temp: 'quente', etapa: 'ganho', ult: 15, canal: 'ligacao', criado: 60 },
  { nome: 'Tatiane Lopes', tel: '62984044747', cidade: 'Goiânia', origem: 'Tráfego pago', objetivo: 'imovel', valor: 260000, parcela: 1500, temp: 'frio', etapa: 'perdido', ult: 10, canal: 'whatsapp', criado: 42, perda: 'preferiu_financiamento', etapaAntesPerda: 'simulacao' },
  { nome: 'Ricardo Batista', tel: '62996061818', cidade: 'Trindade', origem: 'Lista fria', objetivo: 'veiculo', valor: 65000, parcela: 800, temp: 'frio', etapa: 'perdido', ult: 25, canal: 'ligacao', criado: 55, perda: 'sem_dinheiro', etapaAntesPerda: 'diagnostico' },
  { nome: 'Isabela Cunha', tel: '11985452929', cidade: 'São Paulo', origem: 'Tráfego pago', objetivo: 'imovel', valor: 380000, parcela: 2400, temp: 'frio', etapa: 'perdido', ult: 40, canal: 'whatsapp', criado: 70, perda: 'nao_responde', etapaAntesPerda: 'contato' },
  { nome: 'Sérgio Ramos', tel: '62990102020', cidade: 'Goiânia', origem: 'Instagram', objetivo: 'imovel', valor: 220000, parcela: 1500, temp: 'morno', etapa: 'contato', ult: 45, canal: 'whatsapp', criado: 80, objecao: 'Vai esperar o 13º' },
];

const RES_LIGACAO: ResultadoContato[] = ['atendeu', 'atendeu', 'nao_atendeu', 'caixa_postal', 'pediu_retorno'];
const RES_WPP: ResultadoContato[] = ['respondeu', 'respondeu', 'visualizou_sem_resposta', 'pediu_retorno'];
const OBS_EXEMPLO = [
  'Pediu para falar depois do expediente',
  'Gostou da ideia de usar o lance embutido',
  'Vai conversar com a família',
  'Interessado, quer ver números',
  'Estava dirigindo, retornar',
  '',
  '',
  '',
];

export async function popularDadosExemplo(): Promise<void> {
  const etapasOrdem = CONFIG_PADRAO.etapas.filter((e) => e.tipo === 'aberta').map((e) => e.id);
  const leads: Lead[] = [];
  const atividades: Atividade[] = [];
  const leadIdPorNome: Record<string, string> = {};

  for (const s of LEADS) {
    const id = uid();
    leadIdPorNome[s.nome] = id;
    const criadoEm = diasAtras(s.criado, 9, 0);
    const lead: Lead = {
      id,
      nome: s.nome,
      telefone: s.tel,
      email: `${s.nome.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}.${s.nome.split(' ').slice(-1)[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}@email.com`,
      cidade: s.cidade,
      origem: s.origem,
      indicadoPor: s.indicadoPor,
      objetivo: s.objetivo,
      valorCarta: s.valor,
      parcelaIdeal: s.parcela,
      recursoLance: s.lance,
      valorLance: s.valorLance,
      prazoUsoCredito: s.prazoUso,
      urgencia: s.temp === 'quente' ? 'alta' : s.temp === 'morno' ? 'media' : 'baixa',
      jaTeveConsorcio: s.jaTeve,
      decisorJunto: s.decisor,
      objecaoPrincipal: s.objecao,
      temperatura: s.temp,
      etiquetas: s.etiquetas ?? [],
      observacoes: s.obs,
      etapaId: s.etapa,
      motivoPerda: s.perda,
      criadoEm,
      atualizadoEm: criadoEm,
    };

    atividades.push({ id: uid(), leadId: id, tipo: 'sistema', criadoEm, observacao: `Lead criado · origem: ${s.origem}` });

    // Contatos: o último em `ult` dias atrás, e alguns anteriores espaçados
    if (s.ult !== null && s.canal) {
      const qtdAnteriores = Math.min(3, Math.max(0, Math.floor((s.criado - s.ult) / 4)));
      const dias: number[] = [];
      for (let i = qtdAnteriores; i >= 1; i--) dias.push(s.ult + Math.round(((s.criado - s.ult) * i) / (qtdAnteriores + 1)));
      dias.push(s.ult);
      dias.forEach((d, i) => {
        const ultimo = i === dias.length - 1;
        const canal: Canal = ultimo ? s.canal! : pick<Canal>(['ligacao', 'whatsapp']);
        const quando = diasAtras(d);
        atividades.push({
          id: uid(),
          leadId: id,
          tipo: canal,
          criadoEm: quando,
          resultado: pick(canal === 'ligacao' ? RES_LIGACAO : RES_WPP),
          observacao: pick(OBS_EXEMPLO) || undefined,
        });
        if (ultimo) {
          lead.ultimoContatoEm = quando;
          lead.ultimoContatoCanal = canal;
        }
      });
    }

    // Histórico de etapas até a etapa atual
    const alvo = s.etapa === 'perdido' ? s.etapaAntesPerda! : s.etapa === 'ganho' ? 'negociacao' : s.etapa;
    const idxAlvo = etapasOrdem.indexOf(alvo);
    const caminho = etapasOrdem.slice(1, idxAlvo + 1);
    if (s.etapa === 'ganho' || s.etapa === 'perdido') caminho.push(s.etapa);
    const janela = Math.max(1, s.criado - (s.ult ?? 0));
    caminho.forEach((etapaPara, i) => {
      const d = Math.max(s.ult ?? 0, s.criado - Math.round((janela * (i + 1)) / (caminho.length + 1)));
      atividades.push({
        id: uid(),
        leadId: id,
        tipo: 'etapa',
        etapaDe: i === 0 ? 'novo' : caminho[i - 1],
        etapaPara,
        criadoEm: diasAtras(d, 18, 30 + i),
      });
    });

    leads.push(lead);
  }

  // Notas
  const nota = (nome: string, d: number, texto: string) =>
    atividades.push({ id: uid(), leadId: leadIdPorNome[nome], tipo: 'nota', criadoEm: diasAtras(d), observacao: texto });
  nota('Mariana Albuquerque', 2, 'Marido trabalha com TI, renda conjunta ~R$ 18 mil. Já tem FGTS para usar no lance.');
  nota('Lucas Fernandes', 5, 'Empresa de transporte, quer renovar frota. Decide junto com o sócio.');
  nota('Juliana Castro', 3, 'Mora de aluguel, quer sair em até 1 ano.');

  // Simulações (valores informados pelo vendedor em atendimentos anteriores)
  const simulacoes: Simulacao[] = [];
  const sim = (nome: string, d: number, valorCarta: number, prazoMeses: number, taxaAdmPct: number, fundoReservaPct: number) => {
    const parcela = (valorCarta * (1 + (taxaAdmPct + fundoReservaPct) / 100)) / prazoMeses;
    const s: Simulacao = {
      id: uid(),
      leadId: leadIdPorNome[nome],
      valorCarta,
      prazoMeses,
      taxaAdmPct,
      fundoReservaPct,
      parcelaEstimada: Math.round(parcela * 100) / 100,
      criadoEm: diasAtras(d),
    };
    simulacoes.push(s);
    atividades.push({
      id: uid(),
      leadId: s.leadId,
      tipo: 'simulacao',
      simulacaoId: s.id,
      criadoEm: s.criadoEm,
      observacao: `Carta ${valorCarta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} · ${prazoMeses} meses · parcela estimada ${s.parcelaEstimada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
    });
  };
  sim('Juliana Castro', 2, 500000, 200, 18, 2);
  sim('Fernanda Ribeiro', 1, 400000, 180, 17, 1);

  // Tarefas / retornos
  const L = leadIdPorNome;
  const agoraISO = new Date().toISOString();
  const tarefa = (t: Omit<Tarefa, 'id' | 'criadoEm' | 'concluida'> & { concluida?: boolean }): Tarefa => ({
    id: uid(),
    criadoEm: agoraISO,
    concluida: false,
    ...t,
  });
  const tarefas: Tarefa[] = [
    tarefa({ leadId: L['Juliana Castro'], titulo: 'Retorno sobre a simulação', tipo: 'retorno', dataHora: diasAFrente(0, 10), diaInteiro: false }),
    tarefa({ leadId: L['Camila Duarte'], titulo: 'Retornar contato', tipo: 'retorno', dataHora: diasAFrente(0, 14), diaInteiro: false }),
    tarefa({ leadId: L['Larissa Martins'], titulo: 'Reunião por vídeo com o casal', tipo: 'reuniao', dataHora: diasAFrente(0, 16, 30), diaInteiro: false }),
    tarefa({ leadId: L['Aline Teixeira'], titulo: 'Retornar contato', tipo: 'retorno', dataHora: diasAFrente(0, 9), diaInteiro: true }),
    tarefa({ leadId: L['Thiago Nascimento'], titulo: 'Retornar contato', tipo: 'retorno', dataHora: diasAFrente(-2, 9), diaInteiro: true }),
    tarefa({ leadId: L['Rodrigo Barbosa'], titulo: 'Cobrar retorno da simulação', tipo: 'retorno', dataHora: diasAFrente(-1, 11), diaInteiro: false }),
    tarefa({ leadId: L['Ana Beatriz Rocha'], titulo: 'Reunião presencial', tipo: 'reuniao', dataHora: diasAFrente(1, 15), diaInteiro: false }),
    tarefa({ leadId: L['Marcelo Azevedo'], titulo: 'Enviar proposta final', tipo: 'tarefa', dataHora: diasAFrente(3, 9), diaInteiro: true }),
    tarefa({ leadId: L['Bruno Carvalho'], titulo: 'Retornar contato', tipo: 'retorno', dataHora: diasAFrente(5, 9), diaInteiro: true }),
    tarefa({ leadId: L['Mariana Albuquerque'], titulo: 'Enviar contrato para assinatura', tipo: 'tarefa', dataHora: diasAFrente(-1, 9), diaInteiro: true, concluida: true, concluidaEm: diasAtras(1) }),
  ];

  // Clientes (pós-venda)
  const cliente = (c: Omit<Cliente, 'id' | 'criadoEm'>): Cliente => ({ id: uid(), criadoEm: c.dataVenda, ...c });
  const leadPorNome = (n: string) => leads.find((l) => l.nome === n)!;
  const ed = leadPorNome('Eduardo Santana');
  const ca = leadPorNome('Carolina Freitas');
  const le = leadPorNome('Leonardo Araújo');
  const clientes: Cliente[] = [
    cliente({ leadId: ed.id, nome: ed.nome, telefone: ed.telefone, administradora: 'Consórcio Horizonte', grupo: '1042', cota: '318', tipoBem: 'imovel', valorCarta: 300000, prazoMeses: 200, dataVenda: diasAtras(1), status: 'ativo', proximaAssembleia: diasAFrente(12, 19), pretendeLance: 'talvez' }),
    cliente({ leadId: ca.id, nome: ca.nome, telefone: ca.telefone, administradora: 'Nacional Consórcios', grupo: '2210', cota: '045', tipoBem: 'veiculo', valorCarta: 85000, prazoMeses: 80, dataVenda: diasAtras(0), status: 'ativo', proximaAssembleia: diasAFrente(20, 19), pretendeLance: 'sim', valorLance: 20000 }),
    cliente({ leadId: le.id, nome: le.nome, telefone: le.telefone, administradora: 'Consórcio Horizonte', grupo: '1038', cota: '122', tipoBem: 'imovel', valorCarta: 250000, prazoMeses: 180, dataVenda: diasAtras(20), status: 'ativo', proximaAssembleia: diasAFrente(5, 19), pretendeLance: 'sim', valorLance: 50000 }),
    cliente({ nome: 'Helena Prado', telefone: '62991237070', administradora: 'Administradora Alfa', grupo: '0877', cota: '201', tipoBem: 'imovel', valorCarta: 420000, prazoMeses: 200, dataVenda: diasAtras(95), status: 'ativo', proximaAssembleia: diasAFrente(3, 19), pretendeLance: 'sim', valorLance: 80000 }),
    cliente({ nome: 'Otávio Rezende', telefone: '62985554141', administradora: 'Nacional Consórcios', grupo: '2190', cota: '310', tipoBem: 'veiculo', valorCarta: 110000, prazoMeses: 72, dataVenda: diasAtras(62), status: 'ativo', proximaAssembleia: diasAFrente(25, 19), pretendeLance: 'nao' }),
    cliente({ nome: 'Simone Prates', telefone: '61987776262', administradora: 'Administradora Alfa', grupo: '0880', cota: '014', tipoBem: 'imovel', valorCarta: 350000, prazoMeses: 180, dataVenda: diasAtras(88), status: 'ativo', proximaAssembleia: diasAFrente(8, 19), pretendeLance: 'talvez', indicacaoPedidaEm: diasAtras(30) }),
    cliente({ nome: 'Fábio Nogueira', telefone: '34991118383', administradora: 'Consórcio Horizonte', grupo: '3005', cota: '077', tipoBem: 'pesado', valorCarta: 520000, prazoMeses: 120, dataVenda: diasAtras(125), status: 'ativo', proximaAssembleia: diasAFrente(15, 19), pretendeLance: 'sim', valorLance: 150000 }),
    cliente({ nome: 'Marcos Oliveira', telefone: '62992223131', administradora: 'Administradora Alfa', grupo: '0712', cota: '088', tipoBem: 'veiculo', valorCarta: 95000, prazoMeses: 80, dataVenda: diasAtras(160), status: 'contemplado', observacoes: 'Contemplado por lance em agosto. Já retirou o carro.' }),
    cliente({ nome: 'Paulo Siqueira', telefone: '62981119292', administradora: 'Nacional Consórcios', grupo: '2105', cota: '233', tipoBem: 'imovel', valorCarta: 200000, prazoMeses: 180, dataVenda: diasAtras(150), status: 'cancelado', observacoes: 'Cancelou por perda de emprego.' }),
  ];

  await db.substituirTudo('leads', leads);
  await db.substituirTudo('atividades', atividades);
  await db.substituirTudo('tarefas', tarefas);
  await db.substituirTudo('clientes', clientes);
  await db.substituirTudo('simulacoes', simulacoes);
  await db.gravarConfig(CONFIG_PADRAO);
  db.marcarInicializado();
}

export async function inicializarSeNecessario(): Promise<void> {
  if (!db.jaInicializado()) await popularDadosExemplo();
}

export async function exportarTudo(): Promise<string> {
  const [leads, atividades, tarefas, clientes, simulacoes] = await Promise.all([
    db.listar('leads'),
    db.listar('atividades'),
    db.listar('tarefas'),
    db.listar('clientes'),
    db.listar('simulacoes'),
  ]);
  const configuracoes = await db.lerConfig(CONFIG_PADRAO);
  return JSON.stringify({ exportadoEm: new Date().toISOString(), leads, atividades, tarefas, clientes, simulacoes, configuracoes }, null, 2);
}

export async function apagarTudo(): Promise<void> {
  db.limparTudo();
  await db.substituirTudo('leads', []);
  await db.substituirTudo('atividades', []);
  await db.substituirTudo('tarefas', []);
  await db.substituirTudo('clientes', []);
  await db.substituirTudo('simulacoes', []);
  await db.gravarConfig(CONFIG_PADRAO);
  db.marcarInicializado();
}

export async function restaurarExemplo(): Promise<void> {
  db.limparTudo();
  await popularDadosExemplo();
}
