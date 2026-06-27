import { useState } from "react";
import { supabase } from "../supabase";
function AdsPage({
  ads,
  setAds,
  stores,
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
});
  const [selectedStores, setSelectedStores] = useState([]);
  const [editingAd, setEditingAd] = useState(null);
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

  <div style={styles.field}>
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
            <div style={styles.adThumb}>{ad.thumbnail}</div>
            <div style={styles.adInfo}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <div style={styles.adTitle}>{ad.title}</div>

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
              <div style={styles.adMeta}>
  {ad.file?.toLowerCase().endsWith(".mp4") ? (
    <video
      src={ad.file}
      muted
      preload="metadata"
      style={{
        width: 120,
        height: 80,
        objectFit: "cover",
        borderRadius: 8,
        background: "#000",
      }}
    />
  ) : (
    <img
      src={ad.file}
      alt={ad.title}
      style={{
        width: 120,
        height: 80,
        objectFit: "cover",
        borderRadius: 8,
      }}
    />
  )}
</div>
              <div style={styles.adMeta}>
                <span style={styles.badge}>▶ {ad.duration}秒</span>
                <span style={{ ...styles.badge, marginLeft: 6 }}>📅 {ad.createdAt}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
  <button style={styles.btnPrimary} onClick={() => handleEdit(ad)}>編集</button>
  <button style={styles.btnDanger} onClick={() => handleDelete(ad.id)}>削除</button>
</div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default AdsPage;

