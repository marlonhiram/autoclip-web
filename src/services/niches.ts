import { supabase } from '@/lib/supabase';
import type { Niche } from '@/types/database';

/**
 * Camada de serviço para a tabela `niches`.
 *
 * Por que isso é separado dos componentes: nenhum componente de UI
 * deve chamar `supabase` diretamente (regra de modularização — item 3
 * do prompt do Arquiteto). Se amanhã a forma de buscar dado mudar
 * (ex: trocar Supabase por outra coisa, adicionar cache), só este
 * arquivo muda — nenhum componente precisa ser tocado.
 *
 * Todo método aqui segue a regra "proibido falhar silenciosamente":
 * nunca retorna undefined sem explicação, sempre lança erro com
 * mensagem clara para a camada de UI decidir como exibir ao usuário.
 */

/**
 * Busca todos os nichos cadastrados, ordenados por data de criação
 * (mais recentes primeiro).
 *
 * @returns Lista de nichos.
 * @throws Error com mensagem descritiva se a consulta falhar.
 */
export async function listNiches(): Promise<Niche[]> {
  const { data, error } = await supabase
    .from('niches')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Falha ao buscar nichos: ${error.message}`);
  }

  return data;
}

/**
 * Cria um novo nicho.
 *
 * @param name Nome do nicho (ex: "Finanças", "Games").
 * @returns O nicho recém-criado, incluindo id e created_at gerados
 *          pelo banco.
 * @throws Error com mensagem descritiva se a inserção falhar (ex:
 *         nome vazio, problema de conexão).
 */
export async function createNiche(name: string): Promise<Niche> {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error('Nome do nicho não pode ser vazio.');
  }

  const { data, error } = await supabase
    .from('niches')
    .insert({ name: trimmedName })
    .select()
    .single();

  if (error) {
    throw new Error(`Falha ao criar nicho: ${error.message}`);
  }

  return data;
}

/**
 * Remove um nicho pelo id.
 *
 * ATENÇÃO: como `targets.niche_id` referencia `niches.id` sem
 * `ON DELETE CASCADE` definido na migração, tentar excluir um nicho
 * que já tenha targets vinculados vai falhar no banco — isso é
 * comportamento intencional (evita exclusão acidental em cascata sem
 * aviso), não um bug.
 *
 * @param id UUID do nicho a ser removido.
 * @throws Error com mensagem descritiva se a exclusão falhar.
 */
export async function deleteNiche(id: string): Promise<void> {
  const { error } = await supabase.from('niches').delete().eq('id', id);

  if (error) {
    throw new Error(
      `Falha ao remover nicho: ${error.message}. ` +
      `Verifique se não há canais (targets) ainda vinculados a ele.`
    );
  }
}