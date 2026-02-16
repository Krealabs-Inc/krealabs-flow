
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
    width: "30%",
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
  optionalRow: {
    backgroundColor: "#fafafa",
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
  textSmall: {
    fontSize: 9,
    color: "#666",
  },
  terms: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 4,
    fontSize: 8,
    color: "#666",
  },
  signatureBox: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  signatureArea: {
    width: 200,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 10,
    minHeight: 80,
  },
});

const fmt = (val: string | number | null) =>
  parseFloat(String(val ?? "0")).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " \u20AC";

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
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>DEVIS {quote.quoteNumber}</Text>
        {quote.reference && (
          <Text style={styles.subtitle}>Réf : {quote.reference}</Text>
        )}

        {/* Info boxes */}
        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Date d&apos;émission</Text>
            <Text style={styles.infoValue}>
              {quote.issueDate
                ? new Date(quote.issueDate).toLocaleDateString("fr-FR")
                : "—"}
            </Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Validité</Text>
            <Text style={styles.infoValue}>
              {new Date(quote.validityDate).toLocaleDateString("fr-FR")}
            </Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Total TTC</Text>
            <Text style={styles.infoValue}>{fmt(quote.totalTtc)}</Text>
          </View>
        </View>

        {/* Introduction */}
        {quote.introduction && (
          <Text style={{ marginBottom: 15 }}>{quote.introduction}</Text>
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
          {quote.lines.map((line, i) =>
            line.isSection ? (
              <View key={i} style={styles.sectionRow}>
                <Text>{line.description}</Text>
              </View>
            ) : (
              <View
                key={i}
                style={[
                  styles.tableRow,
                  line.isOptional ? styles.optionalRow : {},
                ]}
              >
                <View style={styles.colDesc}>
                  <Text>
                    {line.isOptional ? "[Option] " : ""}
                    {line.description}
                  </Text>
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
            <Text style={styles.totalValue}>{fmt(quote.subtotalHt)}</Text>
          </View>
          {parseFloat(quote.discountPercent ?? "0") > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: "#dc2626" }]}>
                Remise ({quote.discountPercent}%)
              </Text>
              <Text style={[styles.totalValue, { color: "#dc2626" }]}>
                - {fmt(quote.discountAmount)}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA</Text>
            <Text style={styles.totalValue}>{fmt(quote.totalTva)}</Text>
          </View>
          <View style={[styles.totalRow, styles.totalTtc]}>
            <Text style={styles.totalLabel}>Total TTC</Text>
            <Text style={styles.totalValue}>{fmt(quote.totalTtc)}</Text>
          </View>
          {parseFloat(quote.depositPercent ?? "0") > 0 && (
            <View style={[styles.totalRow, { marginTop: 8 }]}>
              <Text style={[styles.totalLabel, { color: "#2563eb" }]}>
                Acompte ({quote.depositPercent}%)
              </Text>
              <Text style={[styles.totalValue, { color: "#2563eb" }]}>
                {fmt(quote.depositAmount)}
              </Text>
            </View>
          )}
        </View>

        {/* Terms */}
        {quote.terms && (
          <View style={styles.terms}>
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
              Conditions
            </Text>
            <Text>{quote.terms}</Text>
          </View>
        )}

        {/* Signature area */}
        <View style={styles.signatureBox}>
          <View style={styles.signatureArea}>
            <Text style={styles.textSmall}>
              Bon pour accord - Date et signature :
            </Text>
          </View>
        </View>

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
