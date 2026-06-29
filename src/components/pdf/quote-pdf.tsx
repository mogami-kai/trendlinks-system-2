import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type { CompanySettings, QuoteLineItem } from "@/lib/types";

Font.register({
  family: "NotoSansJP",
  src: "/fonts/NotoSansJP-Regular.ttf",
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    fontSize: 10,
    padding: 40,
    color: "#1e293b",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  addressBlock: {
    flex: 1,
  },
  companyBlock: {
    width: 200,
    textAlign: "right",
  },
  label: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    marginBottom: 6,
  },
  bold: {
    fontWeight: "bold",
  },
  totalBox: {
    backgroundColor: "#f8fafc",
    border: "1pt solid #e2e8f0",
    borderRadius: 4,
    padding: 8,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 11,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderTop: "1pt solid #e2e8f0",
    borderBottom: "1pt solid #e2e8f0",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #f1f5f9",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  colName: { flex: 2 },
  colDescription: { flex: 2, fontSize: 10 },
  colQty: { width: 40, textAlign: "right" },
  colUnit: { width: 30, textAlign: "center" },
  colUnitPrice: { width: 70, textAlign: "right" },
  colAmount: { width: 70, textAlign: "right" },
  headerText: { fontSize: 9, color: "#64748b" },
  notes: {
    marginTop: 8,
    fontSize: 9,
    color: "#475569",
    lineHeight: 1.6,
  },
  footer: {
    marginTop: 24,
    paddingTop: 12,
    borderTop: "1pt solid #e2e8f0",
    fontSize: 9,
    color: "#94a3b8",
    textAlign: "center",
  },
});

const formatCurrency = (amount: number) =>
  `¥${amount.toLocaleString("ja-JP")}`;

type Props = {
  quoteNumber: string;
  issueDate: string;
  lineItems: QuoteLineItem[];
  notes: string;
  subjectName: string;
  company: CompanySettings;
  addressTo: string;
};

export function QuotePdf({
  quoteNumber,
  issueDate,
  lineItems,
  notes,
  subjectName,
  company,
  addressTo,
}: Props) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const tax = Math.floor(subtotal * 0.1);
  const total = subtotal + tax;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>御　見　積　書</Text>

        <View style={styles.sectionRow}>
          <View style={styles.addressBlock}>
            <Text style={styles.value}>{addressTo} 御中</Text>
            <Text style={{ ...styles.label, marginTop: 12 }}>件名</Text>
            <Text style={styles.value}>{subjectName}</Text>
            <Text style={styles.label}>見積番号</Text>
            <Text style={styles.value}>{quoteNumber}</Text>
            <Text style={styles.label}>発行日</Text>
            <Text style={styles.value}>{issueDate}</Text>
          </View>
          <View style={styles.companyBlock}>
            <Text style={{ ...styles.value, ...styles.bold }}>{company.company_name}</Text>
            {company.postal_code ? (
              <Text style={styles.value}>〒{company.postal_code}</Text>
            ) : null}
            {company.address ? (
              <Text style={styles.value}>{company.address}</Text>
            ) : null}
            {company.phone ? (
              <Text style={styles.value}>TEL: {company.phone}</Text>
            ) : null}
            {company.invoice_registration_number ? (
              <Text style={styles.value}>
                登録番号: {company.invoice_registration_number}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>御見積金額（税込）</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.colName, ...styles.headerText }}>工事項目</Text>
            <Text style={{ ...styles.colDescription, ...styles.headerText }}>摘要</Text>
            <Text style={{ ...styles.colQty, ...styles.headerText }}>数量</Text>
            <Text style={{ ...styles.colUnit, ...styles.headerText }}>単位</Text>
            <Text style={{ ...styles.colUnitPrice, ...styles.headerText }}>単価</Text>
            <Text style={{ ...styles.colAmount, ...styles.headerText }}>金額</Text>
          </View>
          {lineItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colName}>{item.name}</Text>
              <Text style={styles.colDescription}>{item.description || ""}</Text>
              <Text style={styles.colQty}>{item.qty}</Text>
              <Text style={styles.colUnit}>{item.unit}</Text>
              <Text style={styles.colUnitPrice}>{formatCurrency(item.unit_price)}</Text>
              <Text style={styles.colAmount}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
          <View style={{ ...styles.tableRow, borderBottom: "1pt solid #e2e8f0" }}>
            <Text style={{ flex: 1 }} />
            <Text style={styles.label}>小計</Text>
            <Text style={{ width: 80, textAlign: "right" }}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={{ flex: 1 }} />
            <Text style={styles.label}>消費税（10%）</Text>
            <Text style={{ width: 80, textAlign: "right" }}>{formatCurrency(tax)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={{ flex: 1 }} />
            <Text style={{ ...styles.bold }}>合計</Text>
            <Text style={{ width: 80, textAlign: "right", fontWeight: "bold" }}>
              {formatCurrency(total)}
            </Text>
          </View>
        </View>

        {notes ? <Text style={styles.notes}>備考：{notes}</Text> : null}

        <Text style={styles.footer}>
          本見積書の有効期限は発行日より30日間です。
        </Text>
      </Page>
    </Document>
  );
}
