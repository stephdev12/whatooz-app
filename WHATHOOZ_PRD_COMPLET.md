# WHATHOOZ --- PRD COMPLET DE REBRANDING, DASHBOARD, AUTOMATIONS, FLOWS, COMMERCE, ÉQUIPE & MONÉTISATION

**Version :** 1.0\
**Date :** 22 septembre 2026\
**Statut :** Document de référence produit + architecture fonctionnelle\
**Stack cible :** React/Next.js + React Flow + Supabase + Vercel + Meta
WhatsApp Business Platform + SasPay

------------------------------------------------------------------------

## 0. Résumé exécutif

Whatooz évolue d'un outil d'automatisation WhatsApp reposant
historiquement sur des bibliothèques non officielles vers une plateforme
SaaS construite autour de la **WhatsApp Business Platform officielle de
Meta**.

Le produit doit réunir dans une interface extrêmement simple :

1.  **WhatsApp Inbox / équipe** : plusieurs employés travaillent sur le
    même numéro Business, avec assignation et reprise manuelle des
    conversations.
2.  **Messaging** : messages texte, médias, réponses interactives,
    templates et flows.
3.  **Commerce natif WhatsApp** : catalogue Meta, produits, carrousels
    produits, produit unique, listes multi-produits et commandes.
4.  **Automation Builder** : workflows visuels de type n8n/Make, mais
    beaucoup plus simples pour un utilisateur non technique.
5.  **Flows Builder** : constructeur visuel de WhatsApp Flows où chaque
    node représente un écran Meta Flow, avec aperçu de l'écran dans le
    node et configuration dans un inspector.
6.  **Commerce + paiement SasPay** : lorsqu'un client passe une commande
    depuis WhatsApp, Whatooz peut créer une session/lien SasPay, suivre
    le paiement par webhook puis continuer automatiquement le workflow.
7.  **Team/RBAC** : gestion des employés, rôles, assignations,
    historique et permissions.
8.  **Plans SaaS** : abonnement Whatooz, limites par plan, période
    d'essai d'un mois, quotas Meta intégrés dans le calcul économique et
    compte administrateur interne exempté des limites.
9.  **Administration Whatooz** : compte interne avec accès complet pour
    support, développement, débogage et opérations.
10. **Design system** : dashboard minimaliste, whitespace, island
    layout, icônes outline, sidebar hiérarchique et deux canvas
    cohérents.

Le principe directeur est :

> **Le dashboard doit être simple. Les moteurs derrière peuvent être
> extrêmement puissants.**

------------------------------------------------------------------------

# 1. Objectifs

## 1.1 Objectifs produit

-   Fournir une expérience WhatsApp professionnelle et stable.
-   Ne plus dépendre de Baileys pour le fonctionnement principal.
-   Centraliser les conversations d'une entreprise.
-   Permettre à plusieurs employés de traiter les mêmes conversations.
-   Permettre à un utilisateur non technique de créer des
    automatisations visuelles.
-   Permettre de construire les WhatsApp Flows natifs de Meta sans
    écrire manuellement du JSON.
-   Utiliser le catalogue WhatsApp natif comme source de produits.
-   Transformer un panier WhatsApp en commande Whatooz.
-   Générer un paiement SasPay automatiquement.
-   Continuer l'automatisation après paiement.
-   Donner une architecture multi-tenant robuste.
-   Préparer Whatooz à devenir un véritable SaaS/solution provider.

## 1.2 Non-objectifs

-   Reproduire WhatsApp.
-   Reproduire n8n entièrement.
-   Exposer le JSON Meta comme interface principale.
-   Faire un éditeur visuellement complexe.
-   Ajouter des fonctionnalités AI partout.
-   Utiliser des effets graphiques lourds.

------------------------------------------------------------------------

# 2. Architecture générale

``` text
                         WHATHOOZ
                             |
          +------------------+------------------+
          |                  |                  |
       Dashboard          Inbox             Commerce
          |                  |                  |
          +------------------+------------------+
                             |
                    Automation Engine
                             |
             +---------------+---------------+
             |                               |
      Automation Builder                Flow Builder
             |                               |
             +---------------+---------------+
                             |
                    WhatsApp Adapter
                             |
          +------------------+------------------+
          |                  |                  |
      Cloud API           Flows API          Webhooks
          |                  |                  |
          +------------------+------------------+
                             |
                            Meta

Commerce -----------------> SasPay
                                |
                             Webhooks
                                |
                           Payment Engine
                                |
                           Automation
```

------------------------------------------------------------------------

# 3. Stack technique

## Frontend

-   Next.js / React
-   TypeScript
-   Tailwind CSS
-   shadcn/ui ou composants internes équivalents
-   Lucide Icons
-   React Flow
-   React Query/TanStack Query
-   Zustand ou store équivalent pour l'état local des builders

## Backend

-   Next.js API routes ou backend Node séparé selon l'architecture
    actuelle
-   Supabase PostgreSQL
-   Supabase Auth
-   Supabase Storage
-   Supabase Realtime
-   Queue/background workers recommandés pour les webhooks, automations
    et paiements

## Infrastructure

-   Vercel pour frontend/API compatibles
-   Supabase pour DB/Auth/Storage/Realtime
-   Worker séparé recommandé si l'exécution de workflows devient longue
    ou intensive

## Intégrations

-   Meta Graph API
-   WhatsApp Cloud API
-   WhatsApp Flows API
-   WhatsApp Webhooks
-   Meta Embedded Signup
-   SasPay REST API
-   SasPay Webhooks

------------------------------------------------------------------------

# 4. Architecture multi-tenant

Toutes les données métier doivent être isolées par :

``` text
organization_id
```

Structure :

``` text
platform
  └── organization
       ├── users
       ├── whatsapp_accounts
       ├── phone_numbers
       ├── contacts
       ├── conversations
       ├── messages
       ├── catalogs
       ├── products
       ├── orders
       ├── payments
       ├── automations
       ├── flows
       ├── templates
       └── subscriptions
```

Aucune requête métier ne doit pouvoir récupérer une ressource d'une
autre organisation.

Supabase RLS est obligatoire.

------------------------------------------------------------------------

# 5. Design System Whatooz

## 5.1 Direction

Style :

**Minimal SaaS / Swiss / Editorial / Enterprise**

Références conceptuelles :

-   Linear
-   Vercel
-   Stripe
-   dashboards SaaS modernes

Ne pas copier leur identité.

## 5.2 Principes

-   whitespace important
-   contrastes doux
-   typographie lisible
-   surfaces blanches
-   arrière-plan off-white/gris très léger
-   bordures 1px
-   radius cohérents
-   ombres très faibles
-   icônes outline
-   animations courtes
-   aucune surcharge visuelle

## 5.3 Interdictions

-   glassmorphism
-   gradients décoratifs partout
-   grosses ombres
-   énormes cartes
-   icônes multicolores sans raison
-   gros boutons partout
-   gros titres inutiles
-   interface ressemblant à un formulaire géant
-   UI « AI generated »
-   mélange de bibliothèques d'icônes

## 5.4 Icônes

Lucide en priorité.

-   stroke environ 1.75px
-   round caps
-   round joins
-   pas de remplissage sauf état particulier

## 5.5 Couleurs

La marque peut utiliser le gradient vert/orange dans :

-   logo
-   branding
-   avatar
-   éléments marketing
-   accents très ponctuels

Le dashboard doit rester majoritairement neutre.

------------------------------------------------------------------------

# 6. Dashboard Shell

## 6.1 Island layout

Fond global :

``` text
off-white / very light gray
```

Zone principale :

``` text
background: white
border-radius: 28px environ
border: 1px solid subtle
```

La sidebar flotte visuellement sur le fond.

## 6.2 Sidebar

Sections :

``` text
MAIN
  Overview
  Inbox
  Contacts

COMMERCE
  Products
  Catalog
  Orders
  Payments

AUTOMATION
  Automations
  Flows
  Templates

SETTINGS
  Team
  WhatsApp
  Integrations
  Billing
  Settings
```

## 6.3 Sidebar collapsible

Expanded :

``` text
icon + label
```

Collapsed :

``` text
icon only
```

Tooltip au survol.

## 6.4 Navigation active

Pas de gros fond vert.

Utiliser :

-   fond gris très léger
-   texte plus sombre
-   poids légèrement supérieur
-   icône plus contrastée

## 6.5 Tree navigation

Les sous-menus doivent utiliser une ligne verticale très fine.

