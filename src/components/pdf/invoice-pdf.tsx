import path from "path";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Logo path resolved at server runtime
const LOGO_PATH = path.join(process.cwd(), "public", "Logo Krealabs.png");

const C = {
  brand: "#8B89F7",
  text: "#1C1C1E",
  secondary: "#6B7280",
  muted: "#9CA3AF",
  calloutBg: "#F3F2F0",
  tableHeaderBg: "#F7F6F3",
  border: "#E5E4E1",
  borderLight: "#F0EFED",
  green: "#16a34a",
  red: "#dc2626",
  blue: "#2563eb",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 44,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: C.text,
    backgroundColor: "#FFFFFF",
  },
  // ── Header ──────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  logo: {
    width: 110,
    height: 30,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  docType: {
    fontSize: 7,
    color: C.secondary,
    marginBottom: 3,
    letterSpacing: 1,
  },
  docTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    marginBottom: 2,
  },
  docRef: {
    fontSize: 8,
    color: C.secondary,
  },
  // ── Meta boxes ──────────────────────────────────────
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  metaBox: {
    flex: 1,
    backgroundColor: C.calloutBg,
    padding: 8,
    borderRadius: 4,
  },
  metaLabel: {
    fontSize: 7,
    color: C.secondary,
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.text,
  },
  // ── Address columns ─────────────────────────────────
  addressRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  addressBlock: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 6.5,
    color: C.secondary,
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  addressName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  addressLine: {
    fontSize: 8.5,
    color: C.text,
    lineHeight: 1.5,
  },
  addressMuted: {
    fontSize: 7.5,
    color: C.secondary,
    marginTop: 3,
  },
  // ── Table ───────────────────────────────────────────
  table: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: C.tableHeaderBg,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.secondary,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  sectionRow: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: C.calloutBg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sectionText: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: C.text,
  },
  colDesc: { flex: 3 },
  colQty: { width: 42, textAlign: "right" },
  colUnit: { width: 42, textAlign: "center" },
  colPrice: { width: 72, textAlign: "right" },
  colTotal: { width: 72, textAlign: "right" },
  cellText: { fontSize: 9, color: C.text },
  cellSubtext: { fontSize: 7.5, color: C.secondary, marginTop: 2 },
  // ── Totals ──────────────────────────────────────────
  totalsBlock: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: "row",
    paddingVertical: 2,
  },
  totalLabel: {
    width: 130,
    textAlign: "right",
    paddingRight: 12,
    color: C.secondary,
    fontSize: 9,
  },
  totalValue: {
    width: 90,
    textAlign: "right",
    fontSize: 9,
  },
  totalDivider: {
    width: 222,
    height: 1,
    backgroundColor: C.border,
    marginVertical: 5,
  },
  totalTtcRow: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  totalTtcLabel: {
    width: 130,
    textAlign: "right",
    paddingRight: 12,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.text,
  },
  totalTtcValue: {
    width: 90,
    textAlign: "right",
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.text,
  },
  // ── Callout box ─────────────────────────────────────
  callout: {
    flexDirection: "row",
    backgroundColor: C.calloutBg,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: C.brand,
  },
  calloutIcon: {
    fontSize: 12,
    marginRight: 8,
    width: 16,
  },
  calloutContent: {
    flex: 1,
  },
  calloutTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    marginBottom: 3,
  },
  calloutText: {
    fontSize: 8.5,
    color: C.text,
    lineHeight: 1.6,
  },
  // ── Footer ──────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 28,
    left: 44,
    right: 44,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: C.muted,
    textAlign: "center",
  },
});

const fmt = (val: string | number | null) =>
  parseFloat(String(val ?? "0")).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " \u20AC";

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-FR") : "—";

