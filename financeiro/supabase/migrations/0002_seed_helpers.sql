-- Funções auxiliares: categorias padrão para um novo usuário e limpeza dos dados demo.

create or replace function public.create_default_categories(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into categories (user_id, name, icon, color, is_default)
  values
    (p_user_id, 'Alimentação', 'utensils', '#F97316', true),
    (p_user_id, 'Transporte', 'car', '#3B82F6', true),
    (p_user_id, 'Moradia', 'home', '#8B5CF6', true),
    (p_user_id, 'Saúde', 'heart-pulse', '#EF4444', true),
    (p_user_id, 'Lazer', 'popcorn', '#EC4899', true),
    (p_user_id, 'Compras', 'shopping-bag', '#F59E0B', true),
    (p_user_id, 'Educação', 'graduation-cap', '#06B6D4', true),
    (p_user_id, 'Assinaturas', 'repeat', '#6366F1', true),
    (p_user_id, 'Salário', 'banknote', '#10B981', true),
    (p_user_id, 'Outros', 'more-horizontal', '#6B7280', true)
  on conflict do nothing;
end;
$$;

-- Chamada automaticamente quando um novo usuário se cadastra.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.create_default_categories(new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Remove todos os dados de demonstração do usuário atual (mantém categorias padrão e dados reais).
create or replace function public.clear_demo_data()
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from transactions where user_id = auth.uid() and is_demo = true;
  delete from commitments where user_id = auth.uid() and is_demo = true;
  delete from goals where user_id = auth.uid() and is_demo = true;
  delete from cards where user_id = auth.uid() and is_demo = true;
  delete from accounts where user_id = auth.uid() and is_demo = true;
end;
$$;
