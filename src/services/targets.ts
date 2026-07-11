import { supabase } from '@/lib/supabase';
import type {
  AuthorizationStatus,
  RiskLevel,
  Target,
  TwitchAccountType,
} from '@/types/database';

/**
 * Camada de serviço para a tabela `targets` (canais/streamers
 * monitorados). Mesmo padrão de `services/niches.ts`: nenhum
 * componente de UI chama `supabase` diretamente, nenhum método falha
 * silenciosamente.
 */

export interface CreateTargetInput {
  niche_id: string;
  name: string;
  url: string;
  platform: string;
  risk_level?: RiskLevel;
  authorization_status?: AuthorizationStatus;
  authorization_note?: string;
  twitch_account_type?: TwitchAccountType;
}

/**
 * Busca todos os targets cadastrados, ordenados por data de criação
 * (mais recentes primeiro).
 *
 * @returns Lista de targets.
 * @throws Error com mensagem descritiva se a consulta falhar.
 */
export async function listTargets(): Promise<Target[]> {
  const { data, error } = await supabase
    .from('targets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Falha ao buscar canais: ${error.message}`);
  }

  return data;
}

/**
 * Cria um novo target vinculado a um nicho.
 *
 * `risk_level` e `authorization_status` são campos informativos
 * (ver DEC-DB-001) — nunca bloqueiam o cadastro. Quando omitidos,
 * assumem os valores mais conservadores: risco baixo e autorização
 * "não solicitada".
 *
 * @param input Dados do target a ser criado.
 * @returns O target recém-criado.
 * @throws Error com mensagem descritiva se algum campo obrigatório
 *         estiver vazio ou se a inserção falhar.
 */
export async function createTarget(input: CreateTargetInput): Promise<Target> {
  const name = input.name.trim();
  const url = input.url.trim();
  const platform = input.platform.trim();

    if (!name) throw new Error('Nome do canal não pode ser vazio.');
    if (!url) throw new Error('URL do canal não pode ser vazia.');
    if (!/^https?:\/\//i.test(url)) {
    throw new Error('URL do canal deve começar com http:// ou https://.');
    }
    if (!platform) throw new Error('Plataforma não pode ser vazia.');
    if (!input.niche_id) throw new Error('Selecione um nicho antes de salvar.');


  const { data, error } = await supabase
    .from('targets')
    .insert({
      niche_id: input.niche_id,
      name,
      url,
      platform,
      risk_level: input.risk_level ?? 'low',
      authorization_status: input.authorization_status ?? 'not_requested',
      authorization_note: input.authorization_note?.trim() || null,
      twitch_account_type: input.twitch_account_type ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Falha ao criar canal: ${error.message}`);
  }

  return data;
}

/**
 * Atualiza um target existente. Recebe os mesmos campos de
 * `CreateTargetInput` e aplica as mesmas validações de `createTarget`
 * — a edição não pode deixar o registro em um estado que a criação
 * nunca permitiria.
 *
 * @param id UUID do target a ser atualizado.
 * @param input Dados atualizados do target.
 * @returns O target atualizado.
 * @throws Error com mensagem descritiva se algum campo obrigatório
 *         estiver vazio ou se a atualização falhar.
 */
export async function updateTarget(id: string, input: CreateTargetInput): Promise<Target> {
  const name = input.name.trim();
  const url = input.url.trim();
  const platform = input.platform.trim();

  if (!name) throw new Error('Nome do canal não pode ser vazio.');
  if (!url) throw new Error('URL do canal não pode ser vazia.');
  if (!/^https?:\/\//i.test(url)) {
    throw new Error('URL do canal deve começar com http:// ou https://.');
  }
  if (!platform) throw new Error('Plataforma não pode ser vazia.');
  if (!input.niche_id) throw new Error('Selecione um nicho antes de salvar.');

  const { data, error } = await supabase
    .from('targets')
    .update({
      niche_id: input.niche_id,
      name,
      url,
      platform,
      risk_level: input.risk_level ?? 'low',
      authorization_status: input.authorization_status ?? 'not_requested',
      authorization_note: input.authorization_note?.trim() || null,
      twitch_account_type: input.twitch_account_type ?? null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Falha ao atualizar canal: ${error.message}`);
  }

  return data;
}

/**
 * Remove um target pelo id.
 *
 * @param id UUID do target a ser removido.
 * @throws Error com mensagem descritiva se a exclusão falhar.
 */
export async function deleteTarget(id: string): Promise<void> {
  const { error } = await supabase.from('targets').delete().eq('id', id);

  if (error) {
    throw new Error(`Falha ao remover canal: ${error.message}`);
  }
}
