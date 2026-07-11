'use client';

import { useEffect, useState } from 'react';
import { listNiches } from '@/services/niches';
import { listTargets, createTarget, updateTarget, deleteTarget } from '@/services/targets';
import type {
  AuthorizationStatus,
  Niche,
  RiskLevel,
  Target,
  TwitchAccountType,
} from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';

const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
};

const RISK_VARIANTS: Record<RiskLevel, 'success' | 'warning' | 'danger'> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
};

const AUTH_LABELS: Record<AuthorizationStatus, string> = {
  not_requested: 'Não solicitada',
  requested: 'Solicitada',
  authorized: 'Autorizada',
  denied: 'Negada',
};

const AUTH_VARIANTS: Record<AuthorizationStatus, 'neutral' | 'warning' | 'success' | 'danger'> = {
  not_requested: 'neutral',
  requested: 'warning',
  authorized: 'success',
  denied: 'danger',
};

interface FormState {
  nicheId: string;
  name: string;
  url: string;
  platform: string;
  riskLevel: RiskLevel;
  authorizationStatus: AuthorizationStatus;
  authorizationNote: string;
  twitchAccountType: TwitchAccountType | '';
}

const initialForm: FormState = {
  nicheId: '',
  name: '',
  url: '',
  platform: 'Twitch',
  riskLevel: 'low',
  authorizationStatus: 'not_requested',
  authorizationNote: '',
  twitchAccountType: '',
};

export default function TargetsPage() {
  const [niches, setNiches] = useState<Niche[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [nichesData, targetsData] = await Promise.all([listNiches(), listTargets()]);
      setNiches(nichesData);
      setTargets(targetsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao buscar dados.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const input = {
      niche_id: form.nicheId,
      name: form.name,
      url: form.url,
      platform: form.platform,
      risk_level: form.riskLevel,
      authorization_status: form.authorizationStatus,
      authorization_note: form.authorizationNote || undefined,
      twitch_account_type: form.twitchAccountType || undefined,
    };

    try {
      setSubmitting(true);
      setError(null);
      if (editingId) {
        await updateTarget(editingId, input);
      } else {
        await createTarget(input);
      }
      setForm(initialForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Erro desconhecido ao ${editingId ? 'atualizar' : 'criar'} canal.`
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(target: Target) {
    setError(null);
    setEditingId(target.id);
    setForm({
      nicheId: target.niche_id,
      name: target.name,
      url: target.url,
      platform: target.platform,
      riskLevel: target.risk_level,
      authorizationStatus: target.authorization_status,
      authorizationNote: target.authorization_note ?? '',
      twitchAccountType: target.twitch_account_type ?? '',
    });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(initialForm);
    setError(null);
  }

  async function handleDelete(id: string, name: string) {
    const confirmed = window.confirm(`Remover o canal "${name}"? Essa ação não pode ser desfeita.`);
    if (!confirmed) return;

    try {
      setError(null);
      await deleteTarget(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao remover canal.');
    }
  }

  function nicheName(nicheId: string): string {
    return niches.find((n) => n.id === nicheId)?.name ?? 'Nicho desconhecido';
  }

  const hasNiches = niches.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Canais</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Cadastre os canais (targets) monitorados dentro de cada nicho.
        </p>
      </div>

      {!loading && !hasNiches && (
        <p className="rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
          Nenhum nicho cadastrado ainda. Crie um nicho antes de cadastrar um canal.
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-md border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            id="niche"
            label="Nicho"
            value={form.nicheId}
            onChange={(e) => updateForm('nicheId', e.target.value)}
            disabled={submitting || !hasNiches}
            required
          >
            <option value="">Selecione um nicho</option>
            {niches.map((niche) => (
              <option key={niche.id} value={niche.id}>
                {niche.name}
              </option>
            ))}
          </Select>

          <Input
            id="name"
            label="Nome do canal"
            value={form.name}
            onChange={(e) => updateForm('name', e.target.value)}
            placeholder="Ex: canaldostreamer"
            disabled={submitting}
          />

          <Input
            id="url"
            label="URL do canal"
            value={form.url}
            onChange={(e) => updateForm('url', e.target.value)}
            placeholder="https://twitch.tv/..."
            disabled={submitting}
          />

          <Select
            id="platform"
            label="Plataforma"
            value={form.platform}
            onChange={(e) => updateForm('platform', e.target.value)}
            disabled={submitting}
          >
            <option value="Twitch">Twitch</option>
            <option value="YouTube">YouTube</option>
            <option value="Kick">Kick</option>
          </Select>

          <Select
            id="riskLevel"
            label="Nível de risco"
            value={form.riskLevel}
            onChange={(e) => updateForm('riskLevel', e.target.value as RiskLevel)}
            disabled={submitting}
          >
            <option value="low">Baixo</option>
            <option value="medium">Médio</option>
            <option value="high">Alto</option>
          </Select>

          <Select
            id="authorizationStatus"
            label="Autorização"
            value={form.authorizationStatus}
            onChange={(e) =>
              updateForm('authorizationStatus', e.target.value as AuthorizationStatus)
            }
            disabled={submitting}
          >
            <option value="not_requested">Não solicitada</option>
            <option value="requested">Solicitada</option>
            <option value="authorized">Autorizada</option>
            <option value="denied">Negada</option>
          </Select>

          {form.platform === 'Twitch' && (
            <Select
              id="twitchAccountType"
              label="Tipo de conta Twitch (opcional)"
              value={form.twitchAccountType}
              onChange={(e) =>
                updateForm('twitchAccountType', e.target.value as TwitchAccountType | '')
              }
              disabled={submitting}
            >
              <option value="">Não informado</option>
              <option value="regular">Regular</option>
              <option value="affiliate">Affiliate</option>
              <option value="partner">Partner</option>
            </Select>
          )}

          <Input
            id="authorizationNote"
            label="Nota de autorização (opcional)"
            value={form.authorizationNote}
            onChange={(e) => updateForm('authorizationNote', e.target.value)}
            placeholder="Ex: print da conversa, e-mail..."
            disabled={submitting}
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={submitting || !hasNiches || !form.nicheId || !form.name.trim() || !form.url.trim()}
            className="self-start"
          >
            {submitting ? 'Salvando...' : editingId ? 'Salvar edição' : 'Adicionar canal'}
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
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Carregando canais...</p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {targets.length === 0 && (
            <li className="py-3 text-sm text-zinc-500 dark:text-zinc-400">
              Nenhum canal cadastrado ainda.
            </li>
          )}
          {targets.map((target) => (
            <li key={target.id} className="flex flex-col gap-2 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {target.name}{' '}
                    <span className="text-zinc-500 dark:text-zinc-400">
                      — {nicheName(target.niche_id)}
                    </span>
                  </p>
                  <a
                    href={target.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-500 underline dark:text-zinc-400"
                  >
                    {target.url}
                  </a>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button type="button" variant="secondary" onClick={() => handleEdit(target)}>
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => handleDelete(target.id, target.name)}
                  >
                    Remover
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="neutral">{target.platform}</Badge>
                <Badge variant={RISK_VARIANTS[target.risk_level]}>
                  Risco: {RISK_LABELS[target.risk_level]}
                </Badge>
                <Badge variant={AUTH_VARIANTS[target.authorization_status]}>
                  {AUTH_LABELS[target.authorization_status]}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
