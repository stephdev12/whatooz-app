import Link from 'next/link'
import { ShieldCheck, Lock, Eye, Server, RefreshCw, Mail, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Politique de Confidentialité — Whatooz',
  description: 'Politique de confidentialité et traitement des données personnelles de la plateforme Whatooz et de ses intégrations WhatsApp Business API.',
}

export default function PrivacyPolicyPage() {
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
            <ShieldCheck className="h-3.5 w-3.5" />
            Conforme RGPD & Exigences Meta Platforms Inc.
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Politique de Confidentialité
          </h1>
          <p className="text-sm text-muted-foreground">
            Dernière mise à jour : {lastUpdated} • Applicable à la plateforme logicielle Whatooz et aux services d&apos;intégration WhatsApp Business Solution Provider.
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">
          {/* Introduction */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              1. Introduction & Responsable du Traitement
            </h2>
            <p>
              La présente politique de confidentialité décrit la façon dont la plateforme <strong>Whatooz</strong> (« Nous », « Notre » ou « la Plateforme ») collecte, utilise, stocke et protège les données personnelles dans le cadre de ses services SaaS de CRM, d&apos;automatisation et de communication via l&apos;API WhatsApp Business (Meta Cloud API).
            </p>
            <p>
              Whatooz agit en tant que <strong>Fournisseur Technologique (Tech Provider)</strong> et sous-traitant pour le compte de ses clients professionnels (« Entreprises Utilisatrices »), leur permettant d&apos;échanger avec leurs propres clients (« Utilisateurs Finaux »).
            </p>
          </section>

          {/* Données collectées */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#fe5105]" />
              2. Données collectées
            </h2>
            <p>Dans le cadre de l&apos;utilisation de nos solutions, nous traitons les données suivantes :</p>
            <ul className="list-disc space-y-1.5 pl-6">
              <li>
                <strong className="text-foreground">Données du Compte Entreprise :</strong> Nom, prénom, adresse email professionnelle, numéro de téléphone, informations de facturation, identifiants du compte Meta Business Portfolio et WhatsApp Business Account (WABA ID).
              </li>
              <li>
                <strong className="text-foreground">Données de Messagerie & Contacts :</strong> Numéros de téléphone des destinataires WhatsApp, noms et prénoms des contacts, contenu des messages entrants et sortants, horodatages, statuts d&apos;envoi et de lecture des messages.
              </li>
              <li>
                <strong className="text-foreground">Données des Formulaires & WhatsApp Flows :</strong> Réponses aux formulaires interactifs intégrés (choix de produits, informations de devis, créneaux de rendez-vous, adresses de livraison nécessaires aux commandes).
              </li>
              <li>
                <strong className="text-foreground">Données Techniques :</strong> Adresses IP, journaux d&apos;accès, identifiants de sessions sécurisées et jetons d&apos;accès chiffrés.
              </li>
            </ul>
          </section>

          {/* Finalités du traitement */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Server className="h-4 w-4 text-[#fe5105]" />
              3. Finalités du Traitement & Bases Légales
            </h2>
            <p>Vos données sont collectées et traitées uniquement pour les finalités suivantes :</p>
            <div className="grid gap-3 sm:grid-cols-2 pt-1">
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold text-foreground text-xs mb-1">Fourniture du Service WhatsApp API</h3>
                <p className="text-xs">
                  Envoi et réception de messages transactionnels, notifications de commande, modèles de messages approuvés par Meta et support client.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold text-foreground text-xs mb-1">Automatisation & Gestion des Ventes</h3>
                <p className="text-xs">
                  Exécution des scénarios d&apos;automatisation, génération de liens de paiement sécurisés et traitement des demandes clients.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold text-foreground text-xs mb-1">Conformité & Intégration Meta</h3>
                <p className="text-xs">
                  Gestion des comptes WABA, conformité aux politiques de messagerie professionnelle de Meta Platforms Inc.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold text-foreground text-xs mb-1">Sécurité & Prévention des Fraudes</h3>
                <p className="text-xs">
                  Protection des accès, prévention du spam et respect des réglementations légales en vigueur.
                </p>
              </div>
            </div>
          </section>

          {/* Intégration Meta & WhatsApp API */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#fe5105]" />
              4. Partage des Données & Intégration avec Meta Platforms Inc.
            </h2>
            <p>
              Whatooz s&apos;interface avec l&apos;infrastructure <strong>WhatsApp Business Cloud API</strong> exploitée par <strong>Meta Platforms, Inc.</strong> (1 Hacker Way, Menlo Park, CA 94025, USA / Meta Platforms Ireland Ltd., 4 Grand Canal Square, Grand Canal Harbour, Dublin 2, Ireland).
            </p>
            <p>
              Pour permettre la transmission de messages WhatsApp, les métadonnées et contenus de communication transitent de manière chiffrée par les serveurs de Meta conformément aux Conditions d&apos;utilisation de WhatsApp Business et à la Politique de Confidentialité de Meta.
            </p>
            <p className="rounded-lg border border-border/80 bg-secondary/30 p-3 text-xs">
              🔒 <strong>Engagement de non-commercialisation :</strong> Whatooz ne vend, ne loue et ne commercialise aucune donnée personnelle ou liste de contacts à des tiers ou à des fins publicitaires.
            </p>
          </section>

          {/* Sécurité et Chiffrement */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              5. Sécurité & Chiffrement des Données
            </h2>
            <p>
              Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles de pointe :
            </p>
            <ul className="list-disc space-y-1.5 pl-6">
              <li>
                <strong>Chiffrement des jetons d&apos;accès :</strong> Tous les jetons d&apos;accès Meta API (Access Tokens) et clés sensibles sont chiffrés en base de données selon l&apos;algorithme <strong>AES-256-GCM</strong>.
              </li>
              <li>
                <strong>Chiffrement en transit :</strong> Toutes les communications Web et Webhooks s&apos;effectuent exclusivement via HTTPS / TLS 1.3 avec vérification systématique des signatures de sécurité (SHA256 HMAC) sur les webhooks WhatsApp.
              </li>
              <li>
                <strong>Isolation des données :</strong> Chaque compte entreprise dispose d&apos;une isolation stricte de ses données clients (Row-Level Security / RLS).
              </li>
            </ul>
          </section>

          {/* Conservation des données */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              6. Durée de Conservation
            </h2>
            <p>
              Les données personnelles sont conservées uniquement pendant la durée nécessaire à l&apos;exécution des services souscrits par l&apos;Entreprise Utilisatrice :
            </p>
            <ul className="list-disc space-y-1.5 pl-6">
              <li>Historique des conversations et messages : conservé pour la durée du contrat de service ou jusqu&apos;à demande de suppression par l&apos;administrateur.</li>
              <li>Données de facturation et comptabilité : conservées conformément aux obligations légales fiscales applicables (5 à 10 ans).</li>
              <li>Suppression du compte : à la clôture d&apos;un compte, l&apos;ensemble des données associées et jetons d&apos;accès sont définitivement purgés sous 30 jours.</li>
            </ul>
          </section>

          {/* Droits des utilisateurs */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-[#fe5105]" />
              7. Vos Droits (RGPD & Lois sur la Protection des Données)
            </h2>
            <p>
              Conformément à la réglementation sur la protection des données personnelles (notamment le Règlement Général sur la Protection des Données - RGPD), vous disposez des droits suivants :
            </p>
            <ul className="list-disc space-y-1.5 pl-6">
              <li>Droit d&apos;accès et de copie de vos données personnelles.</li>
              <li>Droit de rectification des informations inexactes ou incomplètes.</li>
              <li>Droit à l&apos;effacement (« droit à l&apos;oubli »).</li>
              <li>Droit à la limitation et d&apos;opposition au traitement.</li>
              <li>Droit à la portabilité des données sous format structuré et lisible par machine.</li>
            </ul>
            <p>
              Pour toute demande relative à vos droits, vous pouvez contacter notre Délégué à la Protection des Données (DPO) à l&apos;adresse ci-dessous.
            </p>
          </section>

          {/* Contact */}
          <section className="rounded-xl border border-border bg-card p-6 space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#fe5105]" />
              8. Contact & Informations Légales
            </h2>
            <p>
              Pour toute question concernant cette Politique de Confidentialité ou pour exercer vos droits, vous pouvez nous joindre :
            </p>
            <div className="text-xs space-y-1 text-foreground">
              <p><strong>Plateforme :</strong> Whatooz</p>
              <p><strong>Email support & confidentialité :</strong> privacy@whatooz.com / contact@whatooz.com</p>
              <p><strong>Site Web :</strong> https://whatooz.com</p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Whatooz. Tous droits réservés. WhatsApp est une marque déposée de Meta Platforms, Inc.
      </footer>
    </div>
  )
}
