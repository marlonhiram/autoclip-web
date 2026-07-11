'use client';

import { useEffect, useState } from 'react';
import { listNiches, createNiche } from '@/services/niches';
import type { Niche } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function NichosPage() {
  const [niches, setNiches] = useState<Niche[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadNiches() {
    try {
      setLoading(true);
      setError(null);
      const data = await listNiches();
      setNiches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao buscar nichos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNiches();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError(null);
      await createNiche(nameInput);
      setNameInput('');
      await loadNiches();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao criar nicho.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Nichos</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Cadastre os nichos usados para organizar os canais monitorados.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1">
          <Input
            id="nome-nicho"
            label="Nome do nicho"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Ex: Finanças"
            disabled={submitting}
          />
        </div>
        <Button type="submit" disabled={submitting || !nameInput.trim()}>
          {submitting ? 'Criando...' : 'Criar nicho'}
        </Button>
      </form>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          Erro: {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Carregando nichos...</p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {niches.length === 0 && (
            <li className="py-3 text-sm text-zinc-500 dark:text-zinc-400">
              Nenhum nicho cadastrado ainda.
            </li>
          )}
          {niches.map((niche) => (
            <li key={niche.id} className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {niche.name}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                criado em {new Date(niche.created_at).toLocaleString('pt-BR')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
