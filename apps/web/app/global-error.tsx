"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen flex items-center justify-center p-6 bg-neutral-50">
          <div className="w-full max-w-md text-center space-y-6">
            <div className="space-y-2">
              <div className="text-6xl">💥</div>
              <h1 className="text-2xl font-bold text-neutral-900">
                Erro Crítico
              </h1>
              <p className="text-neutral-600">
                Um erro crítico ocorreu. Por favor, recarregue a página.
              </p>
            </div>

            <button
              onClick={reset}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition"
            >
              Recarregar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}