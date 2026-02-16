# 🔧 Guide de démarrage - Test des nouvelles fonctionnalités

## Problème résolu

**Erreur corrigée** : Les composants PDF avaient la directive `"use client"` qui empêchait leur utilisation côté serveur pour la génération PDF. Cette directive a été retirée des fichiers :
- `src/components/pdf/invoice-pdf.tsx`
- `src/components/pdf/quote-pdf.tsx`

✅ **Build réussi** - L'application compile maintenant correctement !

---

## 🚀 Comment démarrer l'application

### Option 1 : En local (sans Docker)

```bash
# Installer les dépendances
pnpm install

# Lancer en mode développement
pnpm dev

# Ouvrir http://localhost:3000
```

### Option 2 : Avec Docker (recommandé)

```bash
# Démarrer les services (DB + App)
make dev-up

# Voir les logs
make dev-logs

# Arrêter les services
make dev-down
```

---

## 🧪 Test du workflow complet

### Étape 1 : Créer un devis avec acompte

1. Aller dans **Devis** (`/quotes`)
2. Cliquer sur **"Nouveau devis"**
3. Remplir les informations :
   - Client
   - Référence (ex: "PROJET-2026-001")
   - Lignes du devis avec montants
   - **Important** : Définir un **acompte de 30%** dans la section acompte
4. Sauvegarder le devis

### Étape 2 : Télécharger le PDF du devis

1. Ouvrir le devis créé
2. Cliquer sur **"Télécharger PDF"** en haut à droite
3. Vérifier que le PDF se télécharge avec le bon nom : `devis-{numéro}.pdf`
4. Ouvrir le PDF et vérifier :
   - ✅ Informations du client et de l'organisation
   - ✅ Lignes du devis
   - ✅ Montants HT, TVA, TTC
   - ✅ Acompte affiché (30% du total)

### Étape 3 : Convertir en facture d'acompte

1. Sur la page du devis, marquer comme **"Accepté"**
2. Cliquer sur **"Convertir en facture"**
3. Le système crée automatiquement une **facture d'acompte** (30% du total)
4. Vous êtes redirigé vers la liste des factures

### Étape 4 : Marquer l'acompte comme payé

1. Ouvrir la facture d'acompte créée
2. Vérifier que c'est bien une facture de type **"ACOMPTE"** (badge visible)
3. Cliquer sur **"Enregistrer paiement"**
4. Remplir :
   - Montant : le montant total de l'acompte
   - Méthode : Virement / Chèque / CB
   - Date de paiement
5. Valider
6. La facture passe en statut **"Payée"** ou **"Partiellement payée"**

### Étape 5 : Créer la facture de solde

1. Sur la page de la facture d'acompte, un nouveau bouton apparaît : **"Créer facture de solde"** 🎉
2. Cliquer dessus
3. Confirmer la création
4. Le système :
   - ✅ Récupère le devis d'origine
   - ✅ Calcule automatiquement le montant restant (70%)
   - ✅ Copie toutes les lignes avec les bonnes proportions
   - ✅ Crée une nouvelle facture de type **"SOLDE"**
   - ✅ Vous redirige vers cette nouvelle facture

### Étape 6 : Vérifier la facture de solde

1. Vérifier que :
   - ✅ Type = "FACTURE DE SOLDE"
   - ✅ Le montant = 70% du total du devis
   - ✅ Il y a une note mentionnant l'acompte déduit
   - ✅ Les lignes sont proportionnelles

2. **Vérification mathématique** :
   ```
   Total devis = 1000 €
   Acompte (30%) = 300 €
   Solde (70%) = 700 €
   
   Acompte + Solde = 1000 € ✅
   ```

### Étape 7 : Télécharger les PDFs

1. **PDF de l'acompte** :
   - Ouvrir la facture d'acompte
   - Cliquer sur "Télécharger PDF"
   - Vérifier : `facture-FA-XXX.pdf`

