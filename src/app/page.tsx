import Link from 'next/link';

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">AutoClip</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Painel de controle do sistema de clipes.
        </p>
      </div>

            <div className="flex flex-col gap-3">
        <Link
          href="/nichos"
          className="rounded-md border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          Nichos →
        </Link>
        <Link
          href="/targets"
          className="rounded-md border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          Canais →
        </Link>
        <Link
          href="/fila"
          className="rounded-md border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          Fila de Clipes →
        </Link>
      </div>


    </div>
  );
}
