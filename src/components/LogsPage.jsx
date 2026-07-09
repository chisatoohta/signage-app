import { useState } from "react";

function LogsPage({ logs, stores = [], styles }) {
  const [search, setSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState("");

  const sortedLogs = [...logs].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;

    return dateB - dateA;
  });
const storeOptions = Array.from(
  new Map(
    sortedLogs
      .filter((log) => log.store_code)
      .map((log) => [
        log.store_code,
        {
          code: log.store_code,
          name: log.store_name || log.store_code,
        },
      ])
  ).values()
);
 const filteredLogs = sortedLogs.filter((log) => {
  const matchesSearch = (log.ad_title || "")
    .toLowerCase()
    .includes(search.toLowerCase());

  const matchesStore =
    !selectedStore || log.store_code === selectedStore;

  return matchesSearch && matchesStore;
});

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <span style={styles.cardTitle}>📋 配信ログ</span>
          <span style={styles.badge}>{logs.length}件</span>
        </div>

<div
style={{ marginBottom: 16 }}>
  <input
    type="text"
    placeholder="🔍 広告名で検索"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    style={{
      width: "300px",
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #334155",
      background: "#0f172a",
      color: "white",
    }}
  />
</div>
<div style={{ marginBottom: 20 }}>
  <select
    value={selectedStore}
    onChange={(e) => setSelectedStore(e.target.value)}
    style={{
      width: "300px",
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #334155",
      background: "#0f172a",
      color: "white",
    }}
  >
    <option value="">🏪 店舗すべて</option>

    {storeOptions.map((store) => (
  <option key={store.code} value={store.code}>
    {store.name}
  </option>
))}
  </select>
</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>再生日時</th>
              <th style={styles.th}>広告名</th>
              <th style={styles.th}>店舗</th>
              <th style={styles.th}>広告枠</th>
              <th style={styles.th}>再生秒数</th>
            </tr>
          </thead>


          <tbody>
  {filteredLogs.map((log) => (
    <tr key={log.id} style={styles.tr}>
                <td style={styles.td}>
                  {log.created_at
                    ? new Date(log.created_at).toLocaleString("ja-JP")
                    : "-"}
                </td>
                <td style={styles.td}>{log.ad_title || "-"}</td>
                <td style={styles.td}>{log.store_name || log.store_code || "-"}</td>
                <td style={styles.td}>{log.placement || "main"}</td>
                <td style={styles.td}>
                  {log.duration ? `${log.duration}秒` : "-"}
                </td>
              </tr>
            ))}

            {logs.length === 0 && (
              <tr>
                <td style={styles.td} colSpan="5">
                  配信ログはまだありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LogsPage;