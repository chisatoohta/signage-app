function LogsPage({ logs, styles }) {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <span style={styles.cardTitle}>📋 配信ログ</span>
          <span style={styles.badge}>{logs.length}件</span>
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
            {logs.map((log) => (
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