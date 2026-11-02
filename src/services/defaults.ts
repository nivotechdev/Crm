import type { Configuracoes } from '../types';

export const CONFIG_PADRAO: Configuracoes = {
  nomeVendedor: '',
  metaDiaria: 30,
  amareloAteDias: 2,
  laranjaAteDias: 6,
  autoAvancarLeadNovo: true,
  etapas: [
    { id: 'novo', nome: 'Lead novo', tipo: 'aberta', cor: 'slate' },
    { id: 'contato', nome: 'Contato feito', tipo: 'aberta', cor: 'sky' },
    { id: 'diagnostico', nome: 'Diagnóstico', tipo: 'aberta', cor: 'indigo' },
    { id: 'reuniao', nome: 'Reunião agendada', tipo: 'aberta', cor: 'violet' },
    { id: 'simulacao', nome: 'Simulação enviada', tipo: 'aberta', cor: 'fuchsia' },
    { id: 'negociacao', nome: 'Negociação', tipo: 'aberta', cor: 'amber' },
    { id: 'ganho', nome: 'Fechado (ganho)', tipo: 'ganho', cor: 'emerald' },
    { id: 'perdido', nome: 'Perdido', tipo: 'perdido', cor: 'rose' },
  ],
  origens: ['Indicação', 'Instagram', 'Tráfego pago', 'Lista fria', 'Cliente antigo', 'Evento', 'Outro'],
  modelos: [
    {
      id: 'm-primeiro',
      nome: 'Primeiro contato',
      texto:
        'Olá, {primeiroNome}! Tudo bem? Aqui é {vendedor}, especialista em consórcio. Vi seu interesse em {objetivo} e queria entender melhor o seu objetivo para te mostrar as melhores opções. Posso te ligar rapidinho?',
    },
    {
      id: 'm-followup',
      nome: 'Follow-up',
      texto:
        'Oi, {primeiroNome}! Passando para saber se conseguiu pensar sobre o consórcio. Ficou alguma dúvida que eu possa esclarecer?',
    },
    {
      id: 'm-simulacao',
      nome: 'Envio de simulação',
      texto:
        '{primeiroNome}, conforme conversamos, preparei uma simulação para uma carta de {valor}. Posso te explicar os detalhes por aqui ou prefere uma ligação rápida?',
    },
    {
      id: 'm-indicacao',
      nome: 'Pedido de indicação',
      texto:
        'Oi, {primeiroNome}! Obrigado pela confiança. Você conhece alguém que também esteja planejando comprar um imóvel ou veículo? Uma indicação sua me ajuda muito! 🙏',
    },
    {
      id: 'm-assembleia',
      nome: 'Lembrete de assembleia',
      texto:
        'Olá, {primeiroNome}! Lembrando que a próxima assembleia do seu grupo está chegando. Quer conversar sobre estratégia de lance?',
    },
  ],
};