------------------------------------------------------------------------

# 7. Inbox / équipe

## 7.1 Objectif

Plusieurs employés peuvent travailler sur le même compte WhatsApp
Business.

Exemple :

``` text
Client A
   |
   +--> Agent X prend la conversation
   |
   +--> Agent Y ne répond pas tant que X possède le relais
   |
   +--> X libère
   |
   +--> Y prend le relais
```

## 7.2 Concepts

Une conversation possède :

``` text
assignee_user_id
team_id
status
priority
automation_state
human_takeover
last_message_at
```

## 7.3 Modes

### Automation

Le workflow répond automatiquement.

### Human takeover

Un agent prend le contrôle.

### Hybrid

L'automatisation continue sauf pour certaines actions.

## 7.4 Actions agent

-   prendre
-   libérer
-   assigner
-   réassigner
-   marquer non lu
-   fermer
-   rouvrir
-   ajouter note interne
-   changer priorité
-   ajouter tag
-   envoyer message
-   envoyer template
-   envoyer produit
-   envoyer flow

## 7.5 Rôles internes

### Owner

Accès total à l'organisation.

### Admin

Gestion business + équipe.

### Manager

Gestion conversations, commerce et automations selon permissions.

### Agent

Inbox + actions autorisées.

### Viewer

Lecture seule.

Les permissions doivent être granulaires.

------------------------------------------------------------------------

# 8. Relation avec les permissions Meta

Les utilisateurs Whatooz et les utilisateurs Meta ne sont pas la même
chose.

Whatooz possède son propre RBAC.

Lorsque nécessaire, Whatooz peut aussi gérer les utilisateurs assignés
au WABA via l'API Meta.

Meta expose notamment :

``` http
GET /{WABA_ID}/assigned_users
POST /{WABA_ID}/assigned_users
DELETE /{WABA_ID}/assigned_users
```

Les permissions Meta peuvent inclure notamment :

``` text
MANAGE
DEVELOP
MANAGE_TEMPLATES
MANAGE_PHONE
MESSAGING
VIEW_INSIGHTS
...
```

Le mapping doit donc être :

``` text
Whatooz role
      ↓
Whatooz permissions
      ↓
Optional Meta WABA permissions
```

Ne jamais donner automatiquement à un agent Whatooz les permissions Meta
d'administration.

------------------------------------------------------------------------

# 9. WhatsApp Onboarding

Whatooz doit utiliser Embedded Signup pour l'onboarding client.

Flux :

``` text
Whatooz
   ↓
Embedded Signup
   ↓
Client Meta authentication
   ↓
Business portfolio
   ↓
WABA
   ↓
Phone number
   ↓
Permissions
   ↓
code
   ↓
Backend Whatooz
   ↓
business token
   ↓
subscribe WABA webhooks
   ↓
ready
```

Le backend doit effectuer les échanges sensibles server-side.

Pour un Tech Provider, les permissions principales attendues sont
notamment :

``` text
whatsapp_business_management
whatsapp_business_messaging
```

L'Advanced Access et l'App Review doivent être considérés comme
prérequis de production.

Meta indique également que Embedded Signup v2 doit être migré vers v4
avant le 15 octobre 2026.

------------------------------------------------------------------------

# 10. Modèle de données WhatsApp

## whatsapp_accounts

``` text
id
organization_id
meta_waba_id
name
currency
timezone
status
business_verification_status
created_at
updated_at
```

## phone_numbers

``` text
id
whatsapp_account_id
meta_phone_number_id
display_phone_number
verified_name
quality_rating
throughput_level
status
created_at
updated_at
```

## meta_credentials

``` text
id
organization_id
waba_id
encrypted_business_token
token_expires_at
scopes
created_at
rotated_at
```

Les tokens ne doivent jamais être envoyés au frontend.

------------------------------------------------------------------------

# 11. Webhook architecture

Endpoint central :

``` http
POST /api/webhooks/meta
```

Le handler doit :

1.  vérifier la signature si applicable
2.  identifier WABA
3.  identifier phone_number_id
4.  stocker le payload brut
5.  dédupliquer
6.  normaliser l'événement
7.  publier un événement interne
8.  déclencher les workflows
9.  mettre à jour Inbox
10. répondre rapidement à Meta

Architecture :

``` text
Meta webhook
    ↓
Webhook Gateway
    ↓
Idempotency
    ↓
Event Store
    ↓
Normalizer
    ↓
Event Bus
    ├── Inbox
    ├── Automation Engine
    ├── Commerce
    ├── Flow Engine
    └── Analytics
```

------------------------------------------------------------------------

# 12. Événements WhatsApp à normaliser

Minimum :

``` text
message.received
message.sent
message.delivered
message.read
message.failed

message.text
message.image
message.audio
message.video
message.document
message.location
message.interactive
message.order
message.reaction

flow.completed

template.status_changed
template.quality_changed

phone.quality_changed
account.status_changed
```

Pour les catalogues, l'événement critique est :

``` text
message.order
```

Le webhook Order contient notamment :

``` json
{
  "type": "order",
  "order": {
    "catalog_id": "CATALOG_ID",
    "text": "",
    "product_items": [
      {
        "product_retailer_id": "SKU",
        "quantity": 2,
        "item_price": 1000,
        "currency": "XAF"
      }
    ]
  }
}
```

------------------------------------------------------------------------

# 13. Commerce natif WhatsApp

Whatooz ne doit plus considérer le mini-site Whatooz comme la seule
source de produits.

Architecture :

``` text
Meta Catalog
     |
     +---- Product
     |
     +---- Product
     |
     +---- Product
```

Whatooz doit synchroniser une représentation locale pour :

-   recherche
-   analytics
-   mapping SKU
-   affichage dashboard
-   commandes
-   automatisations

Mais Meta reste la source de vérité pour le catalogue WhatsApp.

------------------------------------------------------------------------

# 14. Types de messages commerce

Le moteur Commerce doit supporter au minimum :

## Catalog message

Affiche le catalogue complet.

``` json
{
  "type": "interactive",
  "interactive": {
    "type": "catalog_message",
    "body": {
      "text": "Découvrez notre catalogue."
    },
    "action": {
      "name": "catalog_message"
    }
  }
}
```

## Single product

``` json
{
  "type": "interactive",
  "interactive": {
    "type": "product",
    "body": {
      "text": "Voici le produit."
    },
    "action": {
      "catalog_id": "CATALOG_ID",
      "product_retailer_id": "SKU"
    }
  }
}
```

## Multi-product

``` json
{
  "type": "interactive",
  "interactive": {
    "type": "product_list",
    "header": {
      "type": "text",
      "text": "Nos produits"
    },
    "body": {
      "text": "Choisissez ce qui vous intéresse."
    },
    "action": {
      "catalog_id": "CATALOG_ID",
      "sections": [
        {
          "title": "Promotions",
          "product_items": [
            {
              "product_retailer_id": "SKU_1"
            },
            {
              "product_retailer_id": "SKU_2"
            }
          ]
        }
      ]
    }
  }
}
```

## Product carousel

Le carousel produit natif doit être supporté.

Meta documente actuellement un minimum de 2 cartes et un maximum de 10
cartes pour ce format.

``` json
{
  "type": "interactive",
  "interactive": {
    "type": "carousel",
    "body": {
      "text": "Découvrez nos produits."
    },
    "action": {
      "cards": [
        {
          "card_index": 0,
          "type": "product",
          "action": {
            "catalog_id": "CATALOG_ID",
            "product_retailer_id": "SKU_1"
          }
        },
        {
          "card_index": 1,
          "type": "product",
          "action": {
            "catalog_id": "CATALOG_ID",
            "product_retailer_id": "SKU_2"
          }
        }
      ]
    }
  }
}
```

------------------------------------------------------------------------

# 15. Commerce node system

Dans Automation Builder :

``` text
Commerce
├── Send catalog
├── Send product
├── Send product carousel
├── Send multi-product list
├── Wait for order
├── Order received
├── Get order
├── Check product
├── Calculate cart total
├── Create SasPay payment
├── Wait for payment
├── Payment successful
├── Payment failed
└── Send order confirmation
```

------------------------------------------------------------------------

# 16. Commande

Lorsqu'un client envoie un panier :

``` text
Meta Order webhook
        ↓
Whatooz Order
        ↓
Resolve products by SKU
        ↓
Calculate totals
        ↓
Create order
        ↓
Automation
```

