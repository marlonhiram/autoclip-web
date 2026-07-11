/**
 * Tipos TypeScript que espelham o schema do banco (ver CONTEXTO.md,
 * seção 6, para descrição detalhada de cada coluna).
 *
 * Por que isso existe separado: se o schema mudar (nova coluna, nova
 * tabela), este é o único lugar que precisa ser atualizado — o
 * TypeScript avisa em tempo de compilação (antes de rodar o código)
 * se algum service ou componente ficou desatualizado em relação ao
 * schema novo.
 */

export type RiskLevel = 'low' | 'medium' | 'high';

export type AuthorizationStatus =
  | 'not_requested'
  | 'requested'
  | 'authorized'
  | 'denied';

export type TwitchAccountType = 'regular' | 'affiliate' | 'partner';

export type ClipStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

export type SourceType = 'manual' | 'auto';

export type StorageProvider = 'google_drive' | 'local';

/** Espelha a tabela `niches`. */
export interface Niche {
  id: string;
  name: string;
  created_at: string;
}

/** Espelha a tabela `targets`. */
export interface Target {
  id: string;
  niche_id: string;
  name: string;
  url: string;
  platform: string;
  risk_level: RiskLevel;
  authorization_status: AuthorizationStatus;
  authorization_note: string | null;
  twitch_account_type: TwitchAccountType | null;
  created_at: string;
}

/** Espelha a tabela `clips_queue`. */
export interface ClipQueueItem {
  id: string;
  target_id: string;
  source_url: string;
  start_time: string;
  duration: number;
  status: ClipStatus;
  source_type: SourceType;
  local_path: string | null;
  storage_provider: StorageProvider;
  external_file_id: string | null;
  external_url: string | null;
  error_message: string | null;
  created_at: string;
}