import { PromptItem, PromptCategory, extractPromptVariables } from "../types/prompt"
import { db, isFirebaseConfigured } from "../lib/firebase"
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from "firebase/firestore"

const LOCAL_STORAGE_KEYS = {
  PROMPTS: "grupo_sj_prompts_v2",
  CATEGORIES: "grupo_sj_prompt_categories_v2",
}

// ── Categorias Padrão ─────────────────────────────────────────────────────────

export const DEFAULT_PROMPT_CATEGORIES: PromptCategory[] = [
  {
    id: "cat_ecommerce",
    name: "E-commerce & Anúncios",
    color: "#e8451f",
    description: "Títulos, fichas técnicas e copy de alta conversão para Mercado Livre e Shopee",
  },
  {
    id: "cat_criativos",
    name: "Criativos & Imagens",
    color: "#8b5cf6",
    description: "Prompts para geração de fotos de produto, mockups e banners no estilo Maximper",
  },
  {
    id: "cat_atendimento",
    name: "Atendimento & SAC",
    color: "#10b981",
    description: "Respostas humanizadas e profissionais para dúvidas, reclamações e pós-venda",
  },
  {
    id: "cat_copywriting",
    name: "Copywriting & Vendas",
    color: "#f59e0b",
    description: "Textos persuasivos, argumentos de venda e quebra de objeções",
  },
  {
    id: "cat_video",
    name: "Vídeos & TikTok Shop",
    color: "#ec4899",
    description: "Roteiros dinâmicos para vídeos curtos, Reels e TikTok",
  },
  {
    id: "cat_seo",
    name: "SEO & Palavras-chave",
    color: "#06b6d4",
    description: "Pesquisa de termos de busca, sinônimos e indexação de produtos",
  },
]

// ── Prompts Iniciais / Padrão do Grupo SJ & Maximper ─────────────────────────

