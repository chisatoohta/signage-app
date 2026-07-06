import { useState } from "react";

function ReportPage({
  logs,
  ads,
  clients,
  styles,
  StatCard,
}) {
 const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");
const [selectedClient, setSelectedClient] = useState("");

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

  return true;
});
  const mainLogs = filteredLogs.filter(
    (log) => (log.placement || "main") === "main"
  );

  const bannerLogs = filteredLogs.filter(
    (log) => log.placement === "banner"
  );

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
                <td style={styles.td}>{count} 回</td>
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
        <div style={styles.cardHeader}>
          <span style={styles.cardTitle}>広告枠別サマリー</span>
        </div>

        <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 16,
    alignItems: "end",
    marginTop: 16,
    marginBottom: 20,
  }}
>
  <div>
    <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
      開始日
    </div>
    <input
      type="date"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
      style={styles.input}
    />
  </div>

  <div>
    <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
      終了日
    </div>
    <input
      type="date"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
      style={styles.input}
    />
  </div>

  <div>
    <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
      広告主
    </div>

    <select
      value={selectedClient}
      onChange={(e) => setSelectedClient(e.target.value)}
      style={styles.input}
    >
      <option value="">すべて</option>

      {clients.map((client) => (
        <option key={client.id} value={client.id}>
          {client.company_name}
        </option>
      ))}
    </select>
  </div>

  <button
    style={{ ...(styles.btnSecondary || styles.btnPrimary), height: 36 }}
    onClick={() => {
      setStartDate("");
      setEndDate("");
      setSelectedClient("");
    }}
  >
    リセット
  </button>
</div>

        <div style={styles.grid2}>
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