# 🎯 Amélioration du Suivi des Statuts - Phase 2

## 📋 Objectifs

1. ✅ Améliorer le suivi des statuts des devis et factures
2. ✅ Prendre en compte les acomptes et soldes dans les workflows
3. ✅ Permettre la création de factures intégrales sans acompte
4. 🔄 Adapter les PDFs aux exemples fournis (en cours)

---

## 🆕 Nouveaux fichiers créés

### 1. `/src/lib/utils/workflow.ts`
**Rôle** : Gestion centralisée des workflows et transitions d'état

**Contenu** :
- **Types de workflows** : 
  - `quote_to_full_invoice` : Devis → Facture complète
  - `quote_to_deposit` : Devis → Facture d'acompte
  - `deposit_to_final` : Acompte → Facture de solde
  - `direct_invoice` : Facture directe sans devis

- **Transitions d'état** :
  - `QUOTE_STATUS_TRANSITIONS` : États possibles pour un devis
  - `INVOICE_STATUS_TRANSITIONS` : États possibles pour une facture

- **Types de factures** :
  - `standard` : Facture complète classique
  - `deposit` : Facture d'acompte
  - `final` : Facture de solde
  - `credit_note` : Avoir
  - `recurring` : Facture récurrente

- **Fonctions de validation** :
  - `canConvertQuoteToInvoice()` : Vérifie si un devis peut être converti
  - `canCreateFinalInvoice()` : Vérifie si une facture de solde peut être créée
  - `getInvoiceWorkflow()` : Retourne le workflow actuel d'une facture

### 2. `/src/components/shared/workflow-tracker.tsx`
**Rôle** : Composant visuel de suivi du workflow

**Fonctionnalités** :
- 📊 **Timeline visuelle** : Affiche le parcours du document
- 🔗 **Liens inter-documents** : Navigation rapide entre devis/factures liées
- 💰 **Résumé financier** : Vue d'ensemble des montants (total, acompte, solde)
- ⚠️ **Alertes contextuelles** : Notifications pour les actions requises
- 🎨 **Indicateurs visuels** : Couleurs selon l'état (payé, en attente, etc.)

**Affichage selon le type** :
- **Facture standard** : Simple affichage du statut
- **Facture d'acompte** : Timeline complète (Devis → Acompte → Solde)
- **Facture de solde** : Lien avec l'acompte parent et le devis d'origine
- **Devis** : Statut et conversion éventuelle

---

## 🔄 Fichiers modifiés

### 1. `/src/lib/services/invoice.service.ts`

**Fonction `getInvoice()` améliorée** :
```typescript
// Récupère maintenant :
- Lines (lignes de facture)
- Payments (paiements)
- relatedQuote (devis d'origine si existe)
- relatedParentInvoice (facture d'acompte parent si c'est un solde)
- relatedFinalInvoice (facture de solde si c'est un acompte)
```

**Avantages** :
- Vue complète du contexte documentaire
- Navigation facile entre documents liés
- Calculs automatiques basés sur les documents d'origine

### 2. `/src/app/(dashboard)/invoices/[id]/page.tsx`

**Ajouts** :
- Import du composant `WorkflowTracker`
- Affichage du tracker après l'avertissement de retard
- Types étendus pour inclure les documents liés

**Résultat** :
- Les utilisateurs voient maintenant le parcours complet de leur facturation
- Accès rapide aux documents liés
- Compréhension claire du workflow en cours

---

## 📊 Workflows implémentés

### Workflow 1 : Devis vers Facture Complète
```
📄 Devis (accepté)
   ↓ Convertir
💰 Facture Standard (100% du montant)
   ↓ Paiement
✅ Facture Payée
```

**Utilisation** : Quand le client paie directement le montant total

### Workflow 2 : Devis avec Acompte vers Facture Complète
```
📄 Devis (avec acompte 30%)
   ↓ Convertir
💰 Facture d'Acompte (30%)
   ↓ Paiement
✅ Acompte Payé
   ↓ Créer facture de solde
💰 Facture de Solde (70%)
   ↓ Paiement
✅ Solde Payé
```

**Utilisation** : Paiement échelonné pour sécuriser les deux parties

### Workflow 3 : Facture Directe
```
💰 Facture Standard (sans devis)
   ↓ Paiement
✅ Facture Payée
```

**Utilisation** : Prestations ponctuelles ou clients réguliers

### Workflow 4 : Annulation avec Avoir
```
💰 Facture Payée
   ↓ Annulation
📃 Avoir (crédit note)
```

**Utilisation** : Remboursement ou annulation d'une facture

---

## 🎨 Interface utilisateur

### Timeline visuelle

```
┌─────────┐     ┌──────────┐     ┌─────────┐
│  Devis  │ --> │ Acompte  │ --> │  Solde  │
│ ✅ Accepté│     │ ✅ Payé   │     │ 🔜 À payer│
└─────────┘     └──────────┘     └─────────┘
```

### Résumé financier (pour acompte)

```
┌──────────────────────────────────┐
│ Total devis      : 1 000,00 €    │
│ Acompte (30%)    :   300,00 €    │
│ Payé             :   300,00 € ✅  │
│ Solde restant    :   700,00 €    │
└──────────────────────────────────┘
```

### Alertes contextuelles

```
⚠️ Acompte payé - Action requise
L'acompte a été payé. Vous pouvez 
maintenant créer la facture de solde.
```

---

## 🔐 Règles de gestion

### Pour créer une facture de solde :