## orders

``` text
id
organization_id
conversation_id
customer_id
meta_catalog_id
currency
subtotal
delivery_fee
discount
total
status
payment_status
payment_id
created_at
updated_at
```

## order_items

``` text
id
order_id
product_id
meta_product_retailer_id
name_snapshot
unit_price_snapshot
quantity
total
```

Toujours conserver un snapshot du nom/prix au moment de la commande.

------------------------------------------------------------------------

# 17. Paiement SasPay

SasPay doit être l'abstraction de paiement unique de Whatooz.

Documentation SasPay actuellement :

-   paiements softpay
-   checkout hébergé
-   vérification
-   retry
-   payout
-   liens de paiement
-   wallet
-   webhooks
-   transactions

SasPay indique également pour le Cameroun un coût à partir de 1,75 % et
un montant fixe de 100 FCFA selon le moyen de paiement ; le moteur de
facturation Whatooz doit toutefois considérer les frais réels
retournés/configurés plutôt que coder ce tarif en dur.

## Payment abstraction

``` text
PaymentProvider
   |
   +-- SasPay
```

Interface interne :

``` ts
interface PaymentProvider {
  createPayment(input): Promise<Payment>
  createCheckout(input): Promise<Checkout>
  verifyPayment(id): Promise<PaymentStatus>
  retryPayment(id): Promise<Payment>
  createPaymentLink(input): Promise<PaymentLink>
  getBalance(): Promise<Balance[]>
}
```

------------------------------------------------------------------------

# 18. Paiement d'une commande WhatsApp

Scénario principal :

``` text
Customer
   ↓
Catalog
   ↓
Cart
   ↓
Order webhook
   ↓
Whatooz order
   ↓
Automation
   ↓
Create SasPay checkout
   ↓
Send payment link
   ↓
Customer pays
   ↓
SasPay webhook
   ↓
Payment verified
   ↓
Order = PAID
   ↓
Automation continues
```

Exemple :

``` text
ORDER RECEIVED
      ↓
CREATE PAYMENT
      ↓
SEND PAYMENT LINK
      ↓
WAIT PAYMENT
      ↓
IF payment.status == SUCCESS
      ├── Send thank-you message
      ├── Update order
      ├── Notify seller
      └── Send confirmation
```

------------------------------------------------------------------------

# 19. SasPay Webhook

Endpoint :

``` http
POST /api/webhooks/saspay
```

Process :

``` text
receive
 ↓
verify authenticity
 ↓
deduplicate event
 ↓
store raw event
 ↓
resolve payment
 ↓
if pending -> verify against SasPay
 ↓
update payment
 ↓
update order
 ↓
emit payment.updated
```

Ne jamais considérer uniquement le frontend comme preuve de paiement.

------------------------------------------------------------------------

# 20. Payment statuses

Normaliser :

``` text
PENDING
PROCESSING
SUCCESS
FAILED
CANCELLED
EXPIRED
REFUNDED
```

Transitions invalides doivent être rejetées.

Exemple :

``` text
SUCCESS -> PENDING
```

interdit sauf mécanisme explicitement prévu par SasPay.

------------------------------------------------------------------------

# 21. Wallet

Whatooz doit séparer :

### Wallet SasPay marchand

Solde réel chez SasPay.

### Wallet Whatooz

Solde/usage interne éventuel pour :

-   crédits
-   remboursements
-   usage
-   bonus

Ne jamais mélanger les deux.

------------------------------------------------------------------------

# 22. Automation Builder

## 22.1 Philosophie

Le builder doit être comparable conceptuellement à :

-   n8n
-   Make

mais beaucoup plus simple.

Le canvas est une représentation de la logique.

Le formulaire détaillé n'est jamais affiché directement dans le node.

Architecture :

``` text
Canvas
   ↓
Node
   ↓
Inspector
```

------------------------------------------------------------------------

# 23. Canvas Automation

React Flow.

Contraintes :

-   canvas viewport limité
-   zoom
-   pan
-   minimap discret
-   grille très légère
-   nodes compacts
-   edges fins
-   courbes fluides
-   sélection claire
-   aucune énorme carte
-   aucun formulaire dans le node

------------------------------------------------------------------------

# 24. Node anatomy

``` text
┌──────────────────────────────┐
│ Send WhatsApp message    ⋯  │
├──────────────────────────────┤
│ Bonjour {{customer.name}}    │
│                              │
│ • Text                       │
│ • 1 button                   │
└──────────────────────────────┘
```

Le node ne montre que les informations utiles.

------------------------------------------------------------------------

# 25. Inspector Automation

À droite :

``` text
NODE
──────────────────

Send WhatsApp message

Recipient
[ Conversation user ]

Message
[ Bonjour {{name}} ]

Message type
[ Text ]

Variables
...

Advanced
...
```

Le panneau doit être scrollable indépendamment du canvas.

------------------------------------------------------------------------

# 26. Catégories de nodes Automation

## Triggers

``` text
Incoming message
Keyword
Button reply
List reply
Order received
Flow completed
Payment completed
Payment failed
Customer created
Schedule
Webhook
Manual
Conversation assigned
Conversation closed
```

## WhatsApp actions

``` text
Send text
Send image
Send video
Send audio
Send document
Send location
Send contact
Send reaction
Send template
Send interactive buttons
Send list
Send catalog
Send product
Send product carousel
Send flow
Mark read
Typing indicator
```

## Commerce

``` text
Send catalog
Send product
Send carousel
Get product
Get order
Create order
Update order
Create payment
Create payment link
Check payment
```

## Logic

``` text
IF
Switch
Filter
Merge
Split
Wait
Delay
Loop
Set variable
Format data
Transform data
```

## Human support

``` text
Assign conversation
Unassign
Assign team
Pause automation
Resume automation
Add tag
Set priority
Create note
```

## External

``` text
HTTP Request
Webhook
JSON transform
```

## End

``` text
Stop
End automation
```

------------------------------------------------------------------------

# 27. Variables

Un système uniforme de variables doit exister.

Exemples :

``` text
customer.name
customer.phone
customer.wa_id

conversation.id
conversation.assignee

order.id
order.total
order.currency
order.items

payment.id
payment.status
payment.checkout_url

message.text

flow.response
```

UI :

``` text
{{ customer.name }}
{{ order.total }}
{{ payment.checkout_url }}
```

Le picker de variables doit être présent dans tous les champs
compatibles.

------------------------------------------------------------------------

# 28. Conditions

Support :

``` text
equals
not equals
contains
not contains
starts with
ends with
greater than
less than
greater or equal
less or equal
exists
empty
regex
```

Types :

``` text
string
number
boolean
date
array
object
```

------------------------------------------------------------------------

# 29. Exécution

Chaque workflow doit avoir :

``` text
version
status
published_version
draft_version
```

Un workflow publié doit être immutable au niveau de l'exécution.

Les nouvelles modifications sont une nouvelle version.

------------------------------------------------------------------------

# 30. Execution engine

``` text
Event
 ↓
Trigger matcher
 ↓
Create execution
 ↓
Load workflow version
 ↓
Execute node
 ↓
Persist result
 ↓
Resolve next edge
 ↓
Execute next node
```

## execution

``` text
id
workflow_id
workflow_version_id
organization_id
trigger_event_id
contact_id
conversation_id
status
started_at
completed_at
error
```

## execution_steps

``` text
id
execution_id
node_id
status
input
output
error
started_at
completed_at
duration_ms
```

------------------------------------------------------------------------

# 31. Idempotence

Chaque événement Meta/SasPay doit posséder :

``` text
provider_event_id
```

avec index unique par provider.

Un même webhook reçu 5 fois ne doit exécuter le workflow qu'une seule
fois.

------------------------------------------------------------------------

# 32. Retry

Nodes externes :

``` text
HTTP
Meta
SasPay
```

doivent avoir :

``` text
retry count
backoff
timeout
fallback
```

Exemple :

``` text
retry 1 -> 1s
retry 2 -> 3s
retry 3 -> 10s
```

Les valeurs doivent être configurables.

------------------------------------------------------------------------

# 33. Flow Builder

Le Flow Builder est un canvas distinct mais partage le design system du
Automation Builder.

Différence :

``` text
Automation node = action / logic
Flow node = screen
```

------------------------------------------------------------------------

# 34. Architecture Flow Builder

``` text
Flow Builder
|
+-- Screen list
|
+-- Canvas
|
+-- Inspector
|
+-- Preview
|
+-- Validation
|
+-- Meta sync
|
+-- Versioning
```

