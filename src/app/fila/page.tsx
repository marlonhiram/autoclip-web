'use client';

import { useEffect, useState } from 'react';
import { listTargets } from '@/services/targets';
import {
  listClipsQueue,
  createClip,
  updateClip,
  deleteClip,
  subscribeToClipsQueue,
} from '@/services/clipsQueue';
import type { ClipQueueItem, ClipStatus, Target } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';

const STATUS_LABELS: Record<ClipStatus, string> = {
  PENDING: 'Pendente',
  PROCESSING: 'Processando',
  DONE: 'Concluído',
  FAILED: 'Falhou',
};

const STATUS_VARIANTS: Record<ClipStatus, 'neutral' | 'warning' | 'success' | 'danger'> = {
  PENDING: 'neutral',
  PROCESSING: 'warning',
  DONE: 'success',
  FAILED: 'danger',
};

/**
 * Formata um valor digitado como timestamp HH:MM:SS, inserindo os
 * dois-pontos automaticamente conforme o usuário digita números.
 * Ignora qualquer caractere que não seja dígito.
 */
function formatTimeInput(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '').slice(0, 6);
  const parts: string[] = [];

  if (digits.length > 0) parts.push(digits.slice(0, 2));
  if (digits.length > 2) parts.push(digits.slice(2, 4));
  if (digits.length > 4) parts.push(digits.slice(4, 6));

  return parts.join(':');
}

interface FormState {
  targetId: string;
  sourceUrl: string;
  startTime: string;
  duration: string;
}

const initialForm: FormState = {
  targetId: '',
  sourceUrl: '',
  startTime: '',
  duration: '',
};

export default function FilaPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [clips, setClips] = useState<ClipQueueItem[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadClips() {
    try {
      setError(null);
      const data = await listClipsQueue();
      setClips(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao buscar a fila.');
    }
  }

  async function loadInitialData() {
    try {
      setLoading(true);
      setError(null);
      const [targetsData, clipsData] = await Promise.all([listTargets(), listClipsQueue()]);
      setTargets(targetsData);
      setClips(clipsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao buscar dados.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitialData();

    const unsubscribe = subscribeToClipsQueue(() => {
      loadClips();
    });

    return unsubscribe;
  }, []);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  /**
   * Aplica a máscara HH:MM:SS e força o cursor pro final do campo.
   * Sem isso, o navegador pode deixar o cursor antes do ":" que
   * acabamos de inserir automaticamente, atrapalhando a digitação
   * do próximo número.
   */
  function handleStartTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatTimeInput(e.target.value);
    e.target.value = formatted;
    e.target.setSelectionRange(formatted.length, formatted.length);
    updateForm('startTime', formatted);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const input = {
      target_id: form.targetId,
      source_url: form.sourceUrl,
      start_time: form.startTime,
      duration: Number(form.duration),
    };

    try {
      setSubmitting(true);
      setError(null);
      if (editingId) {
        await updateClip(editingId, input);
      } else {
        await createClip(input);
      }
      setForm(initialForm);
      setEditingId(null);
      // Não precisa chamar loadClips() aqui: a inscrição Realtime já
      // vai detectar o INSERT/UPDATE e atualizar a lista sozinha.
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Erro desconhecido ao ${editingId ? 'atualizar' : 'criar'} item na fila.`
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(clip: ClipQueueItem) {
    setError(null);
    setEditingId(clip.id);
    setForm({
      targetId: clip.target_id,
      sourceUrl: clip.source_url,
      startTime: clip.start_time,
      duration: String(clip.duration),
    });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(initialForm);
    setError(null);
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm('Remover este item da fila? Essa ação não pode ser desfeita.');
    if (!confirmed) return;

    try {
      setError(null);
      await deleteClip(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao remover item.');
    }
  }

  function targetName(targetId: string): string {
    return targets.find((t) => t.id === targetId)?.name ?? 'Canal desconhecido';
  }

  const hasTargets = targets.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Fila de Clipes</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Pedidos de corte manual, processados pelo Worker. Atualiza em tempo real.
        </p>
      </div>

      {!loading && !hasTargets && (
        <p className="rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
          Nenhum canal cadastrado ainda. Crie um canal antes de pedir um corte.
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-md border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            id="target"
            label="Canal"
            value={form.targetId}
            onChange={(e) => updateForm('targetId', e.target.value)}
            disabled={submitting || !hasTargets}
            required
          >
            <option value="">Selecione um canal</option>
            {targets.map((target) => (
              <option key={target.id} value={target.id}>
                {target.name} ({target.platform})
              </option>
            ))}
          </Select>

          <Input
            id="sourceUrl"
            label="URL do VOD"
            value={form.sourceUrl}
            onChange={(e) => updateForm('sourceUrl', e.target.value)}
            placeholder="https://twitch.tv/videos/..."
            disabled={submitting}
          />

          <Input
            id="startTime"
            label="Início do corte (HH:MM:SS)"
            value={form.startTime}
            onChange={handleStartTimeChange}
            placeholder="00:00:00"
            inputMode="numeric"
            maxLength={8}
            disabled={submitting}
          />

          <Input
            id="duration"
            label="Duração (segundos)"
            type="number"
            min={1}
            value={form.duration}
            onChange={(e) => updateForm('duration', e.target.value)}
            placeholder="60"
            disabled={submitting}
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={
              submitting ||
              !hasTargets ||
              !form.targetId ||
              !form.sourceUrl.trim() ||
              !form.startTime.trim() ||
              !form.duration
            }
            className="self-start"
          >
            {submitting ? 'Enviando...' : editingId ? 'Salvar edição' : 'Pedir corte'}
          </Button>
          {editingId && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancelEdit}
              disabled={submitting}
              className="self-start"
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          Erro: {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Carregando fila...</p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {clips.length === 0 && (
            <li className="py-3 text-sm text-zinc-500 dark:text-zinc-400">
              Nenhum item na fila ainda.
            </li>
          )}
          {clips.map((clip) => (
            <li key={clip.id} className="flex flex-col gap-2 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {targetName(clip.target_id)}{' '}
                    <span className="text-zinc-500 dark:text-zinc-400">
                      — início {clip.start_time}, {clip.duration}s
                    </span>
                  </p>
                  <a
                    href={clip.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-500 underline dark:text-zinc-400"
                  >
                    {clip.source_url}
                  </a>
                </div>
                <div className="flex shrink-0 gap-2">
                  {clip.status === 'PENDING' && (
                    <Button type="button" variant="secondary" onClick={() => handleEdit(clip)}>
                      Editar
                    </Button>
                  )}
                  <Button type="button" variant="danger" onClick={() => handleDelete(clip.id)}>
                    Remover
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={STATUS_VARIANTS[clip.status]}>{STATUS_LABELS[clip.status]}</Badge>
                {clip.external_url && (
                  <a
                    href={clip.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-500 underline dark:text-zinc-400"
                  >
                    Ver clipe no Drive
                  </a>
                )}
              </div>

              {clip.status === 'FAILED' && clip.error_message && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  Erro: {clip.error_message}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
