import { useState } from "react";

function ReportPage({
  logs,
  ads,
  clients,
  stores,
  styles,
  StatCard,
}) {
const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");
const [selectedClient, setSelectedClient] = useState("");
const [selectedStore, setSelectedStore] = useState("");

const getAdByLog = (log) => {
  return ads.find((ad) => String(ad.id) === String(log.ad_id));
};
  
const filteredLogs = logs.filter((log) => {
  if (!log.created_at) return false;

  const date = log.created_at.slice(0, 10);

  if (startDate && date < startDate) return false;
  if (endDate && date > endDate) return false;

  if (selectedClient) {
  const ad = getAdByLog(log);

  if (!ad || String(ad.client_id) !== String(selectedClient)) {
    return false;
  }
}
if (selectedStore) {
  const logStoreCode = log.store_code?.toLowerCase().trim();
  const selected = selectedStore?.toLowerCase().trim();

  if (logStoreCode !== selected) {
    return false;
  }
}

return true;
});
  const mainLogs = filteredLogs.filter(
    (log) => (log.placement || "main") === "main"
  );

  const bannerLogs = filteredLogs.filter(
    (log) => log.placement === "banner"
  );

  const dailyReports = filteredLogs.reduce((acc, log) => {
  if (!log.created_at) return acc;

  const date = log.created_at.slice(0, 10);
  acc[date] = (acc[date] || 0) + 1;

  return acc;
}, {});

const dailyReportList = Object.entries(dailyReports).sort(
  ([dateA], [dateB]) => dateB.localeCompare(dateA)
);

const exportCsv = () => {
  const headers = [
    "再生日時",
    "広告名",
    "広告枠",
    "店舗コード",
    "店舗名",
    "再生秒数",
  ];

  const rows = filteredLogs.map((log) => [
    log.created_at ? new Date(log.created_at).toLocaleString("ja-JP") : "",
    log.ad_title || "",
    log.placement || "main",
    log.store_code || "",
    log.store_name || "",
    log.duration || "",
  ]);

 const infoRows = [
  ["レポート期間", `${startDate || "すべて"} ～ ${endDate || "すべて"}`],
  [
    "広告主",
    selectedClient
      ? clients.find((c) => String(c.id) === String(selectedClient))
          ?.company_name || "不明"
      : "すべて",
  ],
  [
    "店舗",
    selectedStore
      ? stores.find((s) => s.code === selectedStore)?.name || "不明"
      : "すべて",
  ],
  [],
];

const csv = [...infoRows, headers, ...rows]
  .map((row) =>
    row
      .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
      .join(",")
  )
  .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
  type: "text/csv;charset=utf-8;",
});

const url = URL.createObjectURL(blob);

const link = document.createElement("a");
link.href = url;
const fileStart = startDate || "all";
const fileEnd = endDate || "all";

link.download = `signage_report_${fileStart}_${fileEnd}.csv`;
link.click();

URL.revokeObjectURL(url);
};
  const createRanking = (targetLogs, keyName, fallback = "不明") => {
    const counts = targetLogs.reduce((acc, log) => {
      const name = log[keyName] || fallback;
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  const renderRankingTable = (title, ranking, label) => (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.cardTitle}>{title}</span>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>{label}</th>
            <th style={styles.th}>再生回数</th>
          </tr>
        </thead>
        <tbody>
          {ranking.length === 0 ? (
            <tr>
              <td style={styles.td} colSpan="2">
                データがありません
              </td>
            </tr>
          ) : (
            ranking.map(([name, count]) => (
              <tr key={name} style={styles.tr}>
                <td style={styles.td}>{name}</td>
                <td style={styles.td}>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
    }}
  >
    <div
      style={{
        height: 10,
        width: `${Math.max(20, count)}px`,
        background: "#3b82f6",
        borderRadius: 999,
      }}
    />

    <span>{count} 回</span>
  </div>
</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

 return (
  <div style={{ display: "grid", gap: 20 }}>
    <div style={styles.card}>
     <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
  <div style={styles.cardHeader}>
    <span style={styles.cardTitle}>📊 レポート条件</span>
  </div>

  <button
    style={styles.btnPrimary}
    onClick={exportCsv}
  >
    📄 CSV出力
  </button>
</div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 20,
          alignItems: "end",
          marginTop: 18,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
            開始日
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ ...styles.input, width: "100%" }}
          />
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
            終了日
          </div>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ ...styles.input, width: "100%" }}
          />
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
            広告主
          </div>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            style={{ ...styles.input, width: "100%" }}
          >
            <option value="">すべて</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.company_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
            店舗
          </div>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            style={{ ...styles.input, width: "100%" }}
          >
            <option value="">すべて</option>
            {stores.map((store) => (
  <option key={store.id} value={store.code || store.name}>
    {store.name}
  </option>
))}
          </select>
        </div>

        <button
          style={{
            ...(styles.btnSecondary || styles.btnPrimary),
            height: 38,
            width: "100%",
          }}
          onClick={() => {
            setStartDate("");
            setEndDate("");
            setSelectedClient("");
            setSelectedStore("");
          }}
        >
          リセット
        </button>
      </div>
    </div>

    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.cardTitle}>広告枠別サマリー</span>
      </div>

      <div style={{ ...styles.grid2, marginTop: 16 }}>
        <StatCard
          label="メイン広告再生数"
          value={mainLogs.length}
          unit="回"
          icon="🖥"
          color="#6366f1"
        />
        <StatCard
          label="バナー広告再生数"
          value={bannerLogs.length}
          unit="回"
          icon="📢"
          color="#ec4899"
        />
      </div>
    </div>
<div style={styles.card}>
  <div style={styles.cardHeader}>
    <span style={styles.cardTitle}>日別再生数</span>
  </div>

  <table style={styles.table}>
    <thead>
      <tr>
        <th style={styles.th}>日付</th>
        <th style={styles.th}>再生回数</th>
      </tr>
    </thead>

    <tbody>
      {dailyReportList.length === 0 ? (
        <tr>
          <td style={styles.td} colSpan="2">
            データがありません
          </td>
        </tr>
      ) : (
        dailyReportList.map(([date, count]) => (
          <tr key={date} style={styles.tr}>
            <td style={styles.td}>
  {new Date(date).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
  })}
</td>
            <td style={styles.td}>{count} 回</td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>
      {renderRankingTable(
        "メイン広告｜広告別再生回数",
        createRanking(mainLogs, "ad_title"),
        "広告"
      )}

      {renderRankingTable(
        "メイン広告｜店舗別再生回数",
        createRanking(mainLogs, "store_name"),
        "店舗"
      )}

      {renderRankingTable(
        "バナー広告｜広告別再生回数",
        createRanking(bannerLogs, "ad_title"),
        "広告"
      )}

      {renderRankingTable(
        "バナー広告｜店舗別再生回数",
        createRanking(bannerLogs, "store_name"),
        "店舗"
      )}
    </div>
  );
}

export default ReportPage;