interface InvoicePdfProps {
  invoice: {
    invoiceNumber: string;
    reference: string | null;
    type: string;
    issueDate: string | null;
    dueDate: string;
    subtotalHt: string | null;
    totalTva: string | null;
    totalTtc: string | null;
    discountPercent: string | null;
    discountAmount: string | null;
    amountPaid: string | null;
    amountDue: string | null;
    introduction: string | null;
    footerNotes: string | null;
    lines: Array<{
      isSection: boolean | null;
      description: string;
      details: string | null;
      quantity: string | null;
      unit: string | null;
      unitPriceHt: string | null;
      totalHt: string | null;
    }>;
  };
  organization: {
    name: string;
    legalName: string | null;
    siret: string | null;
    tvaNumber: string | null;
    addressLine1: string | null;
    city: string | null;
    postalCode: string | null;
    phone: string | null;
    email: string | null;
    bankName: string | null;
    iban: string | null;
    bic: string | null;
    legalMentions: string | null;
  };
  client: {
    companyName: string | null;
    contactFirstName: string | null;
    contactLastName: string | null;
    addressLine1: string | null;
    city: string | null;
    postalCode: string | null;
    siret: string | null;
    tvaNumber: string | null;
  };
}

const TYPE_LABELS: Record<string, string> = {
  standard: "FACTURE",
  deposit: "FACTURE D'ACOMPTE",
  final: "FACTURE DE SOLDE",
  credit_note: "AVOIR",
  recurring: "FACTURE",
};

