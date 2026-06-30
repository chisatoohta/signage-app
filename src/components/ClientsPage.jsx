import { useState } from "react";

function ClientsPage({
  clients,
  newClient,
  setNewClient,
  addClient,
  deleteClient,
  updateClient,
  styles,
}) {
  const [editingClient, setEditingClient] = useState(null);

  const startEdit = (client) => {
    setEditingClient(client);
    setNewClient({
      company_name: client.company_name || "",
      contact_name: client.contact_name || "",
      phone: client.phone || "",
      email: client.email || "",
      memo: client.memo || "",
    });
  };

  const cancelEdit = () => {
    setEditingClient(null);
    setNewClient({
      company_name: "",
      contact_name: "",
      phone: "",
      email: "",
      memo: "",
    });
  };

  const handleSubmit = () => {
    if (editingClient) {
      updateClient(editingClient.id, () => setEditingClient(null));
    } else {
      addClient();
    }
  };

  return (
    <div>
      <h2>🏢 広告主管理</h2>

      <div style={styles.formCard}>
        <div style={styles.cardTitle}>
          {editingClient ? "広告主を編集" : "広告主を登録"}
        </div>

        <div style={styles.formGrid}>
          <input
            style={styles.input}
            placeholder="会社名"
            value={newClient.company_name}
            onChange={(e) =>
              setNewClient({ ...newClient, company_name: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="担当者名"
            value={newClient.contact_name}
            onChange={(e) =>
              setNewClient({ ...newClient, contact_name: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="電話番号"
            value={newClient.phone}
            onChange={(e) =>
              setNewClient({ ...newClient, phone: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="メール"
            value={newClient.email}
            onChange={(e) =>
              setNewClient({ ...newClient, email: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="備考"
            value={newClient.memo}
            onChange={(e) =>
              setNewClient({ ...newClient, memo: e.target.value })
            }
          />
        </div>

        <button style={styles.btnPrimary} onClick={handleSubmit}>
          {editingClient ? "更新する" : "広告主を登録"}
        </button>

        {editingClient && (
          <button
            style={{ ...styles.btnDangerSm, marginLeft: 8 }}
            onClick={cancelEdit}
          >
            キャンセル
          </button>
        )}
      </div>

      <div style={styles.cardGrid}>
        {clients.map((client) => (
          <div key={client.id} style={styles.card}>
            <h3>{client.company_name}</h3>
            <p>担当者：{client.contact_name || "未設定"}</p>
            <p>電話：{client.phone || "未設定"}</p>
            <p>メール：{client.email || "未設定"}</p>
            <p>備考：{client.memo || "なし"}</p>

            <button style={styles.btnPrimary} onClick={() => startEdit(client)}>
              編集
            </button>

            <button
  style={{ ...styles.btnDangerSm, marginLeft: 8 }}
  onClick={() => {
    if (window.confirm("この広告主を削除しますか？")) {
      deleteClient(client.id);
    }
  }}
>
  削除
</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ClientsPage;