------------------------------------------------------------------------

# 35. Flow node

Le node représente une miniature de l'écran WhatsApp.

Il ne doit jamais afficher toute la configuration.

Exemple :

``` text
┌──────────────────────┐
│ Welcome           ⋯ │
├──────────────────────┤
│                      │
│      Welcome         │
│                      │
│  Enter your details  │
│                      │
│   [ Continue ]       │
│                      │
└──────────────────────┘
```

Taille cible :

``` text
~280-320px width
~420-520px height
```

La preview interne doit être scalée.

------------------------------------------------------------------------

# 36. Start / End

Start :

``` text
● START
```

End :

``` text
✓ SUCCESS
```

ou terminal non-success selon configuration.

Le Flow Builder doit comprendre que Meta Flow n'est pas simplement un
graphe libre : les écrans, les actions de navigation et les terminaux
doivent produire un JSON Meta valide.

------------------------------------------------------------------------

# 37. Flow Inspector

Lorsqu'un écran est sélectionné :

``` text
SCREEN

Name
Title

Components

+ Add component

Navigation

Next
Back

Data

Endpoint
```

Les composants sont configurés dans le panneau.

------------------------------------------------------------------------

# 38. Flow preview

Trois niveaux :

### Node preview

Petite miniature.

### Inspector preview

Aperçu plus grand.

### Full preview

Simulation interactive.

Le canvas ne doit jamais devenir gigantesque parce qu'un écran possède
beaucoup de composants.

------------------------------------------------------------------------

# 39. Flow JSON engine

Whatooz ne doit pas stocker uniquement un JSON arbitraire.

Il faut un modèle intermédiaire :

``` text
Whatooz Flow Model
        ↓
Meta Flow JSON Compiler
        ↓
Meta Flow JSON
```

Et inversement :

``` text
Meta Flow JSON
        ↓
Parser
        ↓
Whatooz Flow Model
```

Cela permet :

-   compatibilité versions
-   validation
-   UI builder
-   migration
-   import/export
-   rollback

------------------------------------------------------------------------

# 40. Versioning Meta Flow

Le builder doit supporter une matrice de compatibilité.

Configuration :

``` text
flow_json_version
data_api_version
message_version
```

La version ne doit pas être hardcodée dans les composants.

Créer :

``` text
MetaFlowVersionRegistry
```

Exemple :

``` ts
{
  jsonVersion: "7.3",
  dataApiVersion: "4.0",
  supportedComponents: [...],
  deprecatedComponents: [...],
  rules: [...]
}
```

Le registre doit pouvoir être mis à jour sans réécrire l'éditeur.

------------------------------------------------------------------------

# 41. Composants Flow à supporter

Le builder doit couvrir les composants Meta disponibles pour la version
sélectionnée, notamment selon compatibilité :

### Texte

``` text
TextHeading
TextSubheading
TextBody
TextCaption
RichText
```

### Inputs

``` text
TextInput
```

### Sélections

``` text
RadioButtonsGroup
CheckboxGroup
Dropdown
ChipsSelector
NavigationList
```

### Dates

``` text
DatePicker
CalendarPicker
```

### Médias

``` text
Image
PhotoPicker
DocumentPicker
```

### Structure / logique

``` text
Form
If
Switch
```

### Action

``` text
Footer
```

Le registre doit permettre l'ajout de nouveaux composants Meta sans
réarchitecture du builder.

------------------------------------------------------------------------

# 42. Flow actions

Le moteur doit représenter les actions Meta, notamment :

``` text
navigate
data_exchange
complete
```

Les propriétés doivent être versionnées.

------------------------------------------------------------------------

# 43. Terminal Flow

Un écran terminal doit être configuré explicitement.

Exemple conceptuel :

``` json
{
  "terminal": true,
  "success": true
}
```

Whatooz doit distinguer :

``` text
terminal success
terminal failure
normal screen
```

------------------------------------------------------------------------

# 44. Flow endpoint

Un Flow avec endpoint doit avoir :

``` text
endpoint_uri
data_api_version
encryption configuration
```

L'endpoint sert notamment à :

-   récupérer des données dynamiques
-   contrôler la navigation
-   répondre aux soumissions
-   terminer le Flow
-   transmettre les paramètres de completion

Meta demande un endpoint HTTPS et un mécanisme de chiffrement pour les
données du Flow.

------------------------------------------------------------------------

# 45. Endpoint Flow Whatooz

Whatooz doit pouvoir fournir automatiquement :

``` http
POST /api/meta/flows/:flowId/endpoint
```

Architecture :

``` text
WhatsApp
  ↓
Encrypted request
  ↓
Whatooz Flow Endpoint
  ↓
Decrypt
  ↓
Resolve flow
  ↓
Execute flow data logic
  ↓
Build response
  ↓
Encrypt
  ↓
WhatsApp
```

La clé privée doit rester uniquement côté backend.

------------------------------------------------------------------------

# 46. Data exchange

Réponse intermédiaire :

``` json
{
  "screen": "NEXT_SCREEN",
  "data": {
    "property": "value"
  }
}
```

Completion :

``` json
{
  "screen": "SUCCESS",
  "data": {
    "extension_message_response": {
      "params": {
        "flow_token": "FLOW_TOKEN",
        "order_id": "123",
        "customer_id": "456"
      }
    }
  }
}
```

------------------------------------------------------------------------

# 47. Flow token

Chaque Flow envoyé depuis Whatooz doit pouvoir générer :

``` text
flow_token
```

Le token doit identifier :

``` text
organization
flow
execution
customer
timestamp
```

Ne jamais mettre des informations sensibles directement dans le token.

Le backend doit vérifier le token lors des data exchanges.

------------------------------------------------------------------------

# 48. Flow response webhook

Lorsqu'un Flow est terminé, Meta envoie une réponse via le webhook
messages.

Le moteur doit reconnaître :

``` text
interactive.type = nfm_reply
```

et parser :

``` text
response_json
```

Le résultat devient :

``` text
flow.completed
```

Puis peut déclencher un Automation Workflow.

------------------------------------------------------------------------

# 49. Flow lifecycle

Whatooz doit représenter :

``` text
DRAFT
PUBLISHED
THROTTLED
BLOCKED
DEPRECATED
```

Meta peut déplacer automatiquement un Flow vers THROTTLED/BLOCKED selon
la santé de l'endpoint.

Whatooz doit afficher cet état clairement.

------------------------------------------------------------------------

# 50. Flow publishing pipeline

``` text
Draft
 ↓
Local validation
 ↓
Meta-compatible validation
 ↓
Generate JSON
 ↓
Upload JSON
 ↓
Set endpoint
 ↓
Connect app
 ↓
Health check
 ↓
Publish
 ↓
Store Meta Flow ID
```

Ne jamais afficher uniquement :

``` text
Published
```

sans vérifier la réponse Meta.

------------------------------------------------------------------------

# 51. Flow validation

Validation en trois niveaux :

### UI validation

Erreurs immédiates.

### Compiler validation

Le modèle Whatooz est transformable en JSON Meta.

### Meta validation

Le JSON final est envoyé à Meta en draft et les `validation_errors` sont
récupérées.

Afficher les erreurs :

``` text
Node
Component
Property
Line
Column
JSON path
```

Exemple :

``` text
Screen: Welcome
Component: TextInput
Property: name

Name cannot be empty.
```

------------------------------------------------------------------------

# 52. Automation ↔ Flow

Les deux systèmes doivent communiquer.

Nodes Automation :

``` text
Send Flow
Wait for Flow completion
Get Flow response
```

Triggers :

``` text
Flow completed
Flow failed
```

Exemple :

``` text
Incoming message
      ↓
Send Flow
      ↓
Wait
      ↓
Flow completed
      ↓
IF customer.selected_product
      ↓
Create order
      ↓
Create SasPay payment
```

------------------------------------------------------------------------

# 53. Templates

Whatooz doit gérer :

``` text
template list
template status
template category
template language
template components
template variables
template quality
```

Flow templates doivent pouvoir être associés.

Meta permet notamment d'utiliser :

``` text
flow_id
flow_name
flow_json
```

dans les scénarios prévus par son API.

------------------------------------------------------------------------

# 54. Message abstraction

Créer un `WhatsAppMessageBuilder`.

