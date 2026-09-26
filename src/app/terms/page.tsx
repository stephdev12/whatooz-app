import Link from 'next/link'
import { ShieldCheck, Lock, Eye, Server, RefreshCw, Mail, ArrowLeft, BookOpen, ScrollText } from 'lucide-react'

export const metadata = {
  title: 'Conditions Générales d\'Utilisation — Whatooz',
  description: 'Conditions générales d\'utilisation de la plateforme Whatooz.',
}

export default function TermsOfServicePage() {
  const lastUpdated = '19 septembre 2026'

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-[#fe5105]/20 selection:text-[#fe5105]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;accueil
          </Link>
          <div className="flex items-center gap-2 font-bold text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fe5105] text-white font-black text-base shadow-sm">
              W
            </div>
            <span>Whatooz</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-12 lg:py-16">
        {/* Header */}
        <div className="mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#fe5105]/30 bg-[#fe5105]/10 px-3 py-1 text-xs font-semibold text-[#fe5105]">
            <ScrollText className="h-3.5 w-3.5" />
            Mentions Légales & Conditions d&apos;Utilisation
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Conditions Générales d&apos;Utilisation
          </h1>
          <p className="text-sm text-muted-foreground">
            Dernière mise à jour : {lastUpdated} • Applicable à la plateforme logicielle Whatooz.
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">
          {/* Introduction */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              1. Objet
            </h2>
            <p>
              Les présentes Conditions Générales d&apos;Utilisation (CGU) ont pour objet de définir les modalités et conditions dans lesquelles <strong>Whatooz</strong> (ci-après « la Plateforme ») met ses services à la disposition de ses utilisateurs (ci-après « l&apos;Utilisateur » ou « Vous »).
            </p>
          </section>

          {/* Acceptation des conditions */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              2. Acceptation des conditions
            </h2>
            <p>
              L&apos;accès et l&apos;utilisation de la Plateforme impliquent l&apos;acceptation sans réserve des présentes CGU. Si vous n&apos;acceptez pas ces conditions, vous devez cesser toute utilisation de la Plateforme.
            </p>
          </section>

          {/* Accès et Inscription */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              3. Accès au service et Inscription
            </h2>
            <p>
              L&apos;utilisation des services de Whatooz nécessite la création d&apos;un compte. L&apos;Utilisateur s&apos;engage à fournir des informations exactes, complètes et à jour.
            </p>
          </section>

          {/* Responsabilités de l'utilisateur */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              4. Obligations de l&apos;Utilisateur
            </h2>
            <p>
              En utilisant Whatooz, l&apos;Utilisateur s&apos;engage à :
            </p>
            <ul className="list-disc space-y-1.5 pl-6">
              <li>Ne pas utiliser le service à des fins illégales ou frauduleuses.</li>
              <li>Respecter les conditions de service de WhatsApp et Meta Platforms Inc.</li>
              <li>Ne pas envoyer de spam ou de messages non sollicités à grande échelle.</li>
            </ul>
          </section>

          {/* Propriété intellectuelle */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              5. Propriété Intellectuelle
            </h2>
            <p>
              Whatooz, son contenu, ses fonctionnalités et son design sont la propriété exclusive de GTEC et sont protégés par les lois sur la propriété intellectuelle. Toute reproduction, modification ou distribution non autorisée est strictement interdite.
            </p>
          </section>

          {/* Limitation de responsabilité */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              6. Limitation de Responsabilité
            </h2>
            <p>
              Whatooz s&apos;efforce d&apos;assurer une disponibilité maximale du service. Cependant, la Plateforme ne saurait être tenue responsable des interruptions, pannes, ou pertes de données, ainsi que des modifications imposées par Meta Platforms Inc. sur l&apos;API WhatsApp.
            </p>
          </section>

          {/* Contact */}
          <section className="rounded-xl border border-border bg-card p-6 space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#fe5105]" />
              7. Contact & Informations Légales
            </h2>
            <p>
              Pour toute question concernant ces Conditions Générales, vous pouvez nous joindre :
            </p>
            <div className="text-xs space-y-1 text-foreground">
              <p><strong>Plateforme :</strong> Whatooz (propulsé par GTEC)</p>
              <p><strong>Email support & confidentialité :</strong> contact@onlice.com</p>
              <p><strong>Téléphone :</strong> 650471093</p>
              <p><strong>Site Web :</strong> https://whatooz.space</p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Whatooz (propulsé par GTEC). Tous droits réservés. WhatsApp est une marque déposée de Meta Platforms, Inc.
      </footer>
    </div>
  )
}
