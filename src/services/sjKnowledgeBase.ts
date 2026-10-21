/**
 * BASE DE CONHECIMENTO OFICIAL – LOJA SJ
 * Configurações, catálogo de produtos, regras de atendimento e detecção de intenções.
 */

export interface KnowledgeResponse {
  text: string
  chips?: { label: string; actionId?: string; url?: string; payload?: any }[]
  intent?: "buy_intent" | "quote_intent" | "delivery_intent" | "human_intent" | "product_info" | "general_faq" | "unknown"
  autoTransfer?: boolean
  transferType?: "compra" | "orcamento" | "entrega" | "atendente" | "geral"
}

export const SJ_STORE_INFO = {
  name: "Loja SJ",
  address: "Av. Portugal, 6759 - Zona I-A, Umuarama - PR",
  workingHours: "Das 09h às 17h",
  phoneDisplay: "(44) 99915-9415",
  rawPhone: "5544999159415",
  deliveryFee: 15.0,
  deliveryFeeDisplay: "R$ 15,00",
}

export function buildWhatsAppLink(message?: string): string {
  const base = `https://wa.me/${SJ_STORE_INFO.rawPhone}`
  if (!message) return base
  return `${base}?text=${encodeURIComponent(message)}`
}

export function buildProductWhatsAppLink(
  productName: string,
  actionType: "compra" | "orcamento" | "duvida" | "entrega" = "compra",
): string {
  let msg = `Olá! Vim pelo site da Loja SJ.`
  if (actionType === "orcamento") {
    msg = `Olá! Vim pelo site da Loja SJ e gostaria de solicitar um orçamento para o produto: *${productName}*.`
  } else if (actionType === "entrega") {
    msg = `Olá! Vim pelo site da Loja SJ e gostaria de programar uma entrega para o produto: *${productName}*.`
  } else if (actionType === "duvida") {
    msg = `Olá! Vim pelo site da Loja SJ e gostaria de tirar dúvidas sobre o produto: *${productName}*.`
  } else {
    msg = `Olá! Vim pelo site da Loja SJ e gostaria de finalizar a compra do produto: *${productName}*.`
  }
  return buildWhatsAppLink(msg)
}

export const WA_LINKS = {
  vendasGeral: buildWhatsAppLink(),
  falarComVendedor: buildWhatsAppLink(
    "Olá! Vim pelo site da Loja SJ e gostaria de falar com um atendente",
  ),
  solicitarOrcamento: buildWhatsAppLink(
    "Olá! Vim pelo site da Loja SJ e gostaria de solicitar um orçamento",
  ),
  finalizarCompra: buildWhatsAppLink(
    "Olá! Vim pelo site da Loja SJ e gostaria de finalizar uma compra",
  ),
  programarEntrega: buildWhatsAppLink(
    "Olá! Vim pelo site da Loja SJ e gostaria de programar uma entrega",
  ),
  produto: (
    productName: string,
    actionType: "compra" | "orcamento" | "duvida" | "entrega" = "compra",
  ) => buildProductWhatsAppLink(productName, actionType),
  catalogoCoresFilamento: (marca?: "Bambu Lab" | "Maxprint" | "todas") => {
    const brandText =
      marca === "Bambu Lab"
        ? " da Bambu Lab"
        : marca === "Maxprint"
          ? " da Maxprint"
          : " (Maxprint e Bambu Lab)"
    return buildWhatsAppLink(
      `Olá! Vim pelo site da Loja SJ e gostaria de ver as cores disponíveis de filamento${brandText}. Quais cores vocês têm em estoque hoje?`,
    )
  },
  customLead: (data: {
    name?: string
    product?: string
    quantity?: string
    modalidade?: string
    bairro?: string
    observacao?: string
  }) => {
    let msg = `Olá! Vim pelo site da Loja SJ.`
    if (data.name) msg += `\nMeu nome é: ${data.name}`
    if (data.product) msg += `\nProduto: ${data.product}`
    if (data.quantity) msg += `\nQuantidade: ${data.quantity}`
    if (data.modalidade) msg += `\nEntrega ou retirada: ${data.modalidade}`
    if (data.bairro) msg += `\nBairro: ${data.bairro}`
    if (data.observacao) msg += `\nObservação: ${data.observacao}`
    msg += `\nGostaria de continuar meu atendimento e finalizar o pedido.`
    return buildWhatsAppLink(msg)
  },
}

