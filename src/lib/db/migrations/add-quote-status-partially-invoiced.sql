-- Migration pour ajouter les nouveaux statuts de devis
-- Date: 2026-02-16

-- Ajouter les nouveaux statuts au type enum
ALTER TYPE quote_status ADD VALUE IF NOT EXISTS 'partially_invoiced';
ALTER TYPE quote_status ADD VALUE IF NOT EXISTS 'fully_invoiced';

-- Note: PostgreSQL ne permet pas de supprimer une valeur d'un enum facilement
-- Le statut 'converted' restera dans le enum mais ne sera plus utilisé
-- Les enregistrements existants avec 'converted' devront être migrés manuellement ou via script

-- Script de migration des données existantes (optionnel)
-- UPDATE quotes SET status = 'fully_invoiced' WHERE status = 'converted';