export const DEFAULT_PROMPTS: PromptItem[] = [
  {
    id: "prompt_ml_title_master",
    title: "Criador de Título Perfeito para Mercado Livre (60 Caracteres)",
    category: "E-commerce & Anúncios",
    description: "Gera 5 opções de títulos otimizados para o algoritmo do Mercado Livre com exatamente até 60 caracteres.",
    content: `Aja como um especialista sênior em SEO para Mercado Livre Brasil.
Crie 5 opções de títulos altamente persuasivos e otimizados para o seguinte produto:

Produto: {produto}
Marca: {marca}
Material / Diferencial principal: {diferencial}
Público-alvo / Aplicação: {aplicacao}

Regras obrigatórias:
1. Máximo rigoroso de 60 caracteres por título (sem contar quebra de linha).
2. Estrutura recomendada: [Nome do Produto] + [Modelo/Marca] + [Característica Chave] + [Benefício ou Quantidade].
3. Sem palavras proibidas (ex: "melhor", "barato", "promocao", pontuações excessivas).
4. Forneça a contagem exata de caracteres ao lado de cada opção.`,
    tags: ["Mercado Livre", "SEO", "Título", "Conversão"],
    isFavorite: true,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: "prompt_maximper_image_gen",
    title: "Gerador de Imagem de Produto - Estilo Maximper Studio",
    category: "Criativos & Imagens",
    description: "Prompt detalhado para gerar imagem fotográfica profissional de produto com a identidade visual Maximper.",
    content: `Commercial product photography of {produto_maximper}, clean modern Brazilian home environment background, subtle orange accents (#FF7900), premium matte black and brushed stainless steel materials, soft studio lighting with gentle highlights, 8k resolution, photorealistic, sharp focus, depth of field, high-end catalog look, no text watermark.`,
    tags: ["Maximper", "Foto de Produto", "Mockup", "Midjourney/DALL-E"],
    isFavorite: true,
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
  },
  {
    id: "prompt_shopee_description",
    title: "Descrição Completa e Escaneável para Shopee / Mercado Livre",
    category: "E-commerce & Anúncios",
    description: "Gera descrição estruturada com emojis, benefícios, especificações técnicas e perguntas frequentes.",
    content: `Você é um copywriter profissional especializado em e-commerce e marketplaces.
Elabore uma descrição completa, atrativa e formatada para o produto:

Nome do Produto: {produto}
Marca: {marca}
Principais Benefícios: {beneficios}
Dimensões / Ficha Técnica: {especificacoes}
Garantia: {garantia}

Estruture a resposta com:
1. Gancho persuasivo inicial (dor e solução).
2. 5 Vantagens e Benefícios exclusivos (com bullet points e emojis elegantes).
3. Ficha Técnica detalhada e clara.
4. O que acompanha a embalagem.
5. Perguntas Frequentes (FAQ) com 3 dúvidas comuns.
6. CTA de compra rápida e aviso de pronta entrega e nota fiscal.`,
    tags: ["Descrição", "Shopee", "Mercado Livre", "Ficha Técnica"],
    isFavorite: false,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: "prompt_sac_reclamacao",
    title: "Resposta Humanizada e Empática para Reclamação / Atraso SAC",
    category: "Atendimento & SAC",
    description: "Mensagem cordial e resolutiva para acalmar o cliente e solucionar problemas de envio ou defeito.",
    content: `Você é o analista sênior de atendimento ao cliente do Grupo SJ.
Escreva uma resposta educada, empática e prestativa para a seguinte situação:

Nome do Cliente: {nome_cliente}
Problema relatado: {problema}
Número do Pedido: {numero_pedido}
Canal: {canal_venda}

Tom de voz:
- Calmo, acolhedor, transparente e resolutivo.
- Peça desculpas pelo transtorno e ofereça uma solução imediata ou prazo claro de acompanhamento.
- Reforce nosso compromisso com a satisfação do cliente.`,
    tags: ["SAC", "Atendimento", "WhatsApp", "Pós-venda"],
    isFavorite: true,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: "prompt_tiktok_script",
    title: "Roteiro de 30s para Vídeo Viral no TikTok Shop / Reels",
    category: "Vídeos & TikTok Shop",
    description: "Roteiro dinâmico com gancho de 3 segundos, demonstração do produto e chamada irresistível para o carrinho.",
    content: `Crie um roteiro dinâmico e viral de 30 a 45 segundos para TikTok / Instagram Reels sobre o produto:

Produto: {produto}
Grande diferencial ou truque ("hack"): {diferencial}
Preço ou Oferta: {preco_oferta}

Formato:
- [00-03s] Gancho visual e sonoro forte (prende a atenção imediatamente e cria curiosidade).
- [04-18s] Demonstração prática do problema sendo resolvido na prática (estilo 'unboxing' ou 'antes e depois').
- [19-28s] Benefícios rápidos + close na qualidade do produto.
- [29-35s] CTA direto para clicar no link da bio ou na sacolinha laranja do TikTok.`,
    tags: ["TikTok", "Reels", "Vídeo", "Roteiro"],
    isFavorite: false,
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
  },
]

// ── Funções de Armazenamento Local ──────────────────────────────────────────

export function getStoredCategories(): PromptCategory[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.CATEGORIES)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (e) {
    console.warn("Erro ao ler categorias do localStorage:", e)
  }
  return DEFAULT_PROMPT_CATEGORIES
}

export function saveStoredCategories(categories: PromptCategory[]) {
  try {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.CATEGORIES,
      JSON.stringify(categories),
    )
  } catch (e) {
    console.error("Erro ao salvar categorias no localStorage:", e)
  }
}

export function getStoredPrompts(): PromptItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.PROMPTS)
    if (raw) {
      const parsed: PromptItem[] = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p) => ({
          ...p,
          variables: p.variables || extractPromptVariables(p.content),
        }))
      }
    }
  } catch (e) {
    console.warn("Erro ao ler prompts do localStorage:", e)
  }

  // Se não existir, popula com os padrões
  const initial = DEFAULT_PROMPTS.map((p) => ({
    ...p,
    variables: extractPromptVariables(p.content),
  }))
  saveStoredPrompts(initial)
  return initial
}

