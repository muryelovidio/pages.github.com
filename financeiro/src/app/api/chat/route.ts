import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildChatDataSummary } from "@/lib/chatContext";
import { askFinanceAssistant } from "@/lib/claude";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const question = typeof body?.message === "string" ? body.message.trim() : "";
  if (!question) {
    return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
  }

  const history = Array.isArray(body?.history)
    ? body.history
        .filter(
          (m: unknown): m is { role: "user" | "assistant"; content: string } =>
            typeof m === "object" &&
            m !== null &&
            "role" in m &&
            "content" in m &&
            ((m as { role: unknown }).role === "user" ||
              (m as { role: unknown }).role === "assistant") &&
            typeof (m as { content: unknown }).content === "string"
        )
        .slice(-10)
    : [];

  let reply: string;
  try {
    const dataSummary = await buildChatDataSummary(supabase);
    reply = await askFinanceAssistant({ question, history, dataSummary });
  } catch (error) {
    console.error("Erro no assistente financeiro:", error);
    return NextResponse.json(
      { error: "Não foi possível consultar o assistente agora." },
      { status: 502 }
    );
  }

  await supabase.from("chat_messages").insert([
    { user_id: user.id, role: "user", content: question },
    { user_id: user.id, role: "assistant", content: reply },
  ]);

  return NextResponse.json({ reply });
}