``` ts
sendText()
sendImage()
sendVideo()
sendAudio()
sendDocument()
sendTemplate()
sendInteractive()
sendProduct()
sendProductList()
sendProductCarousel()
sendCatalog()
sendFlow()
```

Chaque méthode compile vers le payload Meta officiel.

Le reste de Whatooz ne doit jamais construire manuellement des payloads
Meta dispersés dans le code.

------------------------------------------------------------------------

# 55. Meta API adapter

Créer :

``` text
MetaWhatsAppClient
```

Responsabilités :

-   authentication
-   API version
-   retry
-   rate limiting
-   error normalization
-   request logging
-   idempotency
-   webhook subscription
-   WABA management

------------------------------------------------------------------------

# 56. API versioning

Centraliser :

``` env
META_GRAPH_API_VERSION
```

Ne jamais écrire :

``` text
v23.0
```

dans 40 fichiers.

Les endpoints doivent être construits :

``` ts
graphUrl(version, path)
```

Prévoir migration de version.

------------------------------------------------------------------------

# 57. Error handling Meta

Normaliser :

``` text
MetaApiError
MetaPermissionError
MetaRateLimitError
MetaValidationError
MetaTemplateError
MetaFlowError
MetaPolicyError
```

UI :

``` text
Permission required
Template rejected
Flow invalid
Number unavailable
Rate limit reached
Account restricted
```

Ne jamais afficher directement un JSON brut à l'utilisateur final.

------------------------------------------------------------------------

# 58. Automation error branches

Chaque node externe doit pouvoir avoir :

``` text
success
error
timeout
```

Exemple :

``` text
Create payment
     |
     +---- success ----> Send confirmation
     |
     +---- error ------> Notify agent
     |
     +---- timeout ----> Retry
```

------------------------------------------------------------------------

# 59. Debugger Automation

Ajouter un mode :

``` text
Test workflow
```

Le développeur peut choisir :

``` text
contact
event
payload
```

Puis voir :

``` text
Node 1
SUCCESS
12ms

Node 2
SUCCESS
140ms

Node 3
FAILED
Meta error
```

------------------------------------------------------------------------

# 60. Debugger Flow

Le Flow Builder doit avoir un panneau d'actions/debug.

Afficher :

``` text
screen opened
navigation
data exchange
request
response
validation
completion
```

Cela reproduit l'idée du debugger Meta mais dans Whatooz.

------------------------------------------------------------------------

# 61. Commerce Builder integration

Un utilisateur doit pouvoir sélectionner :

``` text
Send catalog
```

puis :

``` text
Catalog
[ My WhatsApp Catalog ]

Display
[ Full catalog ]
```

ou :

``` text
Send product carousel

Products
[ Select from catalog ]

Selection
[ Featured ]
```

L'utilisateur ne recrée pas les produits.

------------------------------------------------------------------------

# 62. Collections / filtres

Whatooz peut créer des collections locales :

``` text
Featured
New
Promotion
Phones
Clothing
Services
```

mais les produits doivent pointer vers :

``` text
meta_product_retailer_id
```

------------------------------------------------------------------------

# 63. Commerce trigger

Exemple :

``` text
Trigger:
Order received
```

Filtres :

``` text
order.total > 10000
product contains SKU
quantity >= 2
```

------------------------------------------------------------------------

# 64. Paiement post-order

Template de workflow :

``` text
ORDER RECEIVED
       ↓
CALCULATE TOTAL
       ↓
CREATE SASPAY CHECKOUT
       ↓
SEND PAYMENT LINK
       ↓
WAIT PAYMENT
       ↓
       ├── SUCCESS
       │      ↓
       │   MARK ORDER PAID
       │      ↓
       │   SEND THANK YOU
       │
       └── FAILED
              ↓
           SEND RETRY LINK
```

------------------------------------------------------------------------

# 65. Paiement via WhatsApp

Si nécessaire, envoyer :

``` text
Voici votre commande.

Total : 15 000 FCFA

Payez ici :
{{payment.checkout_url}}
```

Le lien peut également être utilisé dans :

-   bouton URL
-   template
-   message texte
-   Flow

selon ce que le canal Meta autorise dans le contexte concerné.

------------------------------------------------------------------------

# 66. Mini-site existant

Ne pas supprimer immédiatement le mini-site Whatooz.

Faire évoluer :

``` text
Meta Catalog
      |
      +--> WhatsApp commerce
      |
      +--> Whatooz mini-site
```

Les deux utilisent une couche commerce commune.

------------------------------------------------------------------------

# 67. Product model

``` text
products
  id
  organization_id
  meta_catalog_id
  meta_product_id
  retailer_id
  name
  description
  price
  currency
  image_url
  availability
  synced_at
```

------------------------------------------------------------------------

# 68. Sync catalogue

Job :

``` text
syncCatalog()
```

Déclenchement :

-   onboarding
-   manuel
-   scheduled
-   webhook/event si disponible

Résolution :

``` text
Meta product retailer_id
       ↓
Whatooz product
```

------------------------------------------------------------------------

# 69. Pricing Whatooz

Le moteur doit séparer :

``` text
Meta cost
SasPay cost
Whatooz subscription
Whatooz margin
```

Formule conceptuelle :

``` text
customer_price =
    base_plan
  + usage_charges
  + optional_overages
```

Et :

``` text
gross_margin =
    customer_revenue
  - meta_cost
  - saspay_cost
  - infrastructure_cost
```

------------------------------------------------------------------------

# 70. Meta pricing engine

Ne jamais coder les prix Meta directement dans les workflows.

Créer :

``` text
meta_rate_cards
```

avec :

``` text
country
currency
category
pricing_model
effective_from
effective_to
unit
rate
source
```

Les tarifs Meta changent périodiquement.

Le moteur doit donc être configurable.

------------------------------------------------------------------------

# 71. Plans SaaS

Structure recommandée :

``` text
FREE TRIAL
STARTER
BUSINESS
PRO
ENTERPRISE
```

Les noms et prix restent configurables depuis l'admin.

------------------------------------------------------------------------

# 72. Essai gratuit

Durée :

``` text
30 jours
```

Mais avec limites strictes.

Exemple :

``` text
1 WhatsApp number
1 user
X conversations
X automations
X flows
X messages/templates
X catalog products
X orders
X executions
```

Le compte doit pouvoir tester le produit sans bénéficier de ressources
coûteuses illimitées.

------------------------------------------------------------------------

# 73. Admin interne

Le compte administrateur Whatooz doit avoir :

``` text
plan = INTERNAL_ADMIN
billing_exempt = true
quota_exempt = true
feature_override = ALL
```

Cela ne doit pas être simulé par un énorme plan payant.

Créer un vrai flag serveur :

``` text
is_platform_admin
```

et vérifier côté backend.

Ne jamais faire confiance à un rôle frontend.

------------------------------------------------------------------------

# 74. Feature entitlements

Créer :

``` text
plan_features
organization_entitlements
usage_counters
```

Exemples :

``` text
max_users
max_phone_numbers
max_flows
max_automations
max_executions
max_orders
max_catalog_products
max_templates
max_monthly_messages
max_storage
```

------------------------------------------------------------------------

# 75. Limites

Chaque limite doit être vérifiée côté serveur :

``` ts
assertEntitlement(
  organization,
  "max_flows"
)
```

et :

``` ts
assertUsage(
  organization,
  "flow_count"
)
```

------------------------------------------------------------------------

# 76. Dépassement

Trois stratégies :

``` text
BLOCK
WARN
OVERAGE
```

Exemple :

Starter :

``` text
10 automations
```

À la 11e :

``` text
Upgrade required
```

Business :

``` text
100 automations
```

Enterprise :

``` text
custom
```

------------------------------------------------------------------------

# 77. Billing

SasPay gère :

-   checkout
-   paiement
-   liens
-   abonnements si utilisés
-   statut de transaction

Whatooz gère :

-   plans
-   entitlements
-   dates
-   facturation interne
-   usage
-   marge

------------------------------------------------------------------------

# 78. Tables billing

## plans

``` text
id
name
slug
monthly_price
currency
trial_days
active
```

## plan_features

``` text
plan_id
feature
limit_value
limit_type
```

## subscriptions

``` text
id
organization_id
plan_id
status
trial_started_at
trial_ends_at
current_period_start
current_period_end
saspay_customer_reference
saspay_subscription_reference
```

## invoices

``` text
id
organization_id
subscription_id
amount
currency
status
saspay_payment_id
due_at
paid_at
```

