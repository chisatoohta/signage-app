import { useEffect, useState } from "react";
import { supabase } from "../supabase";

const DAYS = [
  { value: "mon", label: "月" },
  { value: "tue", label: "火" },
  { value: "wed", label: "水" },
  { value: "thu", label: "木" },
  { value: "fri", label: "金" },
  { value: "sat", label: "土" },
  { value: "sun", label: "日" },
];

function DeliveryPage({ ads, stores, showToast, styles }) {
const [rules, setRules] = useState([]);
const [editingRuleId, setEditingRuleId] = useState(null);

const [searchAd, setSearchAd] = useState("");
const [searchStore, setSearchStore] = useState("");
const [searchStatus, setSearchStatus] = useState("");
const [onlyActive, setOnlyActive] = useState(false);
  const [form, setForm] = useState({
    ad_id: "",
    store_code: "",
    days_of_week: [],
    start_time: "",
    end_time: "",
    start_date: "",
    end_date: "",
    priority: "1",
    enabled: true,
  });

  useEffect(() => {
    loadRules();
  }, []);

  async function loadRules() {
    const { data, error } = await supabase
      .from("delivery_rules")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("配信ルール取得エラー:", error);
      showToast("配信ルール取得に失敗しました", "error");
      return;
    }

    setRules(data || []);
  }

  const toggleDay = (day) => {
    const exists = form.days_of_week.includes(day);

    setForm({
      ...form,
      days_of_week: exists
        ? form.days_of_week.filter((d) => d !== day)
        : [...form.days_of_week, day],
    });
  };

  async function addRule() {
  if (!form.ad_id) return showToast("広告を選択してください", "error");
  if (!form.store_code) return showToast("店舗を選択してください", "error");

  const payload = {
    ad_id: Number(form.ad_id),
    store_code: form.store_code,
    days_of_week: form.days_of_week,
    start_time: form.start_time || null,
    end_time: form.end_time || null,
    start_date: form.start_date || null,
    end_date: form.end_date || null,
    priority: Number(form.priority) || 1,
    enabled: form.enabled,
  };

  const { error } = editingRuleId
    ? await supabase
        .from("delivery_rules")
        .update(payload)
        .eq("id", editingRuleId)
    : await supabase.from("delivery_rules").insert([payload]);

  if (error) {
    console.error("配信ルール保存エラー:", error);
    showToast("配信ルール保存に失敗しました", "error");
    return;
  }

  showToast(editingRuleId ? "配信ルールを更新しました" : "配信ルールを登録しました");

  setEditingRuleId(null);

  setForm({
    ad_id: "",
    store_code: "",
    days_of_week: [],
    start_time: "",
    end_time: "",
    start_date: "",
    end_date: "",
    priority: "1",
    enabled: true,
  });

  loadRules();
}
function editRule(rule) {
  setEditingRuleId(rule.id);

  setForm({
    ad_id: String(rule.ad_id),
    store_code: rule.store_code,
    days_of_week: rule.days_of_week || [],
    start_time: rule.start_time || "",
    end_time: rule.end_time || "",
    start_date: rule.start_date || "",
    end_date: rule.end_date || "",
    priority: String(rule.priority || 1),
    enabled: rule.enabled,
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

  async function deleteRule(id) {
    if (!window.confirm("この配信ルールを削除しますか？")) return;

    const { error } = await supabase
      .from("delivery_rules")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("配信ルール削除エラー:", error);
      showToast("配信ルール削除に失敗しました", "error");
      return;
    }

    showToast("配信ルールを削除しました");
    loadRules();
  }

  const getAdTitle = (adId) =>
    ads.find((ad) => String(ad.id) === String(adId))?.title || "広告不明";

  const getStoreName = (code) =>
    stores.find((store) => store.code === code)?.name || code;

  const formatDays = (days) => {
    if (!days || days.length === 0) return "全曜日";
    return days
      .map((day) => DAYS.find((d) => d.value === day)?.label)
      .filter(Boolean)
      .join("・");
  };
  const getRuleStatus = (rule) => {
  if (!rule.enabled) return "停止中";

  const now = new Date();

  const today = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][
    now.getDay()
  ];

  const currentTime = now.toTimeString().slice(0, 5);
  const todayDate = now.toISOString().split("T")[0];

  if (rule.start_date && todayDate < rule.start_date) {
    return "開始前";
  }

  if (rule.end_date && todayDate > rule.end_date) {
    return "終了";
  }

  if (
    rule.days_of_week &&
    rule.days_of_week.length > 0 &&
    !rule.days_of_week.includes(today)
  ) {
    return "曜日外";
  }

  if (rule.start_time && currentTime < rule.start_time.slice(0, 5)) {
    return "時間外";
  }

  if (rule.end_time && currentTime > rule.end_time.slice(0, 5)) {
    return "時間外";
  }

  return "配信中";
};
const filteredRules = rules.filter((rule) => {
  const status = getRuleStatus(rule);

  if (searchAd && String(rule.ad_id) !== searchAd) {
    return false;
  }

  if (searchStore && rule.store_code !== searchStore) {
    return false;
  }

  if (searchStatus && status !== searchStatus) {
    return false;
  }

  if (onlyActive && status !== "配信中") {
    return false;
  }

  return true;
});

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={styles.formCard}>
        <div style={styles.cardTitle}>配信ルール登録</div>

        <div style={styles.formGrid}>
          <div style={styles.formField}>
            <label style={styles.label}>広告</label>
            <select
              style={styles.input}
              value={form.ad_id}
              onChange={(e) => setForm({ ...form, ad_id: e.target.value })}
            >
              <option value="">選択してください</option>
              {ads.map((ad) => (
                <option key={ad.id} value={ad.id}>
                  {ad.title}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formField}>
            <label style={styles.label}>店舗</label>
            <select
              style={styles.input}
              value={form.store_code}
              onChange={(e) =>
                setForm({ ...form, store_code: e.target.value })
              }
            >
              <option value="">選択してください</option>
              {stores.map((store) => (
                <option key={store.id} value={store.code}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formField}>
            <label style={styles.label}>優先順位</label>
            <input
              style={styles.input}
              type="number"
              value={form.priority}
              onChange={(e) =>
                setForm({ ...form, priority: e.target.value })
              }
            />
          </div>

          <div style={styles.formField}>
            <label style={styles.label}>開始時間</label>
            <input
              style={styles.input}
              type="time"
              value={form.start_time}
              onChange={(e) =>
                setForm({ ...form, start_time: e.target.value })
              }
            />
          </div>

          <div style={styles.formField}>
            <label style={styles.label}>終了時間</label>
            <input
              style={styles.input}
              type="time"
              value={form.end_time}
              onChange={(e) =>
                setForm({ ...form, end_time: e.target.value })
              }
            />
          </div>

          <div style={styles.formField}>
            <label style={styles.label}>状態</label>
            <select
              style={styles.input}
              value={form.enabled ? "true" : "false"}
              onChange={(e) =>
                setForm({ ...form, enabled: e.target.value === "true" })
              }
            >
              <option value="true">有効</option>
              <option value="false">停止</option>
            </select>
          </div>

          <div style={styles.formField}>
            <label style={styles.label}>配信開始日</label>
            <input
              style={styles.input}
              type="date"
              value={form.start_date}
              onChange={(e) =>
                setForm({ ...form, start_date: e.target.value })
              }
            />
          </div>

          <div style={styles.formField}>
            <label style={styles.label}>配信終了日</label>
            <input
              style={styles.input}
              type="date"
              value={form.end_date}
              onChange={(e) =>
                setForm({ ...form, end_date: e.target.value })
              }
            />
          </div>
        </div>

        <div style={{ margin: "16px 0" }}>
          <div style={styles.label}>曜日</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {DAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                style={{
                  ...styles.badge,
                  cursor: "pointer",
                  background: form.days_of_week.includes(day.value)
                    ? "#1e3a8a"
                    : "#172040",
                  color: form.days_of_week.includes(day.value)
                    ? "#bfdbfe"
                    : "#94a3b8",
                }}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
<div style={{ display: "flex", gap: 10 }}>
  <button style={styles.btnPrimary} onClick={addRule}>
    {editingRuleId ? "💾 配信ルールを更新" : "＋ 配信ルールを登録"}
  </button>

  {editingRuleId && (
    <button
      style={styles.btnDangerSm}
      onClick={() => {
        setEditingRuleId(null);
        setForm({
          ad_id: "",
          store_code: "",
          days_of_week: [],
          start_time: "",
          end_time: "",
          start_date: "",
          end_date: "",
          priority: "1",
          enabled: true,
        });
      }}
    >
      ✕ キャンセル
    </button>
  )}
</div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
  <span style={styles.cardTitle}>配信ルール一覧</span>
  <span style={styles.badge}>
  {filteredRules.length} / {rules.length}件
</span>
</div>

<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 10,
    marginTop: 16,
    marginBottom: 20,
  }}
>
  <select
    style={styles.input}
    value={searchAd}
    onChange={(e) => setSearchAd(e.target.value)}
  >
    <option value="">広告（すべて）</option>
    {ads.map((ad) => (
      <option key={ad.id} value={ad.id}>
        {ad.title}
      </option>
    ))}
  </select>

  <select
    style={styles.input}
    value={searchStore}
    onChange={(e) => setSearchStore(e.target.value)}
  >
    <option value="">店舗（すべて）</option>
    {stores.map((store) => (
      <option key={store.id} value={store.code}>
        {store.name}
      </option>
    ))}
  </select>

  <select
    style={styles.input}
    value={searchStatus}
    onChange={(e) => setSearchStatus(e.target.value)}
  >
    <option value="">状態（すべて）</option>
    <option value="配信中">配信中</option>
    <option value="停止中">停止中</option>
    <option value="開始前">開始前</option>
    <option value="終了">終了</option>
    <option value="曜日外">曜日外</option>
    <option value="時間外">時間外</option>
  </select>

  <label
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      color: "#cbd5e1",
      fontSize: 14,
    }}
  >
    <input
      type="checkbox"
      checked={onlyActive}
      onChange={(e) => setOnlyActive(e.target.checked)}
    />
    配信中のみ表示
  </label>
</div>

       <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 14,
  }}