export function InvoicePdf({
  invoice,
  organization,
  client,
}: InvoicePdfProps) {
  const typeLabel = TYPE_LABELS[invoice.type] ?? "FACTURE";
  const lines = invoice.lines ?? [];
  const hasDiscount = parseFloat(invoice.discountPercent ?? "0") > 0;
  const hasPaid = parseFloat(invoice.amountPaid ?? "0") > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Header ────────────────────────────────────── */}
        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={LOGO_PATH} style={styles.logo} />
          <View style={styles.headerRight}>
            <Text style={styles.docType}>{typeLabel}</Text>
            <Text style={styles.docTitle}>{invoice.invoiceNumber}</Text>
            {invoice.reference && (
              <Text style={styles.docRef}>Réf : {invoice.reference}</Text>
            )}
          </View>
        </View>

        {/* ── Meta boxes ────────────────────────────────── */}
        <View style={styles.metaRow}>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>{"Date d'émission"}</Text>
            <Text style={styles.metaValue}>{fmtDate(invoice.issueDate)}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Échéance</Text>
            <Text style={styles.metaValue}>{fmtDate(invoice.dueDate)}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Total TTC</Text>
            <Text style={styles.metaValue}>{fmt(invoice.totalTtc)}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Reste dû</Text>
            <Text style={styles.metaValue}>{fmt(invoice.amountDue)}</Text>
          </View>
        </View>

        {/* ── Addresses ─────────────────────────────────── */}
        <View style={styles.addressRow}>
          <View style={styles.addressBlock}>
            <Text style={styles.addressLabel}>ÉMETTEUR</Text>
            <Text style={styles.addressName}>{organization.name}</Text>
            {organization.legalName && (
              <Text style={styles.addressLine}>{organization.legalName}</Text>
            )}
            {organization.addressLine1 && (
              <Text style={styles.addressLine}>{organization.addressLine1}</Text>
            )}
            {(organization.postalCode || organization.city) && (
              <Text style={styles.addressLine}>
                {organization.postalCode} {organization.city}
              </Text>
            )}
            {organization.phone && (
              <Text style={styles.addressLine}>{organization.phone}</Text>
            )}
            {organization.email && (
              <Text style={styles.addressLine}>{organization.email}</Text>
            )}
            {(organization.siret || organization.tvaNumber) && (
              <Text style={styles.addressMuted}>
                {organization.siret ? `SIRET : ${organization.siret}` : ""}
                {organization.siret && organization.tvaNumber ? "   " : ""}
                {organization.tvaNumber ? `TVA : ${organization.tvaNumber}` : ""}
              </Text>
            )}
          </View>
          <View style={styles.addressBlock}>
            <Text style={styles.addressLabel}>DESTINATAIRE</Text>
            <Text style={styles.addressName}>
              {client.companyName ?? `${client.contactFirstName} ${client.contactLastName}`}
            </Text>
            {client.companyName && client.contactFirstName && (
              <Text style={styles.addressLine}>
                {client.contactFirstName} {client.contactLastName}
              </Text>
            )}
            {client.addressLine1 && (
              <Text style={styles.addressLine}>{client.addressLine1}</Text>
            )}
            {(client.postalCode || client.city) && (
              <Text style={styles.addressLine}>
                {client.postalCode} {client.city}
              </Text>
            )}
            {(client.siret || client.tvaNumber) && (
              <Text style={styles.addressMuted}>
                {client.siret ? `SIRET : ${client.siret}` : ""}
                {client.siret && client.tvaNumber ? "   " : ""}
                {client.tvaNumber ? `TVA : ${client.tvaNumber}` : ""}
              </Text>
            )}
          </View>
        </View>

        {/* ── Introduction ──────────────────────────────── */}
        {invoice.introduction && (
          <Text style={{ fontSize: 9, marginBottom: 12, color: C.secondary }}>
            {invoice.introduction}
          </Text>
        )}

        {/* ── Table ─────────────────────────────────────── */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qté</Text>
            <Text style={[styles.tableHeaderCell, styles.colUnit]}>Unité</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>P.U. HT</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total HT</Text>
          </View>
          {lines.map((line, i) => {
            const isLast = i === lines.length - 1;
            if (line.isSection) {
              return (
                <View key={i} style={styles.sectionRow}>
                  <Text style={styles.sectionText}>{line.description}</Text>
                </View>
              );
            }
            return (
              <View key={i} style={[styles.tableRow, isLast ? styles.tableRowLast : {}]}>
                <View style={styles.colDesc}>
                  <Text style={styles.cellText}>{line.description}</Text>
                  {line.details && (
                    <Text style={styles.cellSubtext}>{line.details}</Text>
                  )}
                </View>
                <Text style={[styles.cellText, styles.colQty]}>{line.quantity}</Text>
                <Text style={[styles.cellText, styles.colUnit]}>{line.unit}</Text>
                <Text style={[styles.cellText, styles.colPrice]}>
                  {fmt(line.unitPriceHt)}
                </Text>
                <Text style={[styles.cellText, styles.colTotal]}>
                  {fmt(line.totalHt)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ── Totals ────────────────────────────────────── */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total HT</Text>
            <Text style={styles.totalValue}>{fmt(invoice.subtotalHt)}</Text>
          </View>
          {hasDiscount && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: C.red }]}>
                Remise ({invoice.discountPercent}%)
              </Text>
              <Text style={[styles.totalValue, { color: C.red }]}>
                - {fmt(invoice.discountAmount)}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA</Text>
            <Text style={styles.totalValue}>{fmt(invoice.totalTva)}</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalTtcRow}>
            <Text style={styles.totalTtcLabel}>Total TTC</Text>
            <Text style={styles.totalTtcValue}>{fmt(invoice.totalTtc)}</Text>
          </View>
          {hasPaid && (
            <>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: C.green }]}>Déjà réglé</Text>
                <Text style={[styles.totalValue, { color: C.green }]}>
                  - {fmt(invoice.amountPaid)}
                </Text>
              </View>
              <View style={styles.totalDivider} />
              <View style={styles.totalTtcRow}>
                <Text style={styles.totalTtcLabel}>Reste dû</Text>
                <Text style={styles.totalTtcValue}>{fmt(invoice.amountDue)}</Text>
              </View>
            </>
          )}
        </View>

        {/* ── Bank details callout ──────────────────────── */}
        {organization.iban && (
          <View style={styles.callout}>
            <Text style={styles.calloutIcon}>$</Text>
            <View style={styles.calloutContent}>
              <Text style={styles.calloutTitle}>Coordonnées bancaires</Text>
              {organization.bankName && (
                <Text style={styles.calloutText}>Banque : {organization.bankName}</Text>
              )}
              <Text style={styles.calloutText}>IBAN : {organization.iban}</Text>
              {organization.bic && (
                <Text style={styles.calloutText}>BIC : {organization.bic}</Text>
              )}
            </View>
          </View>
        )}

        {/* ── Footer notes ─────────────────────────────── */}
        {invoice.footerNotes && (
          <Text style={{ fontSize: 8, color: C.secondary, marginTop: 6 }}>
            {invoice.footerNotes}
          </Text>
        )}

        {/* ── Legal footer ─────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {organization.legalMentions ??
              `${organization.name} — ${organization.email ?? ""} — ${organization.phone ?? ""}`}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