------------------------------------------------------------------------

# 79. Paiement abonnement

``` text
Plan selected
   ↓
Create SasPay checkout
   ↓
Customer pays
   ↓
SasPay webhook
   ↓
Activate subscription
```

Ne jamais activer un abonnement uniquement sur le retour navigateur.

------------------------------------------------------------------------

# 80. Billing admin

L'admin Whatooz doit voir :

``` text
MRR
active subscriptions
trial users
churn
payment failures
Meta costs
SasPay costs
gross revenue
gross margin
```

------------------------------------------------------------------------

# 81. Cost ledger

Créer une table :

``` text
cost_events
```

Types :

``` text
META_MESSAGE
SASPAY_TRANSACTION
INFRASTRUCTURE
STORAGE
AI_USAGE
```

Exemple :

``` text
organization
provider
provider_reference
cost_type
amount
currency
metadata
created_at
```

------------------------------------------------------------------------

# 82. Revenue ledger

``` text
revenue_events
```

Permet de calculer :

``` text
revenue
cost
gross margin
```

par organisation.

------------------------------------------------------------------------

# 83. Team billing

Le plan peut limiter :

``` text
users
```

mais les permissions ne doivent jamais être déduites du nombre de
conversations.

------------------------------------------------------------------------

# 84. UI Billing

Page :

``` text
Your plan

Business
25 000 FCFA / month

Usage
██████████░░ 78%

Messages
78 / 100

Flows
12 / 20

Automations
8 / 20

Users
4 / 5

[Upgrade]
```

------------------------------------------------------------------------

# 85. Admin panel

Routes :

``` text
/admin
/admin/organizations
/admin/users
/admin/subscriptions
/admin/payments
/admin/meta-costs
/admin/usage
/admin/webhooks
/admin/automations
/admin/flows
/admin/errors
```

------------------------------------------------------------------------

# 86. Observability

Chaque intégration doit être observable.

Logs :

``` text
request_id
organization_id
provider
endpoint
status_code
latency
error_code
created_at
```

Ne jamais logger :

-   access token
-   app secret
-   private keys
-   données sensibles de paiement
-   contenu sensible de Flow

------------------------------------------------------------------------

# 87. Webhook replay

Admin :

``` text
Webhook event
[View]

Payload
[redacted]

Status
FAILED

[Retry]
[Replay]
```

Replay doit être idempotent.

------------------------------------------------------------------------

# 88. Security

## Secrets

Stockage chiffré.

## RLS

Obligatoire.

## Backend-only

-   Meta tokens
-   SasPay API key
-   Meta App Secret
-   Flow private key

## Audit

Chaque action sensible :

``` text
user
action
resource
before
after
timestamp
ip/device if appropriate
```

------------------------------------------------------------------------

# 89. Data retention

Prévoir des politiques de rétention configurables.

Les données Meta et les données clients ne doivent pas être conservées
indéfiniment sans raison.

------------------------------------------------------------------------

# 90. UX mobile

Le dashboard doit rester utilisable sur mobile.

Mais les builders sont desktop-first.

Mobile Flow Builder :

``` text
screen list
+
inspector
```

Canvas très simplifié.

Ne pas tenter de faire un énorme workflow desktop identique sur
téléphone.

------------------------------------------------------------------------

# 91. Responsive Builder

Desktop :

``` text
Sidebar | Canvas | Inspector
```

Tablet :

``` text
Canvas
Inspector drawer
```

Mobile :

``` text
Canvas
+
bottom sheet inspector
```

------------------------------------------------------------------------

# 92. Automation Builder UX

Toolbar minimale :

``` text
[ + ] [ Zoom ] [ Fit ] [ Undo ] [ Redo ]        [Test] [Publish]
```

Node creation :

``` text
+ Add node
```

puis recherche :

``` text
Search actions...
```

------------------------------------------------------------------------

# 93. Flow Builder UX

Toolbar :

``` text
[ + Screen ] [ Fit ] [ Undo ] [ Redo ]
[Preview] [Validate] [Publish]
```

Panneau gauche :

``` text
Screens
```

Canvas :

``` text
Flow
```

Panneau droit :

``` text
Inspector
```

------------------------------------------------------------------------

# 94. Node creation

Ne jamais ouvrir un formulaire géant.

Lorsqu'on clique :

``` text
+ Add node
```

ouvrir une palette :

``` text
Search...

WhatsApp
Commerce
Logic
Payments
Team
External
```

Sélectionner.

Le node apparaît immédiatement.

------------------------------------------------------------------------

# 95. Flow component creation

Dans l'inspector :

``` text
Components

+ Add component
```

Palette :

``` text
Text
Input
Choice
Date
Media
Button
Condition
```

Le système filtre automatiquement selon :

``` text
Flow JSON version
```

------------------------------------------------------------------------

# 96. Flow JSON import/export

Options :

``` text
Import JSON
Export JSON
Copy JSON
```

Le JSON est un mode avancé.

Ne pas en faire le parcours principal.

------------------------------------------------------------------------

# 97. Flow schema compiler

Chaque composant doit posséder :

``` ts
type ComponentDefinition = {
  type: string
  minVersion: string
  maxVersion?: string
  schema: JSONSchema
  editor: EditorDefinition
  renderer: PreviewRenderer
  compiler: MetaCompiler
  validator: Validator
}
```

Cela rend le builder extensible.

------------------------------------------------------------------------

# 98. React Flow architecture

Créer :

``` text
FlowCanvas
AutomationCanvas
NodeRenderer
EdgeRenderer
InspectorPanel
NodePalette
VariablePicker
ValidationPanel
ExecutionPanel
```

Ne pas mélanger les deux builders dans un composant monolithique.

------------------------------------------------------------------------

# 99. Shared canvas primitives

``` text
CanvasShell
CanvasToolbar
CanvasViewport
CanvasGrid
CanvasMiniMap
CanvasSelection
CanvasContextMenu
```

Puis :

``` text
AutomationCanvas
FlowCanvas
```

------------------------------------------------------------------------

# 100. Performance

Le canvas doit rester fluide avec :

``` text
100+ nodes
```

minimum.

Utiliser :

-   memoization
-   lazy rendering
-   virtualization si nécessaire
-   throttled updates
-   debounced persistence
-   local draft state

------------------------------------------------------------------------

# 101. Persistence Builder

Ne pas sauvegarder chaque mouvement directement en DB.

Faire :

``` text
local state
 ↓
debounce
 ↓
autosave
```

Afficher :

``` text
Saved
Saving...
Unsaved changes
```

------------------------------------------------------------------------

# 102. Versioning Automation

``` text
workflow
workflow_versions
```

Publier :

``` text
Draft v4
 ↓
Publish
 ↓
Active v4
```

Les exécutions utilisent toujours la version active au moment du
déclenchement.

------------------------------------------------------------------------

# 103. Versioning Flow

Même principe :

``` text
flow
flow_versions
```

Mais le mapping Meta doit être :

``` text
Whatooz flow version
      ↓
Meta Flow ID / version
```

------------------------------------------------------------------------

# 104. Draft vs Meta draft

Ne pas confondre :

``` text
Whatooz draft
Meta draft
```

Exemple :

``` text
Whatooz:
Draft

Meta:
PUBLISHED
```

Cela doit être affiché.

------------------------------------------------------------------------

# 105. Publish safety

Avant publication :

``` text
✓ All nodes valid
✓ No orphan node
✓ Start exists
✓ End exists when required
✓ All connections valid
✓ Variables valid
✓ Meta JSON valid
✓ Endpoint healthy if required
✓ Meta account ready
```

------------------------------------------------------------------------

# 106. Flow health

Afficher :

``` text
Healthy
Limited
Throttled
Blocked
```

et les erreurs associées.

------------------------------------------------------------------------

# 107. Automation analytics

Dashboard :

``` text
Executions
Success rate
Failure rate
Average duration
Messages sent
Orders generated
Payments
Revenue
```

------------------------------------------------------------------------

# 108. Flow analytics

``` text
Flow opens
Screen views
Completion rate
Drop-off by screen
Errors
Endpoint latency
Endpoint availability
```

------------------------------------------------------------------------

# 109. Commerce analytics

``` text
Catalog views
Product interactions
Orders
Average order value
Paid orders
Failed payments
Revenue
Conversion
```

------------------------------------------------------------------------

# 110. Inbox analytics

``` text
Open conversations
Assigned conversations
First response time
Resolution time
Messages
Agents activity
```

