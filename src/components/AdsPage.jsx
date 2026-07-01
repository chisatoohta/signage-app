import { useState, useEffect } from "react";
import { supabase } from "../supabase";
function AdsPage({
  ads,
  setAds,
  stores,
  clients = [],
  showToast,
  styles,
  FormField,
}) {
  const [showForm, setShowForm] = useState(false);
 const [form, setForm] = useState({
  title: "",
  file: "",
  duration: "",
  start_date: "",
  end_date: "",
  priority: "1",
  placement: "main",
  client_id: "",
});
  const [selectedStores, setSelectedStores] = useState([]);
  const [editingAd, setEditingAd] = useState(null);
  const [storeCounts, setStoreCounts] = useState({});
  useEffect(() => {
  async function loadStoreCounts() {
    const { data, error } = await supabase
      .from("ad_stores")
      .select("ad_id");

    if (error) {
      console.error("配信店舗数取得エラー:", error);
      return;
    }

    const counts = {};

    data.forEach((row) => {
      counts[row.ad_id] = (counts[row.ad_id] || 0) + 1;
    });

    setStoreCounts(counts);
  }

  loadStoreCounts();
}, []);
  const saveAdStores = async (adId) => {
  // 一旦既存の紐付けを削除
  const { error: deleteError } = await supabase
    .from("ad_stores")
    .delete()
    .eq("ad_id", adId);

  if (deleteError) {
    console.error("ad_stores delete error:", deleteError);
    return;
  }

  // チェックされた店舗を登録
  if (selectedStores.length > 0) {
    const rows = selectedStores.map((storeCode) => ({
      ad_id: adId,
      store_code: storeCode,
    }));

    const { error: insertError } = await supabase
      .from("ad_stores")
      .insert(rows);

    if (insertError) {
      console.error("ad_stores insert error:", insertError);
    }
  }
};
  const handleAdd = async () => {
    if (!form.title || !form.file) {
      return showToast("タイトルとファイルURLを入力してください", "error");
    }

    const { data, error } = await supabase
      .from("ads")
      .insert([
    {
      title: form.title,
      file_url: form.file,
      duration: Number(form.duration) || 15,
      start_date: form.start_date || null,
  end_date: form.end_date || null,
  priority: Number(form.priority) || 1,
  placement: form.placement || "main",
  client_id: form.client_id || null,
    },
  ])
    .select();

  if (error) {
    console.error("広告登録エラー:", error);
    return showToast("広告登録に失敗しました", "error");
  }

  await saveAdStores(data[0].id);

  const newAd = {
    id: data[0].id,
    title: data[0].title,
    file: data[0].file_url || "未設定",
    duration: data[0].duration || 15,
    start_date: data[0].start_date || "",
end_date: data[0].end_date || "",
priority: data[0].priority || 1,
    createdAt: data[0].created_at
      ? data[0].created_at.slice(0, 10)
      : "未設定",
    thumbnail: "📺",
  };

 setAds([...ads,  newAd]);
  setForm({
  title: "",
  file: "",
  duration: "",
  start_date: "",
  end_date: "",
  priority: "1",
  placement: "main",
});
  setShowForm(false);
  showToast("広告を登録しました");
};

const handleDelete = async (id) => {
  const { error } = await supabase
    .from("ads")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("広告削除エラー:", error);
    return showToast("広告の削除に失敗しました", "error");
  }

  setAds(ads.filter((a) => a.id !== id));
  showToast("広告を削除しました");
};

const handleEdit = async (ad) => {
  setEditingAd(ad);
  setForm({
  title: ad.title,
  file: ad.file,
  duration: ad.duration,
  start_date: ad.start_date || "",
  end_date: ad.end_date || "",
  priority: String(ad.priority || 1),
  placement: ad.placement || "main",
});

  const { data, error } = await supabase
    .from("ad_stores")
    .select("store_code")
    .eq("ad_id", ad.id);

  if (error) {
    console.error("配信店舗取得エラー:", error);
    setSelectedStores([]);
  } else {
    console.log("編集時の配信店舗:", data);
    setSelectedStores(data.map((row) => row.store_code));
  }

  setShowForm(true);
};

