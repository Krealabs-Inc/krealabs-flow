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
  optionalBg: "#FAFAFA",
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
  tableRowOptional: {
    backgroundColor: C.optionalBg,
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
  cellOptionalBadge: {
    fontSize: 7,
    color: C.blue,
    fontFamily: "Helvetica-Bold",
    marginBottom: 1,
  },
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
    fontSize: 11,
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
  // ── Signatures ──────────────────────────────────────
  signatureSection: {
    marginBottom: 10,
  },
  signatureRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  signatureBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    padding: 10,
    minHeight: 90,
  },
  signatureLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.secondary,
    marginBottom: 4,
  },
  signatureNote: {
    fontSize: 7.5,
    color: C.muted,
    marginTop: 4,
    fontFamily: "Helvetica-Oblique",
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

interface QuotePdfProps {
  quote: {
    quoteNumber: string;
    reference: string | null;
    issueDate: string | null;
    validityDate: string;
    subtotalHt: string | null;
    totalTva: string | null;
    totalTtc: string | null;
    discountPercent: string | null;
    discountAmount: string | null;
    depositPercent: string | null;
    depositAmount: string | null;
    introduction: string | null;
    terms: string | null;
    lines: Array<{
      isSection: boolean | null;
      isOptional: boolean | null;
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

export function QuotePdf({ quote, organization, client }: QuotePdfProps) {
  const lines = quote.lines ?? [];
  const hasDiscount = parseFloat(quote.discountPercent ?? "0") > 0;
  const hasDeposit = parseFloat(quote.depositPercent ?? "0") > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Header ────────────────────────────────────── */}
        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={LOGO_PATH} style={styles.logo} />
          <View style={styles.headerRight}>
            <Text style={styles.docType}>DEVIS</Text>
            <Text style={styles.docTitle}>{quote.quoteNumber}</Text>
            {quote.reference && (
              <Text style={styles.docRef}>Réf : {quote.reference}</Text>
            )}
          </View>
        </View>

        {/* ── Meta boxes ────────────────────────────────── */}
        <View style={styles.metaRow}>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>{"Date d'émission"}</Text>
            <Text style={styles.metaValue}>{fmtDate(quote.issueDate)}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>{"Valable jusqu'au"}</Text>
            <Text style={styles.metaValue}>{fmtDate(quote.validityDate)}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Total TTC</Text>
            <Text style={styles.metaValue}>{fmt(quote.totalTtc)}</Text>
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
              {client.companyName ??
                `${client.contactFirstName} ${client.contactLastName}`}
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
        {quote.introduction && (
          <Text style={{ fontSize: 9, marginBottom: 12, color: C.secondary }}>
            {quote.introduction}
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
              <View
                key={i}
                style={[
                  styles.tableRow,
                  line.isOptional ? styles.tableRowOptional : {},
                  isLast ? styles.tableRowLast : {},
                ]}
              >
                <View style={styles.colDesc}>
                  {line.isOptional && (
                    <Text style={styles.cellOptionalBadge}>OPTION</Text>
                  )}
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
            <Text style={styles.totalLabel}>Montant H.T.</Text>
            <Text style={styles.totalValue}>{fmt(quote.subtotalHt)}</Text>
          </View>
          {hasDiscount && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: C.red }]}>
                Remise ({quote.discountPercent}%)
              </Text>
              <Text style={[styles.totalValue, { color: C.red }]}>
                - {fmt(quote.discountAmount)}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA 20 %</Text>
            <Text style={styles.totalValue}>{fmt(quote.totalTva)}</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalTtcRow}>
            <Text style={styles.totalTtcLabel}>Total TTC</Text>
            <Text style={styles.totalTtcValue}>{fmt(quote.totalTtc)}</Text>
          </View>
          {hasDeposit && (
            <View style={[styles.totalRow, { marginTop: 6 }]}>
              <Text style={[styles.totalLabel, { color: C.blue }]}>
                Acompte ({quote.depositPercent}%)
              </Text>
              <Text style={[styles.totalValue, { color: C.blue }]}>
                {fmt(quote.depositAmount)}
              </Text>
            </View>
          )}
        </View>

        {/* ── Signatures ────────────────────────────────── */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Signature du prestataire</Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Signature et cachet du client</Text>
              <Text style={styles.signatureNote}>
                {`Faire précéder de la mention "bon pour accord"`}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Ownership clause callout ──────────────────── */}
        <View style={styles.callout}>
          <Text style={styles.calloutIcon}>i</Text>
          <View style={styles.calloutContent}>
            <Text style={styles.calloutText}>
              {`${organization.name} conserve la propriété des biens vendus jusqu'au paiement effectif de l'intégralité du prix et accessoires.`}
            </Text>
          </View>
        </View>

        {/* ── Payment conditions callout ────────────────── */}
        {hasDeposit && (
          <View style={styles.callout}>
            <Text style={styles.calloutIcon}>$</Text>
            <View style={styles.calloutContent}>
              <Text style={styles.calloutTitle}>Conditions de règlement</Text>
              <Text style={styles.calloutText}>
                Paiement par virement bancaire.{"\n"}
                Acompte de {quote.depositPercent}% à la commande, soit{" "}
                {fmt(quote.depositAmount)}. Solde à la livraison.
              </Text>
            </View>
          </View>
        )}

        {/* ── Terms callout ─────────────────────────────── */}
        {quote.terms && (
          <View style={styles.callout}>
            <Text style={styles.calloutIcon}>*</Text>
            <View style={styles.calloutContent}>
              <Text style={styles.calloutTitle}>Conditions générales</Text>
              <Text style={styles.calloutText}>{quote.terms}</Text>
            </View>
          </View>
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