------------------------------------------------------------------------

# 111. Team analytics

Manager peut voir :

``` text
Agent
Conversations handled
Open
Closed
Response time
Orders
Revenue assisted
```

Ne pas transformer les métriques en classement obligatoire.

------------------------------------------------------------------------

# 112. Notifications

Types :

``` text
New conversation
Conversation assigned
Order received
Payment successful
Payment failed
Flow error
Meta account issue
Template rejected
Subscription expiring
```

------------------------------------------------------------------------

# 113. Empty states

Toujours pédagogiques.

Exemple :

``` text
No automations yet

Create your first automation
to respond automatically to your customers.

[Create automation]
```

Pas d'écran vide.

------------------------------------------------------------------------

# 114. Onboarding utilisateur

Après connexion :

``` text
1. Connect WhatsApp
2. Connect number
3. Import/sync catalog
4. Invite team
5. Create first automation
6. Create first Flow
7. Test
8. Publish
```

------------------------------------------------------------------------

# 115. First automation wizard

Proposer templates :

``` text
Welcome message
Product inquiry
Order + payment
Customer support
Lead collection
Appointment
```

Mais toujours générer un vrai workflow éditable.

------------------------------------------------------------------------

# 116. First Flow templates

``` text
Lead form
Appointment
Product selection
Customer information
Order confirmation
Survey
Contact
```

Le template doit produire le même modèle interne que le builder manuel.

------------------------------------------------------------------------

# 117. Product selection Flow + Commerce

Exemple :

``` text
START
 ↓
Welcome
 ↓
Product selection
 ↓
Customer details
 ↓
Confirmation
 ↓
SUCCESS
```

Puis Flow completion :

``` text
flow.completed
 ↓
Create order
 ↓
Create SasPay checkout
 ↓
Send payment
```

------------------------------------------------------------------------

# 118. API interne Whatooz

Exemples :

``` http
GET /api/organizations/:id
GET /api/whatsapp/accounts
GET /api/whatsapp/phones

GET /api/conversations
POST /api/conversations/:id/assign
POST /api/conversations/:id/takeover
POST /api/conversations/:id/release

GET /api/products
POST /api/products/sync

GET /api/orders
GET /api/orders/:id

GET /api/automations
POST /api/automations
PUT /api/automations/:id
POST /api/automations/:id/publish

GET /api/flows
POST /api/flows
PUT /api/flows/:id
POST /api/flows/:id/validate
POST /api/flows/:id/sync
POST /api/flows/:id/publish

POST /api/payments
GET /api/payments/:id
POST /api/payments/:id/verify

GET /api/team
POST /api/team/invite
PATCH /api/team/:id
DELETE /api/team/:id
```

------------------------------------------------------------------------

# 119. Meta API endpoints à encapsuler

La couche Meta doit au minimum prévoir des adaptateurs pour :

``` text
WABA
GET /{WABA_ID}

Phone numbers
GET /{WABA_ID}/phone_numbers

Messages
POST /{PHONE_NUMBER_ID}/messages

Templates
/{WABA_ID}/message_templates

Flows
POST /{WABA_ID}/flows
GET /{WABA_ID}/flows
GET /{FLOW_ID}
POST /{FLOW_ID}
POST /{FLOW_ID}/assets
DELETE /{FLOW_ID}
POST /{FLOW_ID}/deprecate

Assigned users
GET /{WABA_ID}/assigned_users
POST /{WABA_ID}/assigned_users
DELETE /{WABA_ID}/assigned_users

Groups
POST /{PHONE_NUMBER_ID}/groups
GET /{PHONE_NUMBER_ID}/groups
POST /{GROUP_ID}/invite_link
DELETE /{GROUP_ID}/invite_link
POST /{GROUP_ID}/participants
DELETE /{GROUP_ID}/participants

WABA webhook subscription
POST /{WABA_ID}/subscribed_apps
```

Les chemins exacts doivent être construits avec une version Graph API
centralisée.

------------------------------------------------------------------------

# 120. Groups

Le module Groups doit rester séparé du commerce.

Meta Groups API permet notamment :

-   créer/supprimer des groupes
-   générer/réinitialiser des liens d'invitation
-   gérer les participants
-   récupérer les groupes actifs
-   gérer certains paramètres
-   envoyer/recevoir des messages

Important :

-   l'éligibilité Meta doit être vérifiée avant d'afficher les fonctions
    ;
-   l'API Group n'autorise pas tous les types de messages classiques ;
-   les messages commerce/interactifs ne doivent pas être supposés
    compatibles avec les groupes ;
-   l'interface doit désactiver les actions non supportées.

------------------------------------------------------------------------

# 121. Group automation

Nodes :

``` text
Create group
Get group
Get invite link
Reset invite link
Send group message
Add participant
Remove participant
Group participant joined
Group updated
```

Mais chaque node doit vérifier les capacités réelles de l'API.

------------------------------------------------------------------------

# 122. Meta rate limiting

Créer un middleware :

``` text
MetaRateLimiter
```

avec :

-   quotas
-   retry-after
-   exponential backoff
-   queue
-   circuit breaker

------------------------------------------------------------------------

# 123. Circuit breaker

Si Meta retourne une série d'erreurs :

``` text
CLOSED
 ↓
OPEN
 ↓
HALF_OPEN
 ↓
CLOSED
```

Éviter de continuer à envoyer des centaines de requêtes inutiles.

------------------------------------------------------------------------

# 124. Queue architecture

Recommandé :

``` text
Webhook
 ↓
Queue
 ↓
Worker
 ↓
Meta/SasPay
```

Ne pas faire toute l'exécution lourde dans la requête webhook.

------------------------------------------------------------------------

# 125. Transactional integrity

Commande + paiement :

``` text
create order
create payment
```

doit avoir des transitions transactionnelles autant que possible.

------------------------------------------------------------------------

# 126. Idempotency payment

Utiliser :

``` text
organization_id
order_id
payment_attempt
```

comme référence interne.

Une même commande ne doit pas créer 5 paiements actifs par accident.

------------------------------------------------------------------------

# 127. Security Flow

Les données sensibles Flow doivent être marquées :

``` text
sensitive: true
```

lorsque Meta le permet.

Ne pas afficher les données sensibles dans :

-   logs
-   debugger
-   analytics
-   admin sans permission

------------------------------------------------------------------------

# 128. Audit log

Actions :

``` text
LOGIN
LOGOUT
INVITE_USER
REMOVE_USER
ASSIGN_CONVERSATION
SEND_MESSAGE
PUBLISH_AUTOMATION
PUBLISH_FLOW
CONNECT_WHATSAPP
CREATE_PAYMENT
REFUND
CHANGE_PLAN
```

------------------------------------------------------------------------

# 129. Feature flags

Prévoir :

``` text
feature_flags
```

Exemples :

``` text
native_catalog
product_carousel
flow_v7
groups
ai
team_inbox
saspay
```

------------------------------------------------------------------------

# 130. Migration depuis l'ancien Whatooz

Ne pas casser brutalement l'existant.

Étapes :

``` text
Old automation
    ↓
Legacy adapter
    ↓
New automation model
```

Les anciennes fonctionnalités doivent être migrées progressivement.

Baileys ne doit plus être une dépendance critique de production.

------------------------------------------------------------------------

# 131. Legacy isolation

Si une ancienne instance Baileys existe encore :

``` text
legacy_whatsapp_provider
```

isolé du nouveau :

``` text
official_whatsapp_provider
```

Aucun nouveau module ne doit dépendre directement de Baileys.

------------------------------------------------------------------------

# 132. Provider interface

Créer :

``` ts
interface WhatsAppProvider {
  sendMessage()
  sendTemplate()
  sendFlow()
  sendProduct()
  sendCatalog()
  getPhoneNumber()
  subscribeWebhooks()
}
```

Implémentations :

``` text
MetaCloudApiProvider
LegacyProvider (temporary)
```

------------------------------------------------------------------------

# 133. Definition of Done --- Dashboard

-   [ ] Island layout
-   [ ] Sidebar responsive
-   [ ] Collapsed navigation
-   [ ] Lucide icons
-   [ ] Unified spacing
-   [ ] Unified typography
-   [ ] Empty states
-   [ ] Tables
-   [ ] Status system
-   [ ] Toast system
-   [ ] Command search
-   [ ] Responsive mobile

------------------------------------------------------------------------

# 134. Definition of Done --- Automation Builder

