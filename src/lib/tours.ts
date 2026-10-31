// Definições dos tutoriais guiados. Cada tour é uma sequência de steps do driver.js.
// O campo `paginaInicio` indica onde o usuário precisa estar para o tour funcionar.

export interface TourDef {
  id:           string
  titulo:       string
  descricao:    string
  icone:        string   // emoji simples
  paginaInicio: string   // pathname onde o tour deve ser executado
  steps: Array<{
    element?: string  // seletor CSS — undefined para popover sem âncora
    titulo:   string
    texto:    string
    lado?:    "top" | "bottom" | "left" | "right"
  }>
}

export const TOURS: TourDef[] = [
  {
    id:           "fracionamento",
    titulo:       "Radar de Fracionamento",
    descricao:    "Entenda como identificar dispensas de objeto repetido que, somadas, passam do teto legal.",
    icone:        "🔍",
    paginaInicio: "/painel",
    steps: [
      {
        titulo: "Dispensas com objeto recorrente",
        texto:  "Fracionamento é dividir uma mesma compra em várias dispensas pequenas para ficar abaixo do teto do art. 75 da Lei 14.133/2021 e evitar o pregão. Como o teto vale por objeto, e não por órgão no ano, esta seção procura objetos que se repetem dentro do mesmo órgão.",
        lado:   "bottom",
      },
      {
        element: "#tour-radar-fracionamento",
        titulo:  "Como o agrupamento é feito",
        texto:   "As dispensas do ano são comparadas entre si pelo texto do objeto. As que se parecem o bastante formam um grupo, e os valores do grupo são somados. Só aparecem aqui os grupos com duas ou mais dispensas cuja soma passa do teto.",
        lado:    "top",
      },
      {
        element: "#tour-radar-explicacao",
        titulo:  "Referência legal",
        texto:   "Os tetos são R$ 57.271,73 para bens e serviços e R$ 114.543,46 para obras, pelo Decreto 11.871/2023. Eles mudam por decreto todo ano — confirme o vigente antes de usar o dado em qualquer decisão.",
        lado:    "bottom",
      },
      {
        element: "#tour-radar-lista",
        titulo:  "Lendo a lista",
        texto:   "Cada linha é um grupo de dispensas semelhantes de um órgão, ordenado pelo valor somado. Vermelho = 300% ou mais do teto; laranja = 150 a 299%; azul = 100 a 149%.",
        lado:    "top",
      },
      {
        element: "#tour-radar-item",
        titulo:  "Antes de concluir",
        texto:   "Recorrência é indício, não irregularidade. Chamada pública da agricultura familiar, compras emergenciais e objetos de natureza diferente com redação parecida aparecem aqui legitimamente. Sempre abra as dispensas no PNCP e confira o objeto real antes de tirar conclusão.",
        lado:    "right",
      },
    ],
  },

  {
    id:           "alertas",
    titulo:       "Alertas por Palavra-chave",
    descricao:    "Crie pesquisas salvas e receba alertas automáticos quando surgirem licitações do seu interesse.",
    icone:        "🔔",
    paginaInicio: "/acompanhamento",
    steps: [
      {
        titulo: "Pesquisas com Alerta",
        texto:  "Na aba Acompanhamento você pode salvar pesquisas personalizadas. Quando uma nova licitação aparecer no banco que bata com os seus critérios, você é notificado automaticamente (diário ou semanal).",
        lado:   "bottom",
      },
      {
        element: "#tour-pesquisas-salvas",
        titulo:  "Seção de Pesquisas Salvas",
        texto:   "Aqui ficam listadas todas as suas pesquisas ativas. O ícone de sino indica se a pesquisa está disparando alertas. Você pode pausar ou remover qualquer uma a qualquer momento.",
        lado:    "top",
      },
      {
        element: "#tour-nova-pesquisa-btn",
        titulo:  "Criar uma nova pesquisa",
        texto:   "Clique em \"Nova pesquisa\" para abrir o formulário. Você pode combinar palavra-chave, UF e modalidade em um único alerta.",
        lado:    "bottom",
      },
      {
        element: "#tour-campo-nome",
        titulo:  "Nome da pesquisa",
        texto:   "Dê um nome descritivo, como \"TI em SP\" ou \"Obras SP – pregão\". Esse nome aparece na lista para você identificar rapidamente.",
        lado:    "right",
      },
      {
        element: "#tour-campo-q",
        titulo:  "Palavra-chave no objeto",
        texto:   "Digite termos que devem aparecer no objeto da licitação. Exemplo: \"desenvolvimento de software\", \"consultoria jurídica\", \"câmeras de segurança\". Múltiplas palavras funcionam como AND.",
        lado:    "right",
      },
    ],
  },

  {
    id:           "contratos-vencendo",
    titulo:       "Contratos Vencendo",
    descricao:    "Configure o CNPJ do seu órgão e monitore contratos prestes a vencer nos próximos 30, 60 ou 90 dias.",
    icone:        "📅",
    paginaInicio: "/painel",
    steps: [
      {
        titulo: "Contratos Vencendo",
        texto:  "Esta seção do Painel mostra os contratos do seu órgão que estão perto do vencimento. Para funcionar, você precisa configurar o CNPJ do seu órgão no perfil.",
        lado:   "bottom",
      },
      {
        element: "#tour-contratos-vencendo",
        titulo:  "Seção de Contratos",
        texto:   "Aqui aparecem os contratos ordenados por data de vencimento. Vermelho = vence em até 15 dias; laranja = até 30 dias; verde = mais tempo. O dado vem diretamente do PNCP em tempo real.",
        lado:    "top",
      },
      {
        element: "#tour-contratos-vencendo",
        titulo:  "Como configurar",
        texto:   "Se esta seção exibir uma mensagem pedindo para configurar o perfil, clique em \"Configurar perfil\", informe o CNPJ de 14 dígitos do seu órgão e salve. Em seguida volte ao Painel e clique em \"Consultar PNCP\".",
        lado:    "top",
      },
    ],
  },
]

export function getTour(id: string): TourDef | undefined {
  return TOURS.find((t) => t.id === id)
}