// ── Catálogo de Produtos da Loja SJ ──────────────────────────────────────────

export const SJ_CATALOG = {
  maximper: {
    brand: "Maximper",
    products: [
      {
        id: "trava_pedras",
        name: "Trava Pedras Maximper",
        packages: ["1 litro", "5 litros", "18 litros"],
        purpose:
          "Produto destinado a auxiliar na fixação e estabilização de pedras decorativas soltas em jardins, canteiros, caminhos, corredores e áreas decorativas.",
        importantNote:
          "O Trava Pedras não é impermeabilizante da base; sua principal função é estabilizar e unir as pedras.",
        reference:
          "Para 5 litros, uma referência é aproximadamente 3 a 5 sacos de 25 kg de pedras secas (varia conforme tamanho e tipo).",
      },
      {
        id: "lona_liquida",
        name: "Lona Líquida Maximper",
        packages: ["1 litro", "5 litros"],
        purpose:
          "Produto destinado à proteção e impermeabilização de superfícies compatíveis, formando uma película protetora após aplicação e secagem.",
        rule: "Para confirmar a compatibilidade com superfícies específicas não cadastradas, consulte o setor de vendas.",
      },
      {
        id: "tinta_piso_emborrachada",
        name: "Tinta para Piso Emborrachada Premium Maximper",
        packages: ["3,6 kg", "16 kg"],
        purpose:
          "Pintura e proteção de pisos compatíveis em áreas externas, com acabamento emborrachado e característica antiderrapante.",
        reference:
          "Rendimento de 16 kg: até aproximadamente 90 m² por demão como referência (varia com a porosidade, absorção e aplicação).",
      },
      {
        id: "manta_vp50",
        name: "Manta Estrutural VP50 Maximper",
        material: "100% poliéster",
        purpose:
          "Reforço estrutural em sistemas de impermeabilização (emendas, fissuras, cantos e áreas críticas). Usada em conjunto com impermeabilizante compatível.",
      },
      {
        id: "aplicador_triangular",
        name: "Aplicador Triangular Maximper",
        purpose:
          "Desenvolvido para facilitar e uniformizar a aplicação da Argamassa Polimérica Cola Bloco. Vendido avulso ou em kits.",
      },
    ],
  },
  blindamix: {
    brand: "Blindamix",
    products: [
      {
        id: "tinta_emborrachada_blindamix",
        name: "Tinta Emborrachada Blindamix",
        packages: ["1 kg", "3,6 kg", "18 kg"],
        purpose:
          "Proteção e impermeabilização elástica para paredes, lajes, telhas, marquises, calhas, alvenaria e concreto.",
      },
      {
        id: "kit_blindamix_vp50",
        name: "Kit Blindamix 18 kg + Manta Estrutural VP50",
        purpose:
          "Combina impermeabilização, proteção e reforço estrutural para lajes e áreas expostas.",
      },
      {
        id: "acqua_protect",
        name: "Acqua Protect Blindamix",
        purpose:
          "Impermeabilização desenvolvida especificamente para piscinas de alvenaria.",
        importantNote:
          "NÃO recomendada para piscinas de fibra. Indicada exclusivamente para alvenaria.",
      },
    ],
  },
  revgold: {
    brand: "RevGold",
    products: [
      {
        id: "cola_bloco",
        name: "Argamassa Polimérica Cola Bloco RevGold",
        packages: ["6 kg", "15 kg"],
        purpose:
          "Assentamento de tijolos cerâmicos, blocos estruturais, ecológicos, blocos de concreto e celulares.",
        kits: "Disponível também em kits com o Aplicador Triangular Maximper.",
      },
      {
        id: "primer_revgold",
        name: "Primer RevGold",
        packages: ["900 ml"],
        purpose:
          "Preparação e aderência da superfície antes da aplicação da Pedra Natural.",
        reference:
          "Rendimento referência: ~7,5 m² para 900 ml (diluição referência de 15% de água).",
      },
      {
        id: "textura_pedra_natural",
        name: "Textura Pedra Natural RevGold",
        packages: ["5 kg", "20 kg"],
        purpose:
          "Revestimento decorativo mineral para paredes, escadas, corredores, calçadas, jardins e garagens.",
        reference:
          "Rendimento 20 kg: aproximadamente 4 a 6 m² como referência.",
      },
      {
        id: "verniz_glitter",
        name: "Verniz Glitter Estrelado RevGold",
        packages: ["900 ml", "3,6 litros"],
        purpose:
          "Acabamento decorativo com efeito de brilho e glitter estrelado.",
      },
      {
        id: "resina_incolor",
        name: "Resina Incolor RevGold",
        packages: ["3,6 kg"],
        purpose: "Proteção e acabamento de superfícies compatíveis.",
      },
    ],
  },
  wurth: {
    brand: "Würth",
    products: [
      "Epóxi Titânio",
      "Fluido de Radiador",
      "Pasta Desengraxante",
      "Espuma Limpadora",
      "Rost Off (Desengripante)",
      "Removedor de Ferrugem",
    ],
  },
  fitama: {
    brand: "Fitama",
    products: ["Fita Transparente Fitama (50 metros)"],
  },
  bambuLab: {
    brand: "Bambu Lab",
    products: [
      "Impressoras 3D (A1, A1 Mini, etc.)",
      "Filamentos Originais Bambu Lab (Ampla variedade de cores)",
      "Peças e componentes de manutenção",
    ],
  },
  maxprint: {
    brand: "Maxprint",
    products: [
      "Filamento PLA Maxprint (Grande variedade e variação de cores)",
    ],
  },
  vumora: {
    brand: "Vumora",
    products: [
      "Porta Toalha",
      "Gancho Simples",
      "Gancho Gato",
      "Porta Escova",
      "Suporte Notebook",
      "Porta Papel Higiênico",
      "Trava Porta Gatinho",
      "Suporte Fechado para Saco de Lixo 18 cm",
      "Suporte Fechado para Saco de Lixo 22 cm (horizontal)",
      "Par de Suportes para Saco de Lixo",
    ],
    colors: ["Preto", "Branco", "Cinza", "Marrom"],
  },
}

