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

    const { error } = await supabase.from("delivery_rules").insert([
      {
        ad_id: Number(form.ad_id),
        store_code: form.store_code,
        days_of_week: form.days_of_week,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        priority: Number(form.priority) || 1,
        enabled: form.enabled,
      },
    ]);

    if (error) {
      console.error("配信ルール登録エラー:", error);
      showToast("配信ルール登録に失敗しました", "error");
      return;
    }

    showToast("配信ルールを登録しました");

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

        <button style={styles.btnPrimary} onClick={addRule}>
          ＋ 配信ルールを登録
        </button>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <span style={styles.cardTitle}>配信ルール一覧</span>
          <span style={styles.badge}>{rules.length}件</span>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              {["広告", "店舗", "曜日", "時間", "期間", "優先", "状態", "操作"].map(
                (h) => (
                  <th key={h} style={styles.th}>
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} style={styles.tr}>
                <td style={styles.td}>{getAdTitle(rule.ad_id)}</td>
                <td style={styles.td}>{getStoreName(rule.store_code)}</td>
                <td style={styles.td}>{formatDays(rule.days_of_week)}</td>
                <td style={styles.td}>
                  {rule.start_time || "指定なし"} ～ {rule.end_time || "指定なし"}
                </td>
                <td style={styles.td}>
                  {rule.start_date || "未設定"} ～ {rule.end_date || "未設定"}
                </td>
                <td style={styles.td}>⭐ {rule.priority}</td>
                <td style={styles.td}>
                  {rule.enabled ? "有効" : "停止"}
                </td>
                <td style={styles.td}>
                  <button
                    style={styles.btnDangerSm}
                    onClick={() => deleteRule(rule.id)}
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}

            {rules.length === 0 && (
              <tr>
                <td style={styles.td} colSpan="8">
                  配信ルールはまだありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DeliveryPage;