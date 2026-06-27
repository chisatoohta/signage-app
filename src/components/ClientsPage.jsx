function ClientsPage({
  clients,
  newClient,
  setNewClient,
  addClient,
  deleteClient,
  styles,
}) {
  return (
    <div>
      <h2>🏢 広告主管理</h2>

      <div style={styles.form}>
        <input
          placeholder="会社名"
          value={newClient.company_name}
          onChange={(e) =>
            setNewClient({ ...newClient, company_name: e.target.value })
          }
        />

        <input
          placeholder="担当者名"
          value={newClient.contact_name}
          onChange={(e) =>
            setNewClient({ ...newClient, contact_name: e.target.value })
          }
        />

        <input
          placeholder="電話番号"
          value={newClient.phone}
          onChange={(e) =>
            setNewClient({ ...newClient, phone: e.target.value })
          }
        />

        <input
          placeholder="メール"
          value={newClient.email}
          onChange={(e) =>
            setNewClient({ ...newClient, email: e.target.value })
          }
        />

        <textarea
          placeholder="備考"
          value={newClient.memo}
          onChange={(e) =>
            setNewClient({ ...newClient, memo: e.target.value })
          }
        />

        <button onClick={addClient}>広告主を登録</button>
      </div>

      <div style={styles.cardGrid}>
        {clients.map((client) => (
          <div key={client.id} style={styles.card}>
            <h3>{client.company_name}</h3>
            <p>担当者：{client.contact_name || "未設定"}</p>
            <p>電話：{client.phone || "未設定"}</p>
            <p>メール：{client.email || "未設定"}</p>
            <p>備考：{client.memo || "なし"}</p>

            <button onClick={() => deleteClient(client.id)}>削除</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ClientsPage;