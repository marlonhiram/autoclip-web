import { createClient } from '@supabase/supabase-js';

/**
 * Cliente único do Supabase, usado por toda a aplicação frontend.
 *
 * Por que centralizado aqui: evita que cada componente crie sua própria
 * conexão (desperdício de recurso) e garante que, se a forma de
 * autenticação mudar no futuro (ex: adicionar login de usuário), só
 * precisa alterar este arquivo.
 *
 * As variáveis vêm de .env.local (nunca comitar esse arquivo no Git).
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis de ambiente do Supabase não configuradas. ' +
    'Verifique se .env.local existe e contém NEXT_PUBLIC_SUPABASE_URL ' +
    'e NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);