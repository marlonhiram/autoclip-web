import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

/**
 * Select padrão do sistema, com label opcional acima do campo.
 * Mesmo padrão visual do Input, para os enums do banco
 * (risk_level, authorization_status, twitch_account_type).
 */
export function Select({ label, id, className = '', children, ...rest }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 ${className}`}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}
