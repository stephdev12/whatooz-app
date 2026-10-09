'use client'

import React from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="fr">
      <body className="bg-[#171717] text-white flex min-h-screen items-center justify-center p-6 font-sans">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-xl font-semibold">Une erreur inattendue est survenue</h2>
          <p className="text-sm text-zinc-400">{error?.message || 'Erreur d\'application'}</p>
          <button
            type="button"
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-lg bg-[#463fba] text-white text-xs font-semibold hover:bg-[#3b368e] transition-colors"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  )
}
