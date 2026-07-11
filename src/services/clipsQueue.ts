import { supabase } from '@/lib/supabase';
import type { ClipQueueItem } from '@/types/database';

/**
 * Camada de serviço para a tabela `clips_queue`. Mesmo padrão de
 * `services/niches.ts` e `services/targets.ts`.
 *
 * V1 só cria itens com `source_type: 'manual'` (ver DEC-SYS-002) — a
 * identificação automática de clipes é um módulo futuro isolado.
 * `storage_provider` é sempre `google_drive` na criação (ver
 * DEC-SYS-004); quem processa e faz upload de fato é o Worker.
 */

export interface CreateClipInput {
  target_id: string;
  source_url: string;
  start_time: string;
  duration: number;
}

/**
 * Busca todos os itens da fila, ordenados por data de criação
 * (mais recentes primeiro).
 *
 * @returns Lista de itens da fila.
 * @throws Error com mensagem descritiva se a consulta falhar.
 */
export async function listClipsQueue(): Promise<ClipQueueItem[]> {
  const { data, error } = await supabase
    .from('clips_queue')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Falha ao buscar fila de clipes: ${error.message}`);
  }

  return data;
}

/**
 * Cria um novo pedido de corte manual na fila.
 *
 * @param input Dados do corte a ser criado.
 * @returns O item recém-criado, com `status: 'PENDING'`.
 * @throws Error com mensagem descritiva se algum campo obrigatório
 *         estiver vazio/inválido ou se a inserção falhar.
 */
export async function createClip(input: CreateClipInput): Promise<ClipQueueItem> {
  const sourceUrl = input.source_url.trim();
  const startTime = input.start_time.trim();

  if (!input.target_id) throw new Error('Selecione um canal antes de salvar.');
  if (!sourceUrl) throw new Error('URL do VOD não pode ser vazia.');
  if (!/^https?:\/\//i.test(sourceUrl)) {
    throw new Error('URL do VOD deve começar com http:// ou https://.');
  }
  if (!startTime) throw new Error('Informe o timestamp de início do corte.');
  if (!Number.isFinite(input.duration) || input.duration <= 0) {
    throw new Error('Duração deve ser um número de segundos maior que zero.');
  }

  const { data, error } = await supabase
    .from('clips_queue')
    .insert({
      target_id: input.target_id,
      source_url: sourceUrl,
      start_time: startTime,
      duration: input.duration,
      status: 'PENDING',
      source_type: 'manual',
      storage_provider: 'google_drive',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Falha ao criar item na fila: ${error.message}`);
  }

  return data;
}

/**
 * Atualiza um item da fila (URL do VOD, início do corte e duração).
 *
 * Só é permitido editar itens com `status = 'PENDING'`: uma vez que o
 * Worker começa a processar (`PROCESSING`), ele já está trabalhando
 * com os dados originais — editar por baixo criaria uma condição de
 * corrida sem controle algum. Itens `DONE`/`FAILED` já são histórico.
 *
 * @param id UUID do item a ser atualizado.
 * @param input Dados atualizados do corte.
 * @returns O item atualizado.
 * @throws Error com mensagem descritiva se algum campo obrigatório
 *         estiver vazio/inválido, se o item não estiver mais
 *         `PENDING`, ou se a atualização falhar.
 */
export async function updateClip(id: string, input: CreateClipInput): Promise<ClipQueueItem> {
  const sourceUrl = input.source_url.trim();
  const startTime = input.start_time.trim();

  if (!input.target_id) throw new Error('Selecione um canal antes de salvar.');
  if (!sourceUrl) throw new Error('URL do VOD não pode ser vazia.');
  if (!/^https?:\/\//i.test(sourceUrl)) {
    throw new Error('URL do VOD deve começar com http:// ou https://.');
  }
  if (!startTime) throw new Error('Informe o timestamp de início do corte.');
  if (!Number.isFinite(input.duration) || input.duration <= 0) {
    throw new Error('Duração deve ser um número de segundos maior que zero.');
  }

  const { data, error } = await supabase
    .from('clips_queue')
    .update({
      target_id: input.target_id,
      source_url: sourceUrl,
      start_time: startTime,
      duration: input.duration,
    })
    .eq('id', id)
    .eq('status', 'PENDING')
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao atualizar item da fila: ${error.message}`);
  }
  if (!data) {
    throw new Error(
      'Este item não pode mais ser editado — o Worker já iniciou o processamento ou ele já foi concluído.'
    );
  }

  return data;
}

/**
 * Remove um item da fila pelo id.
 *
 * @param id UUID do item a ser removido.
 * @throws Error com mensagem descritiva se a exclusão falhar.
 */
export async function deleteClip(id: string): Promise<void> {
  const { error } = await supabase.from('clips_queue').delete().eq('id', id);

  if (error) {
    throw new Error(`Falha ao remover item da fila: ${error.message}`);
  }
}

/**
 * Inscreve-se em mudanças na tabela `clips_queue` via Supabase
 * Realtime (WebSocket). Toda vez que uma linha é criada, atualizada
 * ou removida — por qualquer origem, incluindo o Worker — `onChange`
 * é chamado.
 *
 * @param onChange Callback chamado a cada mudança detectada.
 * @returns Função de limpeza — deve ser retornada dentro de um
 *          `useEffect`, senão a inscrição continua ativa mesmo depois
 *          da tela ser fechada.
 */
export function subscribeToClipsQueue(onChange: () => void): () => void {
  const channel = supabase
    .channel('clips_queue-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'clips_queue' },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
