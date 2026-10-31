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
    descricao:    "Entenda como identificar órgãos que podem estar fracionando compras para driblar o pregão.",
    icone:        "🔍",
    paginaInicio: "/painel",
    steps: [
      {
        titulo: "Radar de Fracionamento",
        texto:  "Esta seção do Painel BI monitora o acúmulo de dispensas de licitação (art. 75 da Lei 14.133/2021) por órgão. Fracionamento é quando um órgão divide uma compra em várias dispensas pequenas para ficar abaixo do teto e evitar o pregão.",
        lado:   "bottom",
      },
      {
        element: "#tour-radar-fracionamento",
        titulo:  "O que é monitorado",
        texto:   "Aqui você vê todos os órgãos que publicaram dispensas este ano. O total acumulado é comparado com os tetos do art. 75: R$ 57.271,73 para bens/serviços e R$ 114.543,46 para obras (Decreto 11.871/2023).",
        lado:    "top",
      },
      {
        element: "#tour-radar-explicacao",
        titulo:  "Referência legal",
        texto:   "Os valores do teto são atualizados anualmente por decreto. Sempre confirme o decreto vigente antes de tomar decisões com base nesses dados.",
        lado:    "bottom",
      },
      {
        element: "#tour-radar-lista",
        titulo:  "Lista de órgãos monitorados",
        texto:   "Cada linha representa um órgão. A barra mostra qual percentual do teto já foi consumido no ano. Vermelho = atingiu ou ultrapassou o teto; laranja = 80–99%; azul = 60–79%.",
        lado:    "top",
      },
      {
        element: "#tour-radar-item",
        titulo:  "Lendo um item",
        texto:   "O item mostra: razão social do órgão, percentual consumido, número de dispensas, valor total acumulado e o limite. Clique nos outros cards do painel para mais contexto sobre o órgão.",
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
