import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type { CompanySettings, TenantInvoiceLineItem } from "@/lib/types";

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
  addressBlock: { flex: 1 },
  companyBlock: { width: 200, textAlign: "right" },
  label: { fontSize: 9, color: "#64748b", marginBottom: 2 },
  value: { fontSize: 10, marginBottom: 6 },
  bold: { fontWeight: "bold" },
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
  totalLabel: { fontSize: 11 },
  totalValue: { fontSize: 14, fontWeight: "bold" },
  table: { marginBottom: 16 },
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
  colName: { flex: 3 },
  colQty: { width: 36, textAlign: "right" },
  colUnit: { width: 28, textAlign: "center" },
  colUnitPrice: { width: 60, textAlign: "right" },
  colAmount: { width: 60, textAlign: "right" },
  colRatio: { width: 36, textAlign: "right" },
  colTenantAmount: { width: 70, textAlign: "right" },
  headerText: { fontSize: 8, color: "#64748b" },
  summaryBox: {
    border: "1pt solid #e2e8f0",
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  signatureSection: {
    marginTop: 20,
    border: "1pt solid #e2e8f0",
    borderRadius: 4,
    padding: 12,
  },
  signatureTitle: { fontSize: 10, marginBottom: 8, color: "#475569" },
  signatureImage: { height: 80, objectFit: "contain" },
  notes: {
    marginTop: 8,
    fontSize: 9,
    color: "#475569",
    lineHeight: 1.6,
  },
});

const fmt = (amount: number) => `¥${amount.toLocaleString("ja-JP")}`;

type Props = {
  invoiceNumber: string;
  issueDate: string;
  tenantName: string;
  lineItems: TenantInvoiceLineItem[];
  depositAmount: number;
  prepaidAmount: number;
  depositOffset: number;
  notes: string;
  subjectName: string;
  company: CompanySettings;
  signatureDataUrl: string | null;
};

export function TenantInvoicePdf({
  invoiceNumber,
  issueDate,
  tenantName,
  lineItems,
  depositAmount,
  prepaidAmount,
  depositOffset,
  notes,
  subjectName,
  company,
  signatureDataUrl,
}: Props) {
  const tenantTotal = lineItems.reduce((sum, item) => sum + item.tenant_amount, 0);
  const tax = Math.floor(tenantTotal * 0.1);
  const grossTotal = tenantTotal + tax;
  const received = (depositAmount || 0) + (prepaidAmount || 0);
  const balance = grossTotal - received - (depositOffset || 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>入　居　者　請　求　書</Text>

        <View style={styles.sectionRow}>
          <View style={styles.addressBlock}>
            <Text style={styles.value}>{tenantName} 様</Text>
            <Text style={{ ...styles.label, marginTop: 12 }}>件名</Text>
            <Text style={styles.value}>{subjectName}</Text>
            <Text style={styles.label}>請求書番号</Text>
            <Text style={styles.value}>{invoiceNumber}</Text>
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
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.colName, ...styles.headerText }}>工事項目</Text>
            <Text style={{ ...styles.colQty, ...styles.headerText }}>数量</Text>
            <Text style={{ ...styles.colUnit, ...styles.headerText }}>単位</Text>
            <Text style={{ ...styles.colUnitPrice, ...styles.headerText }}>単価</Text>
            <Text style={{ ...styles.colAmount, ...styles.headerText }}>金額</Text>
            <Text style={{ ...styles.colRatio, ...styles.headerText }}>負担</Text>
            <Text style={{ ...styles.colTenantAmount, ...styles.headerText }}>入居者負担額</Text>
          </View>
          {lineItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colName}>{item.name}</Text>
              <Text style={styles.colQty}>{item.qty}</Text>
              <Text style={styles.colUnit}>{item.unit}</Text>
              <Text style={styles.colUnitPrice}>{fmt(item.unit_price)}</Text>
              <Text style={styles.colAmount}>{fmt(item.amount)}</Text>
              <Text style={styles.colRatio}>{item.ratio}%</Text>
              <Text style={styles.colTenantAmount}>{fmt(item.tenant_amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>入居者負担小計</Text>
            <Text>{fmt(tenantTotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>消費税（10%）</Text>
            <Text>{fmt(tax)}</Text>
          </View>
          <View style={{ ...styles.summaryRow, borderTop: "1pt solid #e2e8f0", paddingTop: 4, marginTop: 4 }}>
            <Text style={styles.bold}>入居者負担合計（税込）</Text>
            <Text style={styles.bold}>{fmt(grossTotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>敷金</Text>
            <Text>△ {fmt(depositAmount || 0)}</Text>
          </View>
          {prepaidAmount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.label}>前払い金</Text>
              <Text>△ {fmt(prepaidAmount)}</Text>
            </View>
          ) : null}
          {depositOffset !== 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.label}>その他相殺</Text>
              <Text>△ {fmt(depositOffset)}</Text>
            </View>
          ) : null}
          <View style={{ ...styles.summaryRow, borderTop: "1pt solid #cbd5e1", paddingTop: 6, marginTop: 4 }}>
            <Text style={{ ...styles.bold, fontSize: 12 }}>
              {balance >= 0 ? "ご請求額" : "ご返金額"}（税込）
            </Text>
            <Text style={{ ...styles.bold, fontSize: 13 }}>
              {balance >= 0 ? fmt(balance) : `${fmt(Math.abs(balance))} 返金`}
            </Text>
          </View>
        </View>

        {notes ? <Text style={styles.notes}>備考：{notes}</Text> : null}

        {signatureDataUrl ? (
          <View style={styles.signatureSection}>
            <Text style={styles.signatureTitle}>入居者サイン</Text>
            <Image src={signatureDataUrl} style={styles.signatureImage} />
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