1. ✅ La facture parente doit être de type "deposit"
2. ✅ L'acompte doit être payé (au moins à 1%)
3. ✅ Le devis d'origine doit exister
4. ✅ Une seule facture de solde par acompte

### Pour convertir un devis :

1. ✅ Le devis doit être au statut "accepted"
2. ✅ Si le devis a un % d'acompte → Crée une facture d'acompte
3. ✅ Sinon → Crée une facture standard (100%)

### Transitions d'état autorisées :

**Devis** :
- `draft` → `sent`, `rejected`
- `sent` → `viewed`, `accepted`, `rejected`, `expired`
- `viewed` → `accepted`, `rejected`, `expired`
- `accepted` → `converted`
- `expired` → `sent` (relance)

**Facture** :
- `draft` → `sent`, `cancelled`
- `sent` → `viewed`, `partially_paid`, `paid`, `overdue`, `cancelled`
- `viewed` → `partially_paid`, `paid`, `overdue`, `cancelled`
- `partially_paid` → `paid`, `overdue`, `cancelled`
- `paid` → `refunded` (avoir)
- `overdue` → `partially_paid`, `paid`, `cancelled`

---

## 📱 Exemples d'utilisation

### Exemple 1 : Projet avec acompte

**Contexte** : Client demande un site web à 5000€, veut payer en 2 fois

1. **Créer le devis**
   - Montant total : 5000€
   - Acompte : 30% (1500€)
   - Solde : 70% (3500€)

2. **Client accepte**
   - Statut devis → "accepted"
   - Bouton "Convertir en facture" apparaît

3. **Conversion automatique**
   - Crée facture FA-001 (Acompte 1500€)
   - Type : "deposit"
   - Statut : "draft"

4. **Envoyer et recevoir l'acompte**
   - Envoyer FA-001 au client
   - Enregistrer le paiement de 1500€
   - Statut → "paid"

5. **Créer le solde**
   - Bouton "Créer facture de solde" apparaît
   - Crée automatiquement FA-002 (Solde 3500€)
   - Type : "final"
   - Référence l'acompte FA-001

6. **Finaliser**
   - Envoyer FA-002 au client
   - Enregistrer le paiement de 3500€
   - Projet complété ✅

**Timeline visible** :
```
Devis DV-001 (5000€) 
  → FA-001 Acompte (1500€ payé)
    → FA-002 Solde (3500€)
```

### Exemple 2 : Facture directe

**Contexte** : Client régulier, pas besoin de devis

1. **Créer une facture directement**
   - Aller dans "Factures" → "Nouvelle facture"
   - Type : "standard"
   - Montant : 800€

2. **Envoyer et recevoir**
   - Envoyer au client
   - Enregistrer le paiement
   - Terminé ✅

**Timeline visible** :
```
FA-003 Facture Standard (800€ payé)
```

---

## 🚀 Prochaines étapes

### Phase 3 : Amélioration des PDFs (À venir)

1. **Analyse des exemples** :
   - Examiner les PDFs dans `/example/`
   - Identifier la mise en page et le style
   - Noter les éléments spécifiques (logos, mentions légales, etc.)

2. **Adapter les composants PDF** :
   - Améliorer `invoice-pdf.tsx`
   - Améliorer `quote-pdf.tsx`
   - Ajouter les éléments manquants

3. **Fonctionnalités additionnelles** :
   - En-tête avec logo
   - Pied de page personnalisé
   - Numérotation des pages
   - Conditions générales de vente
   - Signature électronique pour les devis

### Phase 4 : Automatisation

1. **Notifications** :
   - Email automatique à l'envoi
   - Relances automatiques pour factures en retard
   - Notification quand acompte payé

2. **Rapports** :
   - Dashboard avec métriques de workflow
   - Taux de conversion devis → facture
   - Délais moyens de paiement

---

## ✅ Tests recommandés

### Test 1 : Workflow complet avec acompte
- [ ] Créer devis avec 30% d'acompte
- [ ] Accepter le devis
- [ ] Convertir en facture d'acompte
- [ ] Vérifier le WorkflowTracker (timeline)
- [ ] Payer l'acompte
- [ ] Vérifier l'alerte "Action requise"
- [ ] Créer la facture de solde
- [ ] Vérifier les montants (30% + 70% = 100%)
- [ ] Vérifier les liens entre documents

### Test 2 : Facture directe sans devis
- [ ] Créer facture standard directement
- [ ] Vérifier que c'est bien type "standard"
- [ ] Pas de devis lié
- [ ] WorkflowTracker simple
- [ ] Payer et terminer

### Test 3 : Protection contre doublons
- [ ] Créer acompte et le payer
- [ ] Créer facture de solde
- [ ] Essayer de créer une 2ème facture de solde
- [ ] Doit afficher erreur : "Une facture de solde existe déjà"

### Test 4 : Navigation entre documents
- [ ] Depuis une facture de solde
- [ ] Cliquer sur l'acompte dans le tracker
- [ ] Doit ouvrir la facture d'acompte
- [ ] Cliquer sur le devis
- [ ] Doit ouvrir le devis d'origine

---

## 📊 Métriques de succès

- ✅ Workflow visible en 1 coup d'œil
- ✅ 0 confusion sur les montants acompte/solde
- ✅ Navigation rapide entre documents (<1 clic)
- ✅ Alertes contextuelles pertinentes
- ✅ Protection contre les erreurs (doublons, statuts invalides)
- ✅ Calculs automatiques corrects à 100%

---

**Version** : v2.0.0
**Date** : Février 2026
**Statut** : 🔄 En cours de développement
**Build** : En attente de tests
