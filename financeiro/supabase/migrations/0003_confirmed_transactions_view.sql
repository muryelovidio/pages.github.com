-- Transações que já passaram pela revisão de importação (ou que nunca
-- passaram por importação). Todas as leituras "reais" da aplicação
-- (dashboard, lista de transações, insights, chat) usam esta view em vez
-- da tabela `transactions` diretamente, para nunca contar dados ainda em
-- revisão (import_batches.status = 'em_revisao').
create or replace view transactions_confirmed
with (security_invoker = true) as
select t.*
from transactions t
left join import_batches b on b.id = t.import_batch_id
where b.id is null or b.status = 'concluido';
