import { createClient } from "@/lib/supabase/server";
import { getCards, getCardInvoiceTotal } from "@/lib/queries";
import PageHeader from "@/components/ui/PageHeader";
import CartoesClient from "./CartoesClient";

export default async function CartoesPage() {
  const supabase = await createClient();
  const cards = await getCards(supabase);

  const invoices = await Promise.all(
    cards.map(async (card) => {
      const invoice = await getCardInvoiceTotal(supabase, card.id, card.closing_day);
      return [card.id, invoice] as const;
    })
  );

  return (
    <div>
      <PageHeader
        title="Cartões"
        description="Cartões de crédito e a fatura do ciclo atual."
      />
      <CartoesClient cards={cards} invoices={Object.fromEntries(invoices)} />
    </div>
  );
}
