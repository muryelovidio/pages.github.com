"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-10">
      <div className="card max-w-sm p-6 text-center">
        <p className="font-medium text-foreground">Algo deu errado</p>
        <p className="mt-1 text-sm text-muted">
          {error.message || "Não foi possível completar essa ação."}
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
