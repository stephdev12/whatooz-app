# Politique de Confidentialité — Whatooz

**Dernière mise à jour :** 19 septembre 2026  
**Site Web :** https://whatooz.com  
**Contact Confidentialité :** privacy@whatooz.com / contact@whatooz.com  

---

## 1. Introduction & Présentation du Service

La présente Politique de Confidentialité s’applique à la plateforme logicielle **Whatooz** (« la Plateforme », « Nous »), exploitée en tant que service SaaS de CRM, d'automatisation des conversations et de messagerie d'entreprise via l'API WhatsApp Business (Meta Cloud API).

En tant que **Fournisseur Technologique (Tech Provider)**, Whatooz permet aux entreprises (« Entreprises Utilisatrices ») d'interagir avec leurs prospects et clients (« Utilisateurs Finaux ») directement via WhatsApp, de gérer des modèles de messages, des flux interactifs (WhatsApp Flows) et de déclencher des parcours transactionnels.

---

## 2. Données Personnelles Collectées

Dans le cadre du fonctionnement de la Plateforme, nous traitons les catégories de données suivantes :

1. **Données d'authentification et de compte entreprise :**
   - Nom, prénom, adresse email professionnelle, mot de passe sécurisé (hash bcrypt/argon2).
   - Informations d'identification Meta : WhatsApp Business Account ID (WABA ID), Phone Number ID, App ID, jetons d'accès chiffrés.
2. **Données de messagerie et de contacts clients :**
   - Numéros de téléphone des destinataires WhatsApp (format international E.164).
   - Nom et identifiants des contacts.
   - Contenu des messages texte, images, documents ou messages interactifs échangés.
   - Horodatages et statuts de remise des messages (envoyé, distribué, lu, échoué).
3. **Données des formulaires WhatsApp Flows :**
   - Réponses soumises par les utilisateurs finaux (choix de produits ou services, dates de rendez-vous, budgets, coordonnées de livraison).
4. **Données techniques et logs :**
   - Adresses IP, identifiants d'appareils, logs d'erreurs et de webhooks.

---

## 3. Finalités et Bases Légales du Traitement

Les données sont collectées et traitées exclusivement pour :
- **L'exécution du contrat de service :** Fournir l'accès au tableau de bord Whatooz, synchroniser les messages entrants et sortants avec l'API Cloud de WhatsApp.
- **La gestion de la relation client :** Permettre aux entreprises d'assurer le service client, le suivi commercial et le traitement des commandes.
- **L'exécution d'automatisations et de commandes :** Déclencher des réponses automatiques selon des mots-clés et générer des liens de paiement sécurisés.
- **Le respect des obligations légales et de sécurité :** Prévenir le spam, les abus et se conformer aux politiques d'utilisation commerciale de Meta.

---

## 4. Partage et Sous-traitance des Données

Whatooz ne commercialise, ne loue, ni ne cède aucune donnée personnelle ou liste de contacts à des tiers à des fins publicitaires.

Les données sont partagées uniquement avec les sous-traitants techniques indispensables :
- **Meta Platforms, Inc. / WhatsApp LLC :** Pour l'acheminement des messages via l'API Cloud officielle de WhatsApp (conforme au *WhatsApp Business Data Processing Terms*).
- **Hébergement & Base de Données Sécurisée (Supabase / Cloud Infrastructure) :** Hébergement des données avec chiffrement au repos (AES-256) et contrôles d'accès stricts (RLS).
- **Fournisseurs de Passerelle de Paiement (ex: Wave, Orange Money, Stripe) :** Transmission des références de commande et montants pour la génération des sessions de paiement.

---

## 5. Sécurité et Confidentialité des Données

- **Chiffrement AES-256-GCM :** Tous les jetons d'accès Meta (User Access Tokens, System User Tokens) sont stockés de manière chiffrée en base de données.
- **Chiffrement en transit (HTTPS / TLS 1.3) :** Toutes les requêtes HTTP, appels API et réceptions de webhooks sont protégés par TLS.
- **Validation cryptographique des signatures de webhook :** Chaque notification reçue de Meta est authentifiée via sa signature HMAC-SHA256 pour prévenir toute usurpation.
- **Contrôle d'accès basé sur les rôles (RLS) :** Chaque entreprise n'a strictement accès qu'à ses propres données, conversations et configurations.

---

## 6. Durée de Conservation des Données

- **Messages et contacts :** Conservés pendant la durée de la relation contractuelle avec l'Entreprise Utilisatrice ou jusqu'à demande explicite de suppression.
- **Journaux techniques et webhooks :** Conservés pour une durée maximale de 90 jours pour des motifs de diagnostic et sécurité.
- **Clôture de compte :** En cas de résiliation ou de suppression du compte Whatooz, l'intégralité des données et clés d'accès associées est supprimée sous 30 jours.

---

## 7. Droits des Personnes Concernées (RGPD)

Conformément à la réglementation applicable (notamment le RGPD), toute personne dispose des droits suivants :
- **Droit d'accès et de rectification** de ses données personnelles.
- **Droit à l'effacement** (« droit à l'oubli »).
- **Droit à la limitation et d'opposition** au traitement de ses données.
- **Droit à la portabilité** de ses données.

Pour exercer l'un de ces droits, envoyez une demande à : **privacy@whatooz.com**.

---

## 8. Contact

Pour toute question relative à cette politique ou au traitement de vos données :
- **Email :** privacy@whatooz.com
- **Site :** https://whatooz.com
- **Adresse Web de la politique hébergée :** https://whatooz.com/privacy