const handleUpdate = async () => {
  if (!editingAd) return;

  const { data, error } = await supabase
    .from("ads")
    .update({
  title: form.title,
  file_url: form.file,
  duration: Number(form.duration) || 15,
 start_date: form.start_date || null,
end_date: form.end_date || null,
priority: Number(form.priority) || 1,
placement: form.placement || "main",
client_id: form.client_id || null,
})
    .eq("id", editingAd.id)
    .select();

  if (error) {
    console.error("広告更新エラー:", error);
    return showToast("広告の更新に失敗しました", "error");
  }

  await saveAdStores(editingAd.id);

  const updatedAd = {
    id: data[0].id,
    title: data[0].title,
    file: data[0].file_url || "未設定",
    duration: data[0].duration || 15,
    start_date: data[0].start_date || "",
end_date: data[0].end_date || "",
priority: data[0].priority || 1,
    createdAt: data[0].created_at
      ? data[0].created_at.slice(0, 10)
      : "未設定",
    thumbnail: "📺",
  };

  setAds(ads.map((a) => (a.id === editingAd.id ? updatedAd : a)));
  setForm({
  title: "",
  file: "",
  duration: "",
  start_date: "",
  end_date: "",
  priority: "1",
});
  setEditingAd(null);
  setShowForm(false);
  showToast("広告を更新しました");
};

  return (
    <div>
      <div style={styles.pageActions}>
        <button style={styles.btnPrimary} onClick={() => setShowForm(!showForm)}>
          {showForm ? "✕ キャンセル" : "+ 広告を登録"}
        </button>
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <div style={styles.cardTitle}>新規広告登録</div>
          <div style={styles.formGrid}>
            <FormField label="広告タイトル *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="例: 夏季キャンペーン2026" />
            <FormField label="動画ファイル名 *" value={form.file} onChange={(v) => setForm({ ...form, file: v })} placeholder="例: summer.mp4" />
            <FormField label="再生時間（秒）" value={form.duration} onChange={(v) => setForm({ ...form, duration: v })} placeholder="例: 30" type="number" />
          </div>
          <FormField
  label="配信開始日"
  value={form.start_date}
  onChange={(v) => setForm({ ...form, start_date: v })}
  type="date"
/>

<FormField
  label="配信終了日"
  value={form.end_date}
  onChange={(v) => setForm({ ...form, end_date: v })}
  type="date"
/>

<FormField
  label="優先順位"
  value={form.priority}
  onChange={(v) => setForm({ ...form, priority: v })}
  type="number"
  />

  <div style={styles.formField}>
  <label>表示位置</label>

  <select
    value={form.placement}
    onChange={(e) =>
      setForm({ ...form, placement: e.target.value })
    }
    style={styles.input}
  >
    <option value="main">メイン広告</option>
    <option value="banner">バナー広告</option>
  </select>
</div>
<div style={styles.formField}>
  <label>広告主</label>

  <select
    value={form.client_id}
    onChange={(e) =>
      setForm({ ...form, client_id: e.target.value })
    }
    style={styles.input}
  >
    <option value="">選択してください</option>

    {clients.map((client) => (
      <option key={client.id} value={client.id}>
        {client.company_name}
      </option>
    ))}
  </select>
</div>

          <div style={{ marginTop: 16 }}>
  <div style={{ marginBottom: 8, fontWeight: 600 }}>
    配信店舗
  </div>

  {stores.map((store) => (
    <label
      key={store.id}
      style={{
        display: "inline-block",
        marginRight: 16,
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={selectedStores.includes(store.code)}
        onChange={(e) => {
          if (e.target.checked) {
            setSelectedStores([
              ...selectedStores,
              store.code,
            ]);
          } else {
            setSelectedStores(
              selectedStores.filter(
                (code) => code !== store.code
              )
            );
          }
        }}
      />

      {" "}
      {store.name}
    </label>
  ))}
</div>
          <button
  style={styles.btnPrimary}
  onClick={editingAd ? handleUpdate : handleAdd}
>

  {editingAd ? "更新する" : "登録する"}
</button>
        </div>
      )}

      <div style={styles.cardGrid}>
        {ads.map((ad) => (
          <div key={ad.id} style={styles.adCard}>
  <div style={styles.adInfo}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <div
  style={{
    ...styles.adTitle,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 220,
  }}
  title={ad.title}
>
  {ad.title}
</div>

  <span
    style={{
      fontSize: 11,
      padding: "2px 8px",
      borderRadius: 999,
      background: ad.placement === "banner" ? "#78350f" : "#1e3a8a",
      color: ad.placement === "banner" ? "#fbbf24" : "#bfdbfe",
      fontWeight: 700,
      whiteSpace: "nowrap",
    }}
  >
    {ad.placement === "banner" ? "バナー" : "メイン"}
  </span>
</div>

<div style={{ fontSize: 13, color: "#64748b" }}>
  🏢 {ad.clientName}
</div>
              <div style={styles.adMeta}>
  {ad.file?.toLowerCase().endsWith(".mp4") ? (
    <video
      src={ad.file}
      muted
      preload="metadata"
     style={{
  width: 150,
  height: 100,
  objectFit: "cover",
  borderRadius: 10,
  border: "1px solid #24304f",
  background: "#000",
  display: "block",
  margin: "0 auto",
}}
    />
  ) : (
    <img
      src={ad.file}
      alt={ad.title}
      style={{
  width: 150,
  height: 100,
  objectFit: "cover",
  borderRadius: 10,
  border: "1px solid #24304f",
  background: "#000",
  display: "block",
  margin: "0 auto",
}}
    />
  )}
</div>
             <div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 6,
    marginTop: 8,
  }}
>
  <span style={styles.badge}>
    {ad.placement === "banner" ? "🟨 バナー" : "🟦 メイン"}
  </span>

  <span style={styles.badge}>
    {ad.file?.toLowerCase().endsWith(".mp4") ? "🎬 動画" : "🖼 静止画"}
  </span>

  <span style={styles.badge}>⏱ {ad.duration}秒</span>

  <span style={styles.badge}>⭐ 優先{ad.priority}</span>
</div>

<div style={{ marginTop: 8 }}>
  <span style={styles.badge}>
    📅{" "}
    {!ad.start_date && !ad.end_date
      ? "未設定"
      : `${ad.start_date || ""} ～ ${ad.end_date || ""}`}
  </span>
</div>
<div style={{ marginTop: 8 }}>
  <span style={styles.badge}>
    🏪 配信店舗：{storeCounts[ad.id] || 0}店舗
  </span>
</div>
<hr
  style={{
    border: "none",
    borderTop: "1px solid #24304f",
    margin: "16px 0 12px",
  }}
/>

<div
  style={{
    display: "flex",
    justifyContent: "center",
    gap: 12,
  }}
>
  <button
    style={styles.btnPrimary}
    onClick={() => handleEdit(ad)}
  >
    ✏ 編集
  </button>

  <button
    style={styles.btnDanger}
    onClick={() => handleDelete(ad.id)}
  >
    🗑 削除
  </button>
</div>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}
export default AdsPage;

