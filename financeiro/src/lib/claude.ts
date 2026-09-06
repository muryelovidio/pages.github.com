import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Cliente da API da Claude — só pode ser importado em código server-side
// (Server Actions, Route Handlers). A chave nunca chega ao browser.
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

const SYSTEM_PROMPT = `Você é o assistente financeiro pessoal do usuário, dentro da plataforma "Financeiro".
Você recebe, junto com a pergunta, um resumo estruturado (JSON) com os dados financeiros
relevantes já calculados a partir do banco de dados — nunca o banco inteiro.

Regras obrigatórias:
- Baseie-se SOMENTE nos números presentes no resumo JSON fornecido. Nunca invente, estime ou
  arredonde valores que não estejam explicitamente lá.
- Se a pergunta exigir um dado que não está no resumo, diga claramente que falta essa informação
  em vez de supor um número.
- Seja direto e objetivo, em português do Brasil. Use valores em R$ formatados (ex: R$ 1.234,56).
- Quando fizer sentido, aponte um insight acionável (ex: categoria com maior crescimento de gasto).`;

export interface ChatContext {
  question: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  dataSummary: unknown;
}

export async function askFinanceAssistant({
  question,
  history,
  dataSummary,
}: ChatContext): Promise<string> {
  const contextBlock = `Resumo estruturado dos dados financeiros relevantes para esta pergunta:\n\n${JSON.stringify(
    dataSummary,
    null,
    2
  )}`;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      ...history,
      { role: "user" as const, content: `${contextBlock}\n\nPergunta: ${question}` },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (response.stop_reason === "refusal") {
    return "Não posso responder essa pergunta.";
  }
  return textBlock?.type === "text" ? textBlock.text : "";
}