-   [ ] React Flow
-   [ ] compact nodes
-   [ ] subtle grid
-   [ ] clean edges
-   [ ] node palette
-   [ ] inspector
-   [ ] variable picker
-   [ ] condition builder
-   [ ] versioning
-   [ ] publish
-   [ ] execution engine
-   [ ] debugger
-   [ ] retry
-   [ ] idempotency
-   [ ] error branches

------------------------------------------------------------------------

# 135. Definition of Done --- Flow Builder

-   [ ] screen nodes
-   [ ] start node
-   [ ] terminal node
-   [ ] screen preview
-   [ ] inspector
-   [ ] component palette
-   [ ] Meta Flow compiler
-   [ ] Meta Flow parser
-   [ ] version registry
-   [ ] validation
-   [ ] JSON import/export
-   [ ] interactive preview
-   [ ] endpoint configuration
-   [ ] encryption support
-   [ ] publishing
-   [ ] status monitoring
-   [ ] flow response handling

------------------------------------------------------------------------

# 136. Definition of Done --- Commerce

-   [ ] Meta catalog sync
-   [ ] product mapping by retailer ID
-   [ ] catalog message
-   [ ] single product
-   [ ] multi-product
-   [ ] product carousel
-   [ ] order webhook
-   [ ] local order
-   [ ] order items snapshots
-   [ ] payment integration
-   [ ] payment confirmation
-   [ ] workflow continuation

------------------------------------------------------------------------

# 137. Definition of Done --- Team

-   [ ] invite
-   [ ] roles
-   [ ] granular permissions
-   [ ] assignment
-   [ ] takeover
-   [ ] release
-   [ ] team queues
-   [ ] internal notes
-   [ ] audit
-   [ ] optional Meta WABA permission mapping

------------------------------------------------------------------------

# 138. Definition of Done --- Billing

-   [ ] plans
-   [ ] trial
-   [ ] entitlements
-   [ ] quotas
-   [ ] usage counters
-   [ ] SasPay checkout
-   [ ] webhook
-   [ ] invoice
-   [ ] admin exemption
-   [ ] cost ledger
-   [ ] margin dashboard

------------------------------------------------------------------------

# 139. Testing

## Unit

-   JSON compiler
-   validators
-   conditions
-   variables
-   pricing
-   entitlement
-   payment states

## Integration

-   Meta API mocks
-   SasPay mocks
-   webhook replay
-   order -\> payment
-   flow -\> completion
-   automation execution

## E2E

Scenario :

``` text
onboard
→ send message
→ catalog
→ order
→ payment
→ webhook
→ confirmation
```

Scenario :

``` text
send Flow
→ user fills form
→ Flow completes
→ webhook
→ automation
```

Scenario :

``` text
agent takes conversation
→ automation pauses
→ agent replies
→ agent releases
→ automation resumes
```

------------------------------------------------------------------------

# 140. Failure scenarios

Tester doit simuler :

-   Meta timeout
-   Meta 429
-   Meta permission error
-   Meta Flow validation error
-   Flow endpoint timeout
-   Flow encryption error
-   SasPay timeout
-   SasPay duplicate webhook
-   payment pending
-   payment failed
-   user removed
-   expired subscription
-   quota reached
-   worker crash
-   duplicate Meta webhook

------------------------------------------------------------------------

# 141. UX principle final

La règle absolue :

> **Le canvas sert à comprendre. L'inspector sert à configurer.**

Pour Automation :

``` text
Node = action
Inspector = configuration
```

Pour Flow :

``` text
Node = screen
Inspector = screen builder
```

Pour Dashboard :

``` text
Page = overview
Drawer/modal = detail
```

Cela évite de revenir au problème actuel : une interface qui ressemble à
un énorme formulaire et dépasse son propre canvas.

------------------------------------------------------------------------

# 142. Architecture finale

``` text
                           WHATHOOZ
                              |
              +---------------+---------------+
              |                               |
           PRODUCT                         PLATFORM
              |                               |
       +------+-------+                 +-----+------+
       |      |       |                 |            |
      Inbox Commerce Automation       Billing      Admin
       |      |       |                 |            |
       |      |       +----+            |            |
       |      |            |            |            |
       |      |       Automation Engine |            |
       |      |                         |            |
       |      +--> SasPay <--------------+            |
       |                                             |
       +---------------- Meta Adapter ---------------+
                              |
                  +-----------+-----------+
                  |           |           |
               Messages      Flows      Webhooks
                  |           |           |
                  +-----------+-----------+
                              |
                            META
```

------------------------------------------------------------------------

# 143. Priorité d'implémentation

## Phase 1 --- Fondations

1.  Design system
2.  Auth/RBAC
3.  Multi-tenant
4.  Meta provider
5.  Webhooks
6.  Inbox

## Phase 2 --- Commerce

1.  Catalog sync
2.  Product mapping
3.  Orders
4.  Commerce nodes
5.  SasPay
6.  Payment webhook

## Phase 3 --- Automation Builder

1.  Canvas
2.  Nodes
3.  Inspector
4.  Variables
5.  Conditions
6.  Execution engine
7.  Debugger
8.  Versioning

## Phase 4 --- Flow Builder

1.  Screen model
2.  Canvas
3.  Preview nodes
4.  Inspector
5.  Components
6.  Compiler
7.  Validation
8.  Meta sync
9.  Endpoint
10. Publishing
11. Response webhook

## Phase 5 --- Billing

1.  Plans
2.  Trial
3.  Entitlements
4.  Usage
5.  SasPay subscription payments
6.  Cost/margin ledger

## Phase 6 --- Advanced

1.  Groups
2.  Advanced analytics
3.  AI
4.  Advanced team routing
5.  Advanced commerce
6.  Flow templates

------------------------------------------------------------------------

# 144. Critères de réussite

Le produit est considéré comme correctement refactorisé lorsque :

### Un utilisateur non technique peut :

-   connecter son WhatsApp ;
-   voir ses conversations ;
-   inviter ses employés ;
-   envoyer un produit du catalogue ;
-   recevoir une commande ;
-   générer un paiement ;
-   construire une automatisation ;
-   créer un Flow sans toucher au JSON ;
-   prévisualiser son Flow ;
-   publier son Flow ;
-   déclencher une automatisation après paiement.

### Et un développeur peut :

-   ajouter un nouveau Meta message type ;
-   ajouter un nouveau Flow component ;
-   ajouter un nouveau node ;
-   ajouter un provider de paiement ;
-   changer une version Meta ;
-   modifier les tarifs/quotas ;
-   activer une feature flag ;

sans réécrire le produit.

------------------------------------------------------------------------

# 145. Règle d'architecture la plus importante

Ne jamais construire Whatooz autour des écrans actuels.

Construire Whatooz autour de **domaines stables** :

``` text
Organization
User
WhatsAppAccount
PhoneNumber
Contact
Conversation
Message
Catalog
Product
Order
Payment
Automation
AutomationVersion
Flow
FlowVersion
Template
Subscription
Usage
WebhookEvent
AuditLog
```

Les interfaces ne sont que des représentations de ces domaines.

------------------------------------------------------------------------

# 146. Documentation externe de référence

Meta : - WhatsApp Business Platform / Cloud API - WhatsApp Flows - Flows
API - Flow JSON - Webhooks - Catalogs - Groups - Embedded Signup -
Assigned Users Management API - Pricing

SasPay : - API REST - Checkout - SoftPay - Payment Links -
Verification - Payouts - Wallet - Webhooks

**Important :** les versions et limites Meta doivent être traitées comme
des données évolutives. Le code ne doit pas supposer qu'une version ou
un tarif reste éternellement valide.

------------------------------------------------------------------------

# 147. Résultat attendu

Whatooz doit donner l'impression :

``` text
                    SIMPLE
                       ↑
                       |
POWERFUL  ←────── WHATHOOZ ──────→  PROFESSIONAL
                       |
                       ↓
                    AFRICA
```

L'utilisateur ne doit jamais avoir besoin de comprendre :

-   Graph API
-   Flow JSON
-   webhooks
-   encryption
-   endpoints
-   tokens
-   Meta versioning
-   SasPay API
-   queues
-   workers

pour utiliser la plateforme.

Il doit seulement comprendre :

> **Quand ceci arrive → fais ceci.**

et pour les Flows :

> **Quand le client arrive ici → affiche cet écran → puis va ici.**

Tout le reste appartient au moteur Whatooz.