2. **PDF du solde** :
   - Ouvrir la facture de solde
   - Cliquer sur "Télécharger PDF"
   - Vérifier : `facture-FS-XXX.pdf`

3. **Comparer les PDFs** :
   - Les deux doivent avoir le même client
   - Les lignes doivent être proportionnelles
   - Le solde doit mentionner l'acompte déduit

---

## 🎯 Points de test importants

### Test 1 : Protection contre les doublons
1. Essayer de créer une 2ème facture de solde
2. ❌ Le système doit afficher une erreur : *"Une facture de solde existe déjà"*

### Test 2 : Protection acompte non payé
1. Créer un nouveau devis avec acompte
2. Convertir en facture d'acompte
3. **Sans** payer l'acompte, essayer de créer le solde
4. ❌ Le bouton "Créer facture de solde" ne doit **pas** être visible

### Test 3 : Calculs avec remise
1. Créer un devis avec :
   - Lignes pour 1000 € HT
   - Remise de 10% = 900 € HT
   - TVA 20% = 180 €
   - Total TTC = 1080 €
   - Acompte 30% = 324 € TTC

2. Vérifier que :
   - Facture d'acompte = 324 €
   - Facture de solde = 756 €
   - Total = 1080 € ✅

### Test 4 : PDFs avec sections
1. Créer un devis avec des sections :
   ```
   SECTION: Design
   - Maquette : 500 €
   - Prototype : 300 €
   
   SECTION: Développement
   - Frontend : 1000 €
   - Backend : 1200 €
   ```

2. Vérifier que les PDFs :
   - ✅ Affichent bien les sections en gras
   - ✅ Les lignes sont groupées sous les sections
   - ✅ Les calculs sont corrects

---

## 🐛 En cas de problème

### Erreur : "Facture non trouvée"
- Vérifier que la base de données est démarrée
- Vérifier la connexion DB dans `.env`

### Erreur : PDF ne se télécharge pas
- Ouvrir la console du navigateur (F12)
- Vérifier les erreurs réseau
- Vérifier les logs du serveur : `make dev-logs`

### Erreur : Montants incorrects
- Vérifier que le devis d'origine existe toujours
- Vérifier que `depositPercent` est bien défini sur le devis
- Consulter les logs : rechercher "createFinalInvoice"

### Redémarrer complètement

```bash
# Arrêter tout
make dev-down

# Supprimer les volumes (ATTENTION: supprime la DB)
docker compose -f docker-compose.dev.yml down -v

# Redémarrer
make dev-up

# Vérifier les logs
make dev-logs
```

---

## 📊 Commandes utiles

```bash
# Voir tous les conteneurs
make ps

# Accéder au shell du container
make app-shell

# Voir les logs en temps réel
make dev-logs

# Redémarrer les services
make dev-restart

# Build en production
make prod-up
```

---

## ✅ Checklist de test

- [ ] Devis créé avec acompte
- [ ] PDF du devis téléchargé et correct
- [ ] Devis converti en facture d'acompte
- [ ] Facture d'acompte marquée comme payée
- [ ] Facture de solde créée automatiquement
- [ ] Montants vérifiés (acompte + solde = total)
- [ ] PDF de l'acompte téléchargé
- [ ] PDF du solde téléchargé
- [ ] Impossible de créer 2 factures de solde (protection OK)
- [ ] Bouton masqué si acompte non payé (protection OK)

---

## 🎉 Résultat attendu

À la fin de tous ces tests, vous devriez avoir :

```
📄 Devis-2026-001.pdf          (total: 1000€)
   ↓
💰 Facture-FA-001.pdf           (acompte: 300€, payé ✅)
   ↓
💰 Facture-FS-001.pdf           (solde: 700€, à payer)
```

**Total : 300€ + 700€ = 1000€** ✅

---

**Version** : v1.0.0
**Date** : Février 2026
**Status** : ✅ Ready to test!