export function saveStoredPrompts(prompts: PromptItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.PROMPTS, JSON.stringify(prompts))
  } catch (e) {
    console.error("Erro ao salvar prompts no localStorage:", e)
  }
}

// ── Sincronização com Firebase Firestore ─────────────────────────────────────

export async function getPromptsFromFirebase(): Promise<PromptItem[]> {
  if (!db || !isFirebaseConfigured) {
    return getStoredPrompts()
  }

  try {
    const snap = await getDocs(collection(db, "prompts"))
    if (snap.empty) {
      // Se a coleção estiver vazia no Firebase, salva os locais
      const local = getStoredPrompts()
      for (const item of local) {
        await savePromptToFirebase(item)
      }
      return local
    }

    const firebasePrompts: PromptItem[] = []
    snap.forEach((docSnap) => {
      const data = docSnap.data() as any
      firebasePrompts.push({
        id: docSnap.id,
        title: data.title || "Sem título",
        category: data.category || "Geral",
        description: data.description || "",
        content: data.content || "",
        tags: Array.isArray(data.tags) ? data.tags : [],
        variables: data.variables || extractPromptVariables(data.content || ""),
        isFavorite: !!data.isFavorite,
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
        author: data.author || "",
      })
    })

    // Ordenar por favoritos e depois por data de atualização
    firebasePrompts.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1
      if (!a.isFavorite && b.isFavorite) return 1
      return b.updatedAt - a.updatedAt
    })

    // Atualiza backup local
    saveStoredPrompts(firebasePrompts)
    return firebasePrompts
  } catch (e) {
    console.warn("Erro ao buscar prompts do Firebase, usando local:", e)
    return getStoredPrompts()
  }
}

export async function savePromptToFirebase(prompt: PromptItem): Promise<void> {
  // Salva no local primeiro
  const local = getStoredPrompts()
  const idx = local.findIndex((p) => p.id === prompt.id)
  const itemToSave = {
    ...prompt,
    variables: extractPromptVariables(prompt.content),
    updatedAt: Date.now(),
  }

  if (idx >= 0) {
    local[idx] = itemToSave
  } else {
    local.unshift(itemToSave)
  }
  saveStoredPrompts(local)

  // Sincroniza com Firebase se disponível
  if (db && isFirebaseConfigured) {
    try {
      const promptDocRef = doc(db, "prompts", itemToSave.id)
      await setDoc(promptDocRef, itemToSave, { merge: true })
    } catch (e) {
      console.warn("Aviso: Falha ao salvar prompt no Firebase:", e)
    }
  }
}

export async function deletePromptFromFirebase(promptId: string): Promise<void> {
  // Deleta local
  const local = getStoredPrompts().filter((p) => p.id !== promptId)
  saveStoredPrompts(local)

  // Deleta do Firebase
  if (db && isFirebaseConfigured) {
    try {
      await deleteDoc(doc(db, "prompts", promptId))
    } catch (e) {
      console.warn("Aviso: Falha ao deletar prompt no Firebase:", e)
    }
  }
}

// ── Exportação e Importação ──────────────────────────────────────────────────

export function exportPromptsToJson(prompts: PromptItem[]): string {
  return JSON.stringify(prompts, null, 2)
}

export function importPromptsFromJson(jsonString: string): PromptItem[] {
  try {
    const parsed = JSON.parse(jsonString)
    if (!Array.isArray(parsed)) {
      throw new Error("O arquivo não contém uma lista válida de prompts.")
    }
    const validPrompts: PromptItem[] = parsed.map((item, idx) => ({
      id: item.id || `prompt_imported_${Date.now()}_${idx}`,
      title: item.title || `Prompt Importado ${idx + 1}`,
      category: item.category || "Geral",
      description: item.description || "",
      content: item.content || "",
      tags: Array.isArray(item.tags) ? item.tags : [],
      variables: extractPromptVariables(item.content || ""),
      isFavorite: !!item.isFavorite,
      createdAt: item.createdAt || Date.now(),
      updatedAt: Date.now(),
    }))

    return validPrompts
  } catch (e: any) {
    throw new Error("Erro ao importar prompts: " + (e?.message || "Formato inválido"))
  }
}
