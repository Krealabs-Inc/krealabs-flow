# Nouvelles Fonctionnalités - Gestion des Factures et Devis

## 📋 Résumé des améliorations

Ce document décrit les nouvelles fonctionnalités ajoutées au système de gestion des factures et devis.

## ✨ Fonctionnalités ajoutées

### 1. Création de Facture de Solde après un Acompte

Lorsqu'un devis avec acompte est converti en facture d'acompte, il est maintenant possible de créer automatiquement une facture de solde pour le montant restant.

#### Comment ça fonctionne :

1. **Convertir un devis en facture d'acompte** :
   - Le devis doit avoir un pourcentage d'acompte défini
   - Lors de la conversion, une facture d'acompte est créée avec le montant proportionnel

2. **Créer la facture de solde** :
   - Une fois l'acompte payé (statut "paid" ou "partially_paid")
   - Un bouton "Créer facture de solde" apparaît :
     - Dans la page de détail de la facture d'acompte
     - Dans le menu dropdown du tableau des factures
   
3. **Calcul automatique** :
   - Le système récupère le devis d'origine
   - Calcule le montant restant (Total - Acompte)
   - Copie les lignes du devis avec les quantités proportionnelles
   - Crée une nouvelle facture avec le statut "draft"

#### Protection et validations :

- Impossible de créer une facture de solde si l'acompte n'est pas payé
- Impossible de créer plusieurs factures de solde pour le même acompte
- Le lien entre l'acompte et la facture de solde est conservé via `parentInvoiceId`

#### Localisation des modifications :

**Backend :**
- `src/lib/services/invoice.service.ts` : Fonction `createFinalInvoice()` améliorée
- `src/app/api/invoices/[id]/route.ts` : Action "create_final" déjà présente

**Frontend :**
- `src/app/(dashboard)/invoices/[id]/page.tsx` : Bouton "Créer facture de solde"
- `src/app/(dashboard)/invoices/page.tsx` : Gestion de l'action dans le tableau
- `src/components/invoices/invoice-table.tsx` : Option dans le menu dropdown

### 2. Téléchargement des Devis et Factures en PDF

Il est maintenant possible de télécharger les devis et factures au format PDF directement depuis l'interface.

#### Fonctionnalités :

1. **Bouton de téléchargement** :
   - Présent sur la page de détail de chaque facture
   - Présent sur la page de détail de chaque devis
   - Icône "Download" claire et visible

2. **Génération PDF** :
   - Utilise `@react-pdf/renderer` pour générer les PDFs
   - Respect de la mise en page professionnelle
   - Inclut toutes les informations : lignes, totaux, infos client/organisation
   - Nom de fichier automatique : `facture-{numéro}.pdf` ou `devis-{numéro}.pdf`

3. **Personnalisation** :
   - Affichage du type de facture (Standard, Acompte, Solde, Avoir)
   - Informations bancaires pour les factures
   - Conditions et signature pour les devis
   - Sections optionnelles marquées
   - Remises et acomptes affichés clairement

#### Localisation des modifications :

**Backend :**
- `src/app/api/pdf/download/route.ts` : Nouvelle route API pour téléchargement
- `src/lib/services/pdf.service.ts` : Service existant pour récupérer les données
- `src/components/pdf/invoice-pdf.tsx` : Composant PDF existant
- `src/components/pdf/quote-pdf.tsx` : Composant PDF existant

**Frontend :**
- `src/app/(dashboard)/invoices/[id]/page.tsx` : Bouton "Télécharger PDF"
- `src/app/(dashboard)/quotes/[id]/page.tsx` : Bouton "Télécharger PDF"

## 🔧 Détails techniques

### Architecture

```
Utilisateur clique sur "Télécharger PDF"
        ↓
Frontend fait un GET sur /api/pdf/download?type={invoice|quote}&id={id}
        ↓
Backend récupère les données (invoice/quote + organization + client)
        ↓
Génération du PDF avec @react-pdf/renderer
        ↓
Envoi du stream PDF au navigateur
        ↓
Téléchargement automatique du fichier
```

### Types de factures

Le système gère maintenant 5 types de factures :
- **standard** : Facture classique
- **deposit** : Facture d'acompte (créée depuis un devis avec acompte)
- **final** : Facture de solde (créée depuis une facture d'acompte)
- **credit_note** : Avoir (créée lors de l'annulation d'une facture payée)
- **recurring** : Facture récurrente (pour les contrats)

### Workflow complet

```
Devis créé (avec 30% d'acompte)
        ↓
Devis accepté
        ↓
Conversion en facture d'acompte (30% du total)
        ↓
Facture d'acompte payée
        ↓
Création de la facture de solde (70% restant)
        ↓
Facture de solde payée
        ↓
Projet complété
```

## 📝 Utilisation

### Pour créer une facture de solde :

1. Aller sur la page de la facture d'acompte
2. S'assurer qu'elle est payée (au moins partiellement)
3. Cliquer sur "Créer facture de solde"
4. Confirmer l'action
5. La nouvelle facture de solde s'ouvre automatiquement

### Pour télécharger un PDF :

1. Aller sur la page du devis ou de la facture
2. Cliquer sur le bouton "Télécharger PDF" en haut à droite
3. Le PDF se télécharge automatiquement

## 🎨 Interface utilisateur

### Badges et indicateurs

- **Facture d'acompte** : Badge "ACOMPTE" visible
- **Facture de solde** : Badge "SOLDE" avec référence à l'acompte
- **Bouton visible** : Seulement quand l'action est possible
- **Confirmation** : Dialogue de confirmation avant création

### Feedback utilisateur

- Alertes en cas d'erreur (ex: acompte non payé)
- Redirection automatique vers la nouvelle facture créée
- Messages d'erreur clairs et explicites

## 🔐 Sécurité et validations

- Vérification de l'authentification pour télécharger les PDFs
- Validation de l'organisation (DEFAULT_ORG_ID)
- Empêche la création de doublons de factures de solde
- Vérification du statut avant d'autoriser les actions

## 🚀 Améliorations futures possibles

1. **Emails automatiques** : Envoyer le PDF par email au client
2. **Stockage** : Sauvegarder les PDFs générés dans le cloud
3. **Personnalisation** : Templates de PDFs personnalisables
4. **Signature électronique** : Intégrer une solution de signature pour les devis
5. **Multi-acomptes** : Permettre plusieurs acomptes successifs
6. **Historique** : Voir toutes les factures liées (acompte → solde)

## 📚 Dépendances

- `@react-pdf/renderer`: ^4.3.2 (déjà installée)
- React 19.2.3
- Next.js 16.1.6
- Drizzle ORM

## ✅ Tests recommandés

1. Créer un devis avec 30% d'acompte
2. Le convertir en facture d'acompte
3. Marquer la facture d'acompte comme payée
4. Créer la facture de solde
5. Vérifier les montants (acompte + solde = total devis)
6. Télécharger les PDFs du devis, de l'acompte et du solde
7. Vérifier que les informations sont correctes dans les PDFs

---

**Date de mise en place** : Février 2026
**Statut** : ✅ Implémenté et testé
