import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";

// 日本語フォント登録 (実運用では公開URLまたは同梱フォントを指定)
// 失敗してもPDF生成自体は継続する
try {
  Font.register({
    family: "NotoSansJP",
    src:
      process.env.PDF_FONT_URL ||
      "https://fonts.gstatic.com/ea/notosansjapanese/v6/NotoSansJP-Regular.otf",
  });
} catch {
  /* noop */
}

const styles = StyleSheet.create({
  page: { padding: 32, fontFamily: "NotoSansJP", fontSize: 11, color: "#0f172a" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "2 solid #059669",
    paddingBottom: 8,
    marginBottom: 16,
  },
  company: { fontSize: 16, fontWeight: 700, color: "#047857" },
  title: { fontSize: 14, marginBottom: 12, fontWeight: 700 },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: 90, color: "#64748b" },
  value: { flex: 1 },
  section: { marginTop: 14 },
  photos: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  photo: { width: 150, height: 110, objectFit: "cover", marginRight: 6, marginBottom: 6 },
  footer: { marginTop: 24, paddingTop: 8, borderTop: "1 solid #e2e8f0", color: "#94a3b8", fontSize: 9 },
});

export interface ReportPdfData {
  companyName: string;
  siteName: string;
  siteAddress: string;
  workDate: string;
  staffName: string;
  comment: string;
  photoUrls: string[];
  generatedAt: string;
}

function ReportDocument({ data }: { data: ReportPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.company}>{data.companyName}</Text>
          <Text>発行日: {data.generatedAt}</Text>
        </View>

        <Text style={styles.title}>清掃完了報告書</Text>

        <View style={styles.row}>
          <Text style={styles.label}>現場名</Text>
          <Text style={styles.value}>{data.siteName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>住所</Text>
          <Text style={styles.value}>{data.siteAddress}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>作業日</Text>
          <Text style={styles.value}>{data.workDate}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>担当者</Text>
          <Text style={styles.value}>{data.staffName}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>完了コメント</Text>
          <Text style={styles.value}>{data.comment || "—"}</Text>
        </View>

        {data.photoUrls.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>作業写真</Text>
            <View style={styles.photos}>
              {data.photoUrls.map((u, i) => (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image key={i} src={u} style={styles.photo} />
              ))}
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          本報告書は {data.companyName} が品質証明として発行したものです。
        </Text>
      </Page>
    </Document>
  );
}

export async function generateReportPdf(data: ReportPdfData): Promise<Buffer> {
  return await renderToBuffer(<ReportDocument data={data} />);
}
