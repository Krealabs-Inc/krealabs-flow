
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  companyInfo: {
    maxWidth: 200,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  clientInfo: {
    maxWidth: 200,
    textAlign: "right",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  infoBox: {
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    width: "23%",
  },
  infoLabel: {
    fontSize: 8,
    color: "#666",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: "bold",
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    color: "#fff",
    padding: 8,
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    padding: 8,
  },
  sectionRow: {
    padding: 8,
    paddingTop: 12,
    fontWeight: "bold",
    fontSize: 11,
    borderBottomWidth: 2,
    borderBottomColor: "#ddd",
  },
  colDesc: { flex: 3 },
  colQty: { width: 60, textAlign: "right" },
  colUnit: { width: 50, textAlign: "center" },
  colPrice: { width: 80, textAlign: "right" },
  colTotal: { width: 80, textAlign: "right" },
  totals: {
    alignItems: "flex-end",
    marginTop: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 3,
  },
  totalLabel: {
    width: 120,
    textAlign: "right",
    paddingRight: 10,
    color: "#666",
  },
  totalValue: {
    width: 100,
    textAlign: "right",
    fontWeight: "bold",
  },
  totalTtc: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 2,
    borderTopColor: "#1a1a1a",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#999",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  bankInfo: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    fontSize: 9,
  },
  bankLabel: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  textSmall: {
    fontSize: 9,
    color: "#666",
  },
});

const fmt = (val: string | number | null) =>
  parseFloat(String(val ?? "0")).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " \u20AC";

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

const typeLabels: Record<string, string> = {
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
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{organization.name}</Text>
            {organization.addressLine1 && (
              <Text>{organization.addressLine1}</Text>
            )}
            {organization.postalCode && (
              <Text>
                {organization.postalCode} {organization.city}
              </Text>
            )}
            {organization.phone && <Text>{organization.phone}</Text>}
            {organization.email && <Text>{organization.email}</Text>}
            {organization.siret && (
              <Text style={styles.textSmall}>SIRET : {organization.siret}</Text>
            )}
            {organization.tvaNumber && (
              <Text style={styles.textSmall}>
                TVA : {organization.tvaNumber}
              </Text>
            )}
          </View>
          <View style={styles.clientInfo}>
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
              {client.companyName}
            </Text>
            {client.contactFirstName && (
              <Text>
                {client.contactFirstName} {client.contactLastName}
              </Text>
            )}
            {client.addressLine1 && <Text>{client.addressLine1}</Text>}
            {client.postalCode && (
              <Text>
                {client.postalCode} {client.city}
              </Text>
            )}
            {client.siret && (
              <Text style={styles.textSmall}>SIRET : {client.siret}</Text>
            )}
            {client.tvaNumber && (
              <Text style={styles.textSmall}>TVA : {client.tvaNumber}</Text>
            )}
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {typeLabels[invoice.type] || "FACTURE"} {invoice.invoiceNumber}
        </Text>
        {invoice.reference && (
          <Text style={styles.subtitle}>Réf : {invoice.reference}</Text>
        )}

        {/* Info boxes */}
        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Date d&apos;émission</Text>
            <Text style={styles.infoValue}>
              {invoice.issueDate
                ? new Date(invoice.issueDate).toLocaleDateString("fr-FR")
                : "—"}
            </Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Échéance</Text>
            <Text style={styles.infoValue}>
              {new Date(invoice.dueDate).toLocaleDateString("fr-FR")}
            </Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Total TTC</Text>
            <Text style={styles.infoValue}>{fmt(invoice.totalTtc)}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Reste dû</Text>
            <Text style={styles.infoValue}>{fmt(invoice.amountDue)}</Text>
          </View>
        </View>

        {/* Introduction */}
        {invoice.introduction && (
          <Text style={{ marginBottom: 15 }}>{invoice.introduction}</Text>
        )}

        {/* Lines table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, { color: "#fff" }]}>
              Description
            </Text>
            <Text style={[styles.colQty, { color: "#fff" }]}>Qté</Text>
            <Text style={[styles.colUnit, { color: "#fff" }]}>Unité</Text>
            <Text style={[styles.colPrice, { color: "#fff" }]}>P.U. HT</Text>
            <Text style={[styles.colTotal, { color: "#fff" }]}>Total HT</Text>
          </View>
          {invoice.lines.map((line, i) =>
            line.isSection ? (
              <View key={i} style={styles.sectionRow}>
                <Text>{line.description}</Text>
              </View>
            ) : (
              <View key={i} style={styles.tableRow}>
                <View style={styles.colDesc}>
                  <Text>{line.description}</Text>
                  {line.details && (
                    <Text style={styles.textSmall}>{line.details}</Text>
                  )}
                </View>
                <Text style={styles.colQty}>{line.quantity}</Text>
                <Text style={styles.colUnit}>{line.unit}</Text>
                <Text style={styles.colPrice}>{fmt(line.unitPriceHt)}</Text>
                <Text style={styles.colTotal}>{fmt(line.totalHt)}</Text>
              </View>
            )
          )}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total HT</Text>
            <Text style={styles.totalValue}>{fmt(invoice.subtotalHt)}</Text>
          </View>
          {parseFloat(invoice.discountPercent ?? "0") > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: "#dc2626" }]}>
                Remise ({invoice.discountPercent}%)
              </Text>
              <Text style={[styles.totalValue, { color: "#dc2626" }]}>
                - {fmt(invoice.discountAmount)}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA</Text>
            <Text style={styles.totalValue}>{fmt(invoice.totalTva)}</Text>
          </View>
          <View style={[styles.totalRow, styles.totalTtc]}>
            <Text style={styles.totalLabel}>Total TTC</Text>
            <Text style={styles.totalValue}>{fmt(invoice.totalTtc)}</Text>
          </View>
          {parseFloat(invoice.amountPaid ?? "0") > 0 && (
            <>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: "#16a34a" }]}>
                  Déjà payé
                </Text>
                <Text style={[styles.totalValue, { color: "#16a34a" }]}>
                  - {fmt(invoice.amountPaid)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { fontWeight: "bold" }]}>
                  Reste dû
                </Text>
                <Text style={[styles.totalValue, { fontWeight: "bold" }]}>
                  {fmt(invoice.amountDue)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Bank info */}
        {organization.iban && (
          <View style={styles.bankInfo}>
            <Text style={styles.bankLabel}>Coordonnées bancaires</Text>
            {organization.bankName && (
              <Text>Banque : {organization.bankName}</Text>
            )}
            <Text>IBAN : {organization.iban}</Text>
            {organization.bic && <Text>BIC : {organization.bic}</Text>}
          </View>
        )}

        {/* Footer notes */}
        {invoice.footerNotes && (
          <Text style={{ marginTop: 15, fontSize: 9, color: "#666" }}>
            {invoice.footerNotes}
          </Text>
        )}

        {/* Legal footer */}
        {organization.legalMentions && (
          <View style={styles.footer}>
            <Text>{organization.legalMentions}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
