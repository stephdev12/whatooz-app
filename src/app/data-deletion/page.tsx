import Link from 'next/link'
import { ShieldCheck, Lock, Trash2, Mail, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Suppression des données — Whatooz',
  description: 'Instructions concernant la suppression de vos données personnelles sur la plateforme Whatooz et l\'application associée (Meta).',
}

export default function DataDeletionPage() {
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
            <Trash2 className="h-3.5 w-3.5" />
            Suppression des Données
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Instructions de Suppression des Données
          </h1>
          <p className="text-sm text-muted-foreground">
            Dernière mise à jour : {lastUpdated} • Applicable à la plateforme logicielle Whatooz.
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">
          {/* Introduction */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              1. Droit à l&apos;Effacement
            </h2>
            <p>
              Conformément à nos politiques de confidentialité et aux exigences de <strong>Meta Platforms Inc.</strong>, Whatooz offre à tous ses utilisateurs la possibilité de demander la suppression complète de leurs données personnelles.
            </p>
            <p>
              Vous pouvez demander la suppression de votre compte, de vos configurations WhatsApp, ainsi que de tout l&apos;historique de communication enregistré sur nos serveurs.
            </p>
          </section>

          {/* Révocation Meta */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#fe5105]" />
              2. Retirer l&apos;accès à l&apos;application (Facebook / Meta)
            </h2>
            <p>
              Si vous avez lié votre compte Facebook ou WhatsApp Business à notre application, vous pouvez révoquer notre accès à vos informations directement depuis vos paramètres Facebook en suivant ces étapes simples :
            </p>
            <ol className="list-decimal space-y-2 pl-6">
              <li>
                Allez dans le menu <strong>Paramètres et confidentialité</strong> de votre compte Facebook, puis cliquez sur <strong>Paramètres</strong>.
              </li>
              <li>
                Recherchez <strong>Applications et sites web</strong> ou <strong>Business Integrations</strong> dans le menu de gauche.
              </li>
              <li>
                Cherchez notre application <strong>Whatooz</strong> dans la liste.
              </li>
              <li>
                Cliquez sur <strong>Supprimer</strong>. 
              </li>
            </ol>
            <p>
              Ceci bloquera notre application et l&apos;empêchera de recevoir toute nouvelle donnée depuis Meta.
            </p>
          </section>

          {/* Suppression interne */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#fe5105]" />
              3. Demander la suppression totale depuis nos serveurs
            </h2>
            <p>
              Une fois l&apos;accès révoqué sur Meta, vos données stockées sur nos serveurs (historique des chats, clients, formulaires) restent conservées par Whatooz. Pour exiger leur effacement définitif, veuillez formuler une demande explicite à notre équipe :
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li><strong>Étape 1 :</strong> Envoyez un e-mail à <a href="mailto:contact@onlice.com" className="text-[#fe5105] hover:underline font-medium">contact@onlice.com</a> en précisant dans l&apos;objet de l&apos;e-mail : &quot;Demande de suppression de données de l&apos;application Whatooz&quot;.</li>
              <li><strong>Étape 2 :</strong> Veuillez inclure l&apos;adresse e-mail associée à votre compte, et, si possible, votre numéro de téléphone (WABA ID) pour que nous puissions identifier votre compte.</li>
              <li><strong>Étape 3 :</strong> Nous traiterons votre demande et supprimerons vos données dans un délai de 7 jours ouvrés. Une confirmation vous sera renvoyée par e-mail.</li>
            </ul>
          </section>

          {/* Contact */}
          <section className="rounded-xl border border-border bg-card p-6 space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#fe5105]" />
              4. Contact & Informations Légales
            </h2>
            <p>
              Pour toute question supplémentaire, vous pouvez nous joindre :
            </p>
            <div className="text-xs space-y-1 text-foreground">
              <p><strong>Plateforme :</strong> Whatooz (propulsé par GTEC)</p>
              <p><strong>Email :</strong> contact@onlice.com</p>
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