// ── Utilitários de Normalização de Texto ─────────────────────────────────────

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// ── Motor de Inteligência e Resposta da Loja SJ ──────────────────────────────

export function querySJKnowledge(userInput: string): KnowledgeResponse {
  const norm = normalizeText(userInput)

  // 1. Verificação de Gatilhos de Intenção de Compra Imediata (Item 46 e 52)
  const buyTriggers = [
    "quero comprar",
    "quero esse",
    "vou querer",
    "quero duas",
    "quero 2",
    "quero 3",
    "pode separar",
    "tem em estoque",
    "quero fechar",
    "como faco para pagar",
    "como pagar",
    "aceita pix",
    "faz orcamento",
    "quanto fica",
    "quero receber em casa",
    "pode entregar",
    "falar com vendedor",
    "falar com atendente",
    "fazer meu pedido",
    "fechar pedido",
    "valor",
    "preco",
    "quanto custa",
    "desconto",
    "tem desconto",
    "pagamento",
  ]

  const hasBuyTrigger = buyTriggers.some((t) => norm.includes(t))

  // 2. Perguntas sobre Endereço e Localização (Item 40)
  if (
    norm.includes("onde fica") ||
    norm.includes("onde voces ficam") ||
    norm.includes("qual o endereco") ||
    norm.includes("onde esta localizada") ||
    norm.includes("localizacao") ||
    norm.includes("qual endereco")
  ) {
    return {
      text: `Estamos na ${SJ_STORE_INFO.address}.\n\nNosso atendimento funciona ${SJ_STORE_INFO.workingHours}. Deseja consultar a disponibilidade de algum produto?`,
      chips: [
        { label: "📍 Chamar no WhatsApp", url: WA_LINKS.falarComVendedor },
        {
          label: "📦 Consultar Estoque para Retirada",
          actionId: "retirada_info",
        },
        { label: "🚚 Como funciona a Entrega?", actionId: "entrega_info" },
      ],
      intent: "general_faq",
    }
  }

  // 3. Perguntas sobre Horário de Funcionamento (Item 41)
  if (
    norm.includes("horario") ||
    norm.includes("que horas") ||
    norm.includes("abrem") ||
    norm.includes("fecha") ||
    norm.includes("funcionamento")
  ) {
    return {
      text: `Nosso atendimento funciona ${SJ_STORE_INFO.workingHours}.\n\nVocê também pode enviar sua mensagem a qualquer momento pelo WhatsApp e nosso setor de vendas dará continuidade!`,
      chips: [
        { label: "💬 Chamar no WhatsApp", url: WA_LINKS.falarComVendedor },
        { label: "⚡ Solicitar Orçamento", url: WA_LINKS.solicitarOrcamento },
      ],
      intent: "general_faq",
    }
  }

  // 4. Perguntas sobre Entrega e Frete Local (Itens 42, 43, 44, 86)
  if (
    norm.includes("entrega") ||
    norm.includes("entregam") ||
    norm.includes("frete") ||
    norm.includes("taxa") ||
    norm.includes("entrega hoje")
  ) {
    if (norm.includes("hoje") || norm.includes("mesmo dia")) {
      return {
        text: `As entregas são programadas conforme disponibilidade. Posso encaminhar você para nosso setor de vendas para verificar a programação para o seu bairro.`,
        chips: [
          {
            label: "🚚 Programar Entrega no WhatsApp",
            url: WA_LINKS.programarEntrega,
          },
          { label: "📍 Informar meu Bairro", actionId: "fluxo_entrega" },
        ],
        intent: "delivery_intent",
        transferType: "entrega",
      }
    }
    return {
      text: `Sim. Temos entrega local programada até a casa do cliente. A taxa padrão é de ${SJ_STORE_INFO.deliveryFeeDisplay}, sujeita à confirmação do endereço.\n\nQual produto você deseja receber e qual é o seu bairro?`,
      chips: [
        { label: "🚚 Programar Entrega", actionId: "fluxo_entrega" },
        { label: "💬 Falar com Vendas", url: WA_LINKS.programarEntrega },
        { label: "🏬 Posso retirar na loja?", actionId: "retirada_info" },
      ],
      intent: "delivery_intent",
    }
  }

  // 5. Perguntas sobre Retirada na Loja (Item 45)
  if (
    norm.includes("retirar") ||
    norm.includes("retirada") ||
    norm.includes("buscar na loja") ||
    norm.includes("posso buscar")
  ) {
    return {
      text: `Sim. Estamos na ${SJ_STORE_INFO.address}.\n\nAntes de vir, recomendamos confirmar a disponibilidade do produto com nosso setor de vendas.`,
      chips: [
        {
          label: "📦 Confirmar Estoque no WhatsApp",
          url: WA_LINKS.falarComVendedor,
        },
        { label: "⚡ Finalizar Compra", url: WA_LINKS.finalizarCompra },
      ],
      intent: "general_faq",
    }
  }

  // 6. Piscina (Item 15 e 60)
  if (norm.includes("piscina")) {
    if (norm.includes("fibra")) {
      return {
        text: `Não recomendamos a Acqua Protect para piscinas de fibra. Ela é destinada a piscinas de alvenaria.\n\nPosso encaminhar você para nosso atendimento para verificar outra solução com nossos especialistas.`,
        chips: [
          {
            label: "💬 Falar com Atendente sobre Piscina",
            url: WA_LINKS.produto(
              "Impermeabilização para Piscina de Fibra",
              "duvida",
            ),
          },
          {
            label: "🛡️ Ver outros Impermeabilizantes",
            actionId: "menu_impermeabilizacao",
          },
        ],
        intent: "product_info",
      }
    }
    return {
      text: `Sim, a Acqua Protect Blindamix foi desenvolvida para piscinas de alvenaria.\n\nSua piscina é de alvenaria ou fibra?`,
      chips: [
        { label: "🏊 Alvenaria", actionId: "piscina_alvenaria" },
        { label: "🏊 Fibra", actionId: "piscina_fibra" },
        {
          label: "SOLICITAR ORÇAMENTO ACQUA PROTECT",
          url: WA_LINKS.produto(
            "Acqua Protect Blindamix (Piscina Alvenaria)",
            "orcamento",
          ),
        },
      ],
      intent: "product_info",
    }
  }

  // 7. Trava Pedras (Item 8)
  if (
    norm.includes("trava pedra") ||
    norm.includes("trava pedras") ||
    norm.includes("pedra solta") ||
    norm.includes("fixar pedra")
  ) {
    return {
      text: `Temos o Trava Pedras Maximper em embalagens de 1L, 5L e 18L. Ele é destinado a fixar e estabilizar pedras decorativas soltas em jardins, canteiros, caminhos e corredores.\n\n*Importante:* Não deve ser utilizado como impermeabilizante de base (sua função é estabilizar as pedras. 5L atende aprox. 3 a 5 sacos de 25 kg de pedras secas como referência).\n\nDeseja verificar a quantidade para sua área?`,
      chips: [
        {
          label: "⚡ Solicitar Orçamento Trava Pedras",
          url: WA_LINKS.produto("Trava Pedras Maximper", "orcamento"),
        },
        {
          label: "💬 Comprar Trava Pedras no WhatsApp",
          url: WA_LINKS.produto("Trava Pedras Maximper", "compra"),
        },
      ],
      intent: "product_info",
    }
  }

  // 8. Lona Líquida (Item 9)
  if (norm.includes("lona liquida") || norm.includes("lona")) {
    return {
      text: `Temos a Lona Líquida Maximper (1L e 5L), destinada à proteção e impermeabilização de superfícies compatíveis, formando película protetora após a secagem.\n\nOnde você pretende aplicar?`,
      chips: [
        {
          label: "⚡ Pedir Cotação de Lona Líquida",
          url: WA_LINKS.produto("Lona Líquida Maximper", "orcamento"),
        },
        {
          label: "💬 Comprar Lona Líquida no WhatsApp",
          url: WA_LINKS.produto("Lona Líquida Maximper", "compra"),
        },
      ],
      intent: "product_info",
    }
  }

  // 9. Tinta Emborrachada e Blindamix (Itens 10, 13, 14)
  if (
    norm.includes("tinta emborrachada") ||
    norm.includes("blindamix") ||
    norm.includes("tinta para piso") ||
    norm.includes("emborrachada")
  ) {
    if (norm.includes("piso")) {
      return {
        text: `Temos a Tinta para Piso Emborrachada Premium Maximper (3,6 kg e 16 kg), antiderrapante e para áreas externas. A de 16 kg rende até aproximadamente 90 m² por demão como referência.\n\nDeseja que eu encaminhe para nosso setor de vendas consultar cores e valores?`,
        chips: [
          {
            label: "💬 Consultar Cores e Valores",
            url: WA_LINKS.produto(
              "Tinta Piso Emborrachada Premium Maximper",
              "duvida",
            ),
          },
          {
            label: "⚡ Solicitar Orçamento",
            url: WA_LINKS.produto(
              "Tinta Piso Emborrachada Premium Maximper",
              "orcamento",
            ),
          },
        ],
        intent: "product_info",
      }
    }
    return {
      text: `Trabalhamos com a Tinta Emborrachada Blindamix (1 kg, 3,6 kg e 18 kg), produto elástico e impermeabilizante para paredes, lajes, telhas, calhas e alvenaria, além do Kit Blindamix 18 kg + Manta VP50.\n\nQual é a área aproximada em metros quadrados?`,
      chips: [
        { label: "🧱 Parede / Muro", actionId: "blindamix_parede" },
        { label: "🏠 Laje / Telhado", actionId: "blindamix_laje" },
        {
          label: "⚡ Orçamento Blindamix no WhatsApp",
          url: WA_LINKS.produto("Tinta Emborrachada Blindamix", "orcamento"),
        },
        {
          label: "🛒 Comprar Blindamix",
          url: WA_LINKS.produto("Tinta Emborrachada Blindamix", "compra"),
        },
      ],
      intent: "product_info",
    }
  }

  // 10. Manta Estrutural VP50 (Item 11)
  if (
    norm.includes("manta") ||
    norm.includes("vp50") ||
    norm.includes("reforco")
  ) {
    return {
      text: `A Manta Estrutural VP50 Maximper (100% poliéster) é utilizada como reforço em emendas, fissuras, cantos e áreas críticas, em conjunto com impermeabilizante compatível.\n\nVocê gostaria de ver o kit completo com Blindamix?`,
      chips: [
        { label: "📦 Ver Kit Blindamix + VP50", actionId: "kit_blindamix" },
        {
          label: "⚡ Solicitar Orçamento Manta VP50",
          url: WA_LINKS.produto("Manta Estrutural VP50 Maximper", "orcamento"),
        },
      ],
      intent: "product_info",
    }
  }

  // 11. Cola Bloco e Argamassa Polimérica (Itens 12, 16, 17, 62)
  if (
    norm.includes("cola bloco") ||
    norm.includes("assentamento") ||
    norm.includes("argamassa polimerica") ||
    norm.includes("tijolo") ||
    norm.includes("bloco")
  ) {
    return {
      text: `Temos Cola Bloco RevGold de 6 kg e 15 kg, além de kits com Aplicador Triangular Maximper. Indicada para tijolos cerâmicos, blocos estruturais, ecológicos e blocos de concreto.\n\nQual tipo de bloco você vai assentar?`,
      chips: [
        { label: "🧱 Bloco Cerâmico / Tijolo", actionId: "bloco_ceramico" },
        {
          label: "🧱 Bloco de Concreto / Estrutural",
          actionId: "bloco_concreto",
        },
        {
          label: "🔺 Ver Aplicador Triangular",
          actionId: "aplicador_triangular",
        },
        {
          label: "⚡ Orçamento Cola Bloco RevGold",
          url: WA_LINKS.produto("Cola Bloco RevGold", "orcamento"),
        },
      ],
      intent: "product_info",
    }
  }

  // 12. Pedra Natural e Texturas RevGold (Itens 18, 19, 20, 61)
  if (
    norm.includes("pedra natural") ||
    norm.includes("textura pedra") ||
    norm.includes("revgold") ||
    norm.includes("primer") ||
    norm.includes("verniz glitter") ||
    norm.includes("resina")
  ) {
    return {
      text: `Temos Textura Pedra Natural RevGold de 5 kg e 20 kg, além de kits com Primer (900 ml), Verniz Glitter Estrelado e Resina Incolor.\n\nQuantos metros quadrados possui aproximadamente sua área?`,
      chips: [
        {
          label: "💎 Kit Pedra Natural + Primer",
          actionId: "kit_pedra_natural",
        },
        { label: "✨ Verniz Glitter / Resina", actionId: "verniz_resina" },
        {
          label: "⚡ Orçamento Pedra Natural no WhatsApp",
          url: WA_LINKS.produto("Textura Pedra Natural RevGold", "orcamento"),
        },
      ],
      intent: "product_info",
    }
  }

  // 13. Würth (Itens 23, 24, 25)
  if (
    norm.includes("wurth") ||
    norm.includes("rost off") ||
    norm.includes("desengripante") ||
    norm.includes("epoxi titanio") ||
    norm.includes("pasta desengraxante") ||
    norm.includes("radiador") ||
    norm.includes("espuma limpadora") ||
    norm.includes("ferrugem")
  ) {
    return {
      text: `Sim. Trabalhamos com diversos produtos Würth para manutenção, limpeza, reparos e uso profissional: Rost Off (desengripante), Epóxi Titânio, Fluido de Radiador, Pasta Desengraxante, Espuma Limpadora e Removedor de Ferrugem.\n\nQual produto você procura?`,
      chips: [
        { label: "🔩 Rost Off Desengripante", actionId: "wurth_rost_off" },
        { label: "🧪 Epóxi Titânio / Químicos", actionId: "wurth_quimicos" },
        {
          label: "💬 Comprar Produtos Würth no WhatsApp",
          url: WA_LINKS.produto("Produtos Würth", "compra"),
        },
      ],
      intent: "product_info",
    }
  }

  // 14.1 Cores de Filamentos (Maxprint & Bambu Lab)
  const isColorKeyword =
    norm.includes("cor") ||
    norm.includes("cores") ||
    norm.includes("qual cor") ||
    norm.includes("quais cores") ||
    norm.includes("catalogo") ||
    norm.includes("tabela") ||
    /\b(preto|branco|cinza|marrom|azul|vermelho|amarelo|verde|laranja|roxo|rosa|dourado|prata|silk)\b/.test(
      norm,
    )

  if (
    isColorKeyword &&
    (norm.includes("filamento") ||
      norm.includes("pla") ||
      norm.includes("petg") ||
      norm.includes("bambu") ||
      norm.includes("maxprint") ||
      norm.includes("impressora 3d") ||
      norm.includes("3d"))
  ) {
    return {
      text: `Trabalhamos com filamentos de alta qualidade das marcas **Maxprint** e **Bambu Lab**! 🧵✨\n\nTemos uma **variação muito grande de cores** em estoque (básicas, especiais, silk, translúcidas e metálicas).\n\nComo o estoque e as opções de cores são muito amplos e dinâmicos, para conferir o catálogo completo com as cores disponíveis hoje, fale diretamente no WhatsApp da loja:`,
      chips: [
        {
          label: "📲 VER CORES DISPONÍVEIS NO WHATSAPP",
          url: WA_LINKS.catalogoCoresFilamento("todas"),
        },
        {
          label: "🧵 Cores Filamento Bambu Lab",
          url: WA_LINKS.catalogoCoresFilamento("Bambu Lab"),
        },
        {
          label: "🧵 Cores Filamento Maxprint",
          url: WA_LINKS.catalogoCoresFilamento("Maxprint"),
        },
        {
          label: "🖨️ Ver Impressoras 3D",
          actionId: "bambu_impressoras",
        },
      ],
      intent: "product_info",
    }
  }

  // 14.2 Impressão 3D e Filamentos em Geral (Itens 27, 28, 29, 63, 64)
  if (
    norm.includes("impressora 3d") ||
    norm.includes("impressao 3d") ||
    norm.includes("bambu lab") ||
    norm.includes("filamento") ||
    norm.includes("maxprint") ||
    norm.includes("pla")
  ) {
    return {
      text: `Sim! Na Loja SJ trabalhamos com impressoras 3D Bambu Lab, peças de manutenção e reposição, e filamentos de alta qualidade das marcas **Maxprint** e **Bambu Lab** com uma ampla variação de cores.\n\nVocê procura uma impressora, filamento ou peças de manutenção?`,
      chips: [
        { label: "🖨️ Impressoras Bambu Lab", actionId: "bambu_impressoras" },
        { label: "🧵 Filamentos (Cores & Marcas)", actionId: "filamentos_cores" },
        { label: "🔧 Peça de Manutenção", actionId: "bambu_pecas" },
        {
          label: "💬 WhatsApp da Loja",
          url: WA_LINKS.produto("Impressão 3D e Filamentos", "duvida"),
        },
      ],
      intent: "product_info",
    }
  }

  // 15. Utilidades e Vumora (Itens 30-39, 65)
  if (
    norm.includes("vumora") ||
    norm.includes("porta toalha") ||
    norm.includes("suporte notebook") ||
    norm.includes("porta escova") ||
    norm.includes("porta papel") ||
    norm.includes("gancho") ||
    norm.includes("gatinho") ||
    norm.includes("saco de lixo") ||
    norm.includes("utilidades")
  ) {
    return {
      text: `Na linha de utilidades Vumora temos: Porta Toalha, Gancho Simples, Gancho Gato, Porta Escova, Suporte Notebook, Porta Papel Higiênico, Trava Porta Gatinho e Suportes para Saco de Lixo (18cm e 22cm), disponíveis em Preto, Branco, Cinza e Marrom.\n\nQual tipo de utilidade você procura?`,
      chips: [
        { label: "🛁 Porta Toalha / Banheiro", actionId: "vumora_banheiro" },
        { label: "💻 Suporte Notebook", actionId: "vumora_notebook" },
        { label: "🗑️ Suportes para Saco de Lixo", actionId: "vumora_lixo" },
        { label: "🐱 Trava Porta Gatinho / Gancho", actionId: "vumora_gato" },
        {
          label: "💬 Comprar Utilidades Vumora",
          url: WA_LINKS.produto("Utilidades Vumora", "compra"),
        },
      ],
      intent: "product_info",
    }
  }

  // 16. Fitama (Item 26)
  if (
    norm.includes("fitama") ||
    norm.includes("fita transparente") ||
    norm.includes("fita")
  ) {
    return {
      text: `Trabalhamos com Fita Transparente Fitama de 50 metros.\n\nDeseja que eu encaminhe você para o setor de vendas verificar disponibilidade e valor?`,
      chips: [
        {
          label: "FINALIZAR COMPRA NO WHATSAPP",
          url: WA_LINKS.produto("Fita Transparente Fitama 50m", "compra"),
        },
        {
          label: "💬 Falar com Vendas",
          url: WA_LINKS.produto("Fita Transparente Fitama 50m", "duvida"),
        },
      ],
      intent: "product_info",
    }
  }

  // 17. Se houver intenção clara de compra (Item 46 e 53)
  if (hasBuyTrigger) {
    return {
      text: `Perfeito! Vou encaminhar você para nosso setor de vendas para confirmar disponibilidade, valor e combinar retirada ou entrega.`,
      chips: [
        {
          label: "FINALIZAR COMPRA NO WHATSAPP",
          url: WA_LINKS.finalizarCompra,
        },
        { label: "SOLICITAR ORÇAMENTO", url: WA_LINKS.solicitarOrcamento },
        { label: "PROGRAMAR ENTREGA", url: WA_LINKS.programarEntrega },
      ],
      intent: "buy_intent",
      autoTransfer: true,
      transferType: "compra",
    }
  }

  // 18. Resposta padrão cordial e comercial
  return {
    text: `Posso ajudar você a encontrar produtos para impermeabilização, pintura, revestimentos, construção, manutenção, impressão 3D e utilidades para casa.\n\nO que você procura hoje?`,
    chips: [
      { label: "FALAR COM VENDAS", url: WA_LINKS.falarComVendedor },
      { label: "SOLICITAR ORÇAMENTO", url: WA_LINKS.solicitarOrcamento },
      { label: "PROGRAMAR ENTREGA", actionId: "entrega_info" },
    ],
    intent: "unknown",
  }
}