>
{filteredRules.map((rule) => {
    const status = getRuleStatus(rule);

    return (
      <div
        key={rule.id}
        style={{
          background: "#0d1526",
          border: "1px solid #1e2d48",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>
            📺 {getAdTitle(rule.ad_id)}
          </div>

          <span
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              whiteSpace: "nowrap",
              background:
                status === "配信中"
                  ? "#064e3b"
                  : status === "停止中"
                  ? "#450a0a"
                  : "#1e293b",
              color:
                status === "配信中"
                  ? "#6ee7b7"
                  : status === "停止中"
                  ? "#fca5a5"
                  : "#cbd5e1",
            }}
          >
            {status}
          </span>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 8, fontSize: 13 }}>
          <div>🏢 {getStoreName(rule.store_code)}</div>
          <div>📅 {formatDays(rule.days_of_week)}</div>
          <div>
            🕒 {rule.start_time || "指定なし"} ～ {rule.end_time || "指定なし"}
          </div>
          <div>
            📆 {rule.start_date || "未設定"} ～ {rule.end_date || "未設定"}
          </div>
          <div>⭐ 優先 {rule.priority}</div>
          <div>{rule.enabled ? "🟢 有効" : "🔴 停止"}</div>
        </div>

        <hr
          style={{
            border: "none",
            borderTop: "1px solid #24304f",
            margin: "14px 0",
          }}
        />

        <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
          <button style={styles.btnPrimary} onClick={() => editRule(rule)}>
            ✏ 編集
          </button>

          <button style={styles.btnDangerSm} onClick={() => deleteRule(rule.id)}>
            🗑 削除
          </button>
        </div>
      </div>
    );
  })}

 {filteredRules.length === 0 && (
  <div style={{ color: "#94a3b8", fontSize: 13 }}>
    条件に合う配信ルールはありません。
  </div>
)}
</div>
      </div>
    </div>
  );
}

export default DeliveryPage;