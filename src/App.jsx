import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import AdsPage from "./components/AdsPage";

// ─── 初期データ ───────────────────────────────────────────
const initialAds = [
  { id: 1, title: "夏季キャンペーン2026", file: "summer_campaign.mp4", duration: 30, createdAt: "2026-05-10", thumbnail: "🌊" },
  { id: 2, title: "新商品ローンチ", file: "new_product.mp4", duration: 15, createdAt: "2026-05-20", thumbnail: "✨" },
  { id: 3, title: "週末特別セール", file: "weekend_sale.mp4", duration: 20, createdAt: "2026-06-01", thumbnail: "🏷️" },
];

const initialStores = [
  { id: 1, name: "渋谷本店", address: "東京都渋谷区渋谷1-1-1", screen: 3 },
  { id: 2, name: "新宿東口店", address: "東京都新宿区新宿3-2-1", screen: 2 },
  { id: 3, name: "池袋西口店", address: "東京都豊島区西池袋1-5-2", screen: 4 },
  { id: 4, name: "横浜みなとみらい店", address: "神奈川県横浜市西区みなとみらい2-1", screen: 2 },
];

const initialDeliveries = [
  { adId: 1, storeIds: [1, 2, 3] },
  { adId: 2, storeIds: [1, 4] },
  { adId: 3, storeIds: [2, 3, 4] },
];

const generateLogs = () => {
  const logs = [];
  const adTitles = { 1: "夏季キャンペーン2026", 2: "新商品ローンチ", 3: "週末特別セール" };
  const storeNames = { 1: "渋谷本店", 2: "新宿東口店", 3: "池袋西口店", 4: "横浜みなとみらい店" };
  const adStorePairs = [
    [1, 1], [1, 2], [1, 3],
    [2, 1], [2, 4],
    [3, 2], [3, 3], [3, 4],
  ];
  let id = 1;
  for (let d = 0; d < 7; d++) {
    const date = new Date("2026-06-08");
    date.setDate(date.getDate() - d);
    for (let h = 9; h <= 21; h += 2) {
      const [adId, storeId] = adStorePairs[Math.floor(Math.random() * adStorePairs.length)];
      logs.push({
        id: id++,
        adId,
        storeId,
        adTitle: adTitles[adId],
        storeName: storeNames[storeId],
        playedAt: `${date.toISOString().slice(0, 10)} ${String(h).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
        status: Math.random() > 0.05 ? "成功" : "エラー",
      });
    }
  }
  return logs.sort((a, b) => b.playedAt.localeCompare(a.playedAt));
};

const initialLogs = generateLogs();

// ─── ユーティリティ ────────────────────────────────────────
const newId = (arr) => Math.max(0, ...arr.map((x) => x.id)) + 1;

// ─── コンポーネント ────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", label: "ダッシュボード", icon: "◈" },
  { id: "ads", label: "広告管理", icon: "▶" },
  { id: "stores", label: "店舗管理", icon: "◉" },
  { id: "delivery", label: "配信設定", icon: "⬡" },
  { id: "logs", label: "再生ログ", icon: "≡" },
  { id: "player", label: "プレイヤー", icon: "▣" },
];
export default function App() {
  const isPlayerMode = window.location.pathname === "/player";
  const storeCode = new URLSearchParams(window.location.search).get("store");
  
  const [page, setPage] = useState(() => {
  return localStorage.getItem("currentPage") || "dashboard";
});
  const [ads, setAds] = useState(initialAds);
  useEffect(() => {
  async function loadAds() {
    let data = null;
let error = null;

if (isPlayerMode && storeCode) {
  const result = await supabase
    .from("ad_stores")
    .select(`
      ads (
        id,
        title,
        file_url,
        duration,
        created_at
      )
    `)
    .eq("store_code", storeCode);

  error = result.error;
  data = result.data?.map((item) => item.ads).filter(Boolean);
} else {
  const result = await supabase
    .from("ads")
    .select("*")
    .order("id", { ascending: true });

  error = result.error;
  data = result.data;
}
      console.log("Supabase ads data:", data);
console.log("Supabase ads error:", error);

    if (error) {
      console.error("広告取得エラー:", error);
      return;
    }

    const formattedAds = data.map((ad) => ({
      id: ad.id,
      title: ad.title,
      file: ad.file_url || "未設定",
      duration: ad.duration || 15,
      createdAt: ad.created_at
        ? ad.created_at.slice(0, 10)
        : "未設定",
      thumbnail: "📺",
    }));

    setAds(formattedAds);
  }

  loadAds();
}, []);
  const [stores, setStores] = useState(initialStores);
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [logs, setLogs] = useState([]);
  const [toast, setToast] = useState(null);
  useEffect(() => {
  async function loadStores() {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .order("id", { ascending: true });
      console.log("Supabase stores data:", data);
console.log("Supabase stores error:", error);

    if (error) {
      console.error("店舗取得エラー:", error);
      return;
    }

    setStores(data);
  }

  loadStores();
}, []);
useEffect(() => {
  async function loadLogs() {
    const { data, error } = await supabase
      .from("logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    console.log("Supabase logs data:", data);
    console.log("Supabase logs error:", error);

    if (error) {
      console.error("ログ取得エラー:", error);
      return;
    }

    setLogs(data);
  }

  loadLogs();
}, []);
useEffect(() => {
  localStorage.setItem("currentPage", page);
}, [page]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  if (isPlayerMode) {
  return <PlayerPage ads={ads} storeCode={storeCode} />;
}

  return (
    <div style={styles.root}>
      {/* サイドバー */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>⬡</span>
          <div>
            <div style={styles.logoTitle}>SIGNAGE</div>
            <div style={styles.logoSub}>AD MANAGER</div>
          </div>
        </div>
        <nav style={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                ...styles.navItem,
                ...(page === item.id ? styles.navItemActive : {}),
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
              {page === item.id && <span style={styles.navDot} />}
            </button>
          ))}
        </nav>
        <div style={styles.sidebarFooter}>
          <div style={styles.footerStatus}>
            <span style={styles.statusDot} />
            <span style={{ fontSize: 11, color: "#6ee7b7" }}>システム稼働中</span>
          </div>
        </div>
      </aside>

      {/* メイン */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.pageTitle}>{NAV_ITEMS.find((n) => n.id === page)?.label}</h1>
            <span style={styles.pagePath}>サイネージ広告管理 / {NAV_ITEMS.find((n) => n.id === page)?.label}</span>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.dateBadge}>2026.06.08</div>
          </div>
        </header>
        <div style={styles.content}>
          {page === "dashboard" && <Dashboard ads={ads} stores={stores} logs={logs} deliveries={deliveries} />}
          {page === "ads" && (
  <AdsPage
    ads={ads}
    setAds={setAds}
    stores={stores}
    showToast={showToast}
    styles={styles}
    FormField={FormField}
  />
)}
          {page === "stores" && <StoresPage stores={stores} setStores={setStores} showToast={showToast} />}
          {page === "delivery" && <DeliveryPage ads={ads} stores={stores} deliveries={deliveries} setDeliveries={setDeliveries} showToast={showToast} />}
          {page === "logs" && <LogsPage logs={logs} />}
         {page === "player" && (
  <PlayerPage
    ads={ads
      .filter((ad) => {
        const today = new Date().toISOString().split("T")[0];

        const afterStart =
          !ad.start_date || ad.start_date <= today;

        const beforeEnd =
          !ad.end_date || ad.end_date >= today;

        return afterStart && beforeEnd;
      })
      .sort((a, b) => {
        return (Number(b.priority) || 1) - (Number(a.priority) || 1);
      })}
  />
)}
        </div>
      </main>

      {toast && (
        <div style={{ ...styles.toast, ...(toast.type === "error" ? styles.toastError : {}) }}>
          <span>{toast.type === "success" ? "✓" : "✕"}</span> {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── ダッシュボード ──────────────────────────────────────
function Dashboard({ ads, stores, logs, deliveries }) {
  const today = new Date().toISOString().slice(0, 10);

  const todayLogs = logs.filter((log) =>
    log.created_at?.startsWith(today)
  );

  const totalPlays = logs.length;
  const successRate = 100;

  return (
    <div style={styles.grid2}>
      {/* KPI カード */}
      <StatCard label="登録広告数" value={ads.length} unit="本" icon="▶" color="#38bdf8" />
      <StatCard label="店舗数" value={stores.length} unit="店" icon="◉" color="#a78bfa" />
      <StatCard label="総再生回数" value={totalPlays} unit="回" icon="≡" color="#34d399" />
      <StatCard label="本日の再生数" value={todayLogs.length} unit="回" icon="★" color="#fb923c" />

      {/* 最近のログ */}
      <div style={{ ...styles.card, gridColumn: "1 / -1" }}>
        <div style={styles.cardHeader}>
          <span style={styles.cardTitle}>最近の再生ログ</span>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              {["日時", "広告名", "店舗", "再生秒数"].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {logs.slice(0, 8).map((log) => (
              <tr key={log.id} style={styles.tr}>
                <td style={styles.td}>
                  <span style={styles.mono}>
                    {log.created_at
                      ? new Date(log.created_at).toLocaleString("ja-JP")
                      : "-"}
                  </span>
                </td>
                <td style={styles.td}>{log.ad_title || "-"}</td>
                <td style={styles.td}>{log.store_name || log.store_code || "-"}</td>
                <td style={styles.td}>{log.duration ? `${log.duration}秒` : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function StatCard({ label, value, unit, icon, color }) {
  return (
    <div style={{ ...styles.card, ...styles.statCard }}>
      <div style={{ ...styles.statIcon, background: color + "22", color }}>{icon}</div>
      <div style={styles.statBody}>
        <div style={styles.statLabel}>{label}</div>
        <div style={styles.statValue}>
          <span style={{ ...styles.statNum, color }}>{value}</span>
          <span style={styles.statUnit}>{unit}</span>
        </div>
      </div>
    </div>
  );
}

// ─── 店舗管理 ────────────────────────────────────────────
function StoresPage({ stores, setStores, showToast }) {
  const [showForm, setShowForm] = useState(false);
const [editingStore, setEditingStore] = useState(null);
const [form, setForm] = useState({
  name: "",
  address: "",
  screen_count: "",
  code: "",
  player_url: "",
});

const resetForm = () => {
  setForm({
    name: "",
    address: "",
    screen_count: "",
    code: "",
    player_url: "",
  });
  setEditingStore(null);
  setShowForm(false);
};

const handleAdd = async () => {
  if (!form.name) return showToast("店舗名を入力してください", "error");
  if (!form.code) return showToast("店舗コードを入力してください", "error");

  const { data, error } = await supabase
    .from("stores")
    .insert([
      {
        name: form.name,
        address: form.address,
        screen_count: Number(form.screen_count) || 1,
        code: form.code,
        player_url: form.player_url,
      },
    ])
    .select();

  if (error) {
    console.error("店舗登録エラー:", error);
    return showToast("店舗登録に失敗しました", "error");
  }

  setStores([...stores, data[0]]);
  resetForm();
  showToast("店舗を登録しました");
};

const handleEdit = (store) => {
  setEditingStore(store);
  setForm({
    name: store.name || "",
    address: store.address || "",
    screen_count: store.screen_count || "",
    code: store.code || "",
    player_url: store.player_url || "",
  });
  setShowForm(true);
};

const handleUpdate = async () => {
  if (!editingStore) return;
  if (!form.name) return showToast("店舗名を入力してください", "error");
  if (!form.code) return showToast("店舗コードを入力してください", "error");

  const { data, error } = await supabase
    .from("stores")
    .update({
      name: form.name,
      address: form.address,
      screen_count: Number(form.screen_count) || 1,
      code: form.code,
      player_url: form.player_url,
    })
    .eq("id", editingStore.id)
    .select();

  if (error) {
    console.error("店舗更新エラー:", error);
    return showToast("店舗更新に失敗しました", "error");
  }

  setStores(stores.map((s) => (s.id === editingStore.id ? data[0] : s)));
  resetForm();
  showToast("店舗を更新しました");
};

const handleDelete = async (id) => {
  const { error } = await supabase
    .from("stores")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("店舗削除エラー:", error);
    return showToast("店舗の削除に失敗しました", "error");
  }

  setStores(stores.filter((s) => s.id !== id));
  showToast("店舗を削除しました");
};

  return (
    <div>
      <div style={styles.pageActions}>
        <button style={styles.btnPrimary} onClick={() => setShowForm(!showForm)}>
          {showForm ? "✕ キャンセル" : "+ 店舗を登録"}
        </button>
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <div style={styles.cardTitle}>
  {editingStore ? "店舗編集" : "新規店舗登録"}
</div>
          <div style={styles.formGrid}>
  <FormField
    label="店舗名 *"
    value={form.name}
    onChange={(v) => setForm({ ...form, name: v })}
    placeholder="例: プリーズ"
  />

  <FormField
    label="住所"
    value={form.address}
    onChange={(v) => setForm({ ...form, address: v })}
    placeholder="例: 東京都..."
  />

  <FormField
    label="スクリーン数"
    value={form.screen_count}
    onChange={(v) => setForm({ ...form, screen_count: v })}
    placeholder="例: 2"
    type="number"
  />

  <FormField
    label="店舗コード *"
    value={form.code}
    onChange={(v) => setForm({ ...form, code: v })}
    placeholder="例: please"
  />

  <FormField
    label="プレイヤーURL"
    value={form.player_url}
    onChange={(v) => setForm({ ...form, player_url: v })}
    placeholder="例: https://signage-app-flax.vercel.app/player?store=please"
  />
</div>
          <button style={styles.btnPrimary} onClick={editingStore ? handleUpdate : handleAdd}>
  {editingStore ? "更新する" : "登録する"}
</button>
        </div>
      )}

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              {["店舗名", "住所", "スクリーン数", "操作"].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stores.map((s) => (
              <tr key={s.id} style={styles.tr}>
                <td style={styles.td}><span style={styles.storeName}>◉ {s.name}</span></td>
                <td style={styles.td}><span style={{ color: "#94a3b8", fontSize: 13 }}>{s.address}</span></td>
                <td style={styles.td}><span style={styles.badge}>🖥 {s.screen_count}面</span></td>
                <td style={styles.td}>
              <button style={styles.btnPrimary} onClick={() => handleEdit(s)}>
  編集
</button>
<button style={styles.btnDangerSm} onClick={() => handleDelete(s.id)}>
  削除
</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 配信設定 ────────────────────────────────────────────
function DeliveryPage({ ads, stores, deliveries, setDeliveries, showToast }) {
  const [selectedAd, setSelectedAd] = useState(ads[0]?.id || null);

  const delivery = deliveries.find((d) => d.adId === selectedAd);
  const storeIds = delivery?.storeIds || [];

  const toggleStore = (storeId) => {
    const exists = storeIds.includes(storeId);
    const newIds = exists ? storeIds.filter((id) => id !== storeId) : [...storeIds, storeId];
    setDeliveries(
      deliveries.some((d) => d.adId === selectedAd)
        ? deliveries.map((d) => (d.adId === selectedAd ? { ...d, storeIds: newIds } : d))
        : [...deliveries, { adId: selectedAd, storeIds: newIds }]
    );
    showToast(exists ? "配信店舗を解除しました" : "配信店舗を追加しました");
  };

  return (
    <div style={styles.deliveryLayout}>
      {/* 広告選択 */}
      <div style={{ ...styles.card, flex: "0 0 280px" }}>
        <div style={styles.cardHeader}><span style={styles.cardTitle}>広告を選択</span></div>
        <div>
          {ads.map((ad) => (
            <button
              key={ad.id}
              onClick={() => setSelectedAd(ad.id)}
              style={{
                ...styles.adSelectItem,
                ...(selectedAd === ad.id ? styles.adSelectItemActive : {}),
              }}
            >
              <span style={styles.adSelectThumb}>{ad.thumbnail}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{ad.title}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{ad.duration}秒</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 配信店舗設定 */}
      <div style={{ ...styles.card, flex: 1 }}>
        <div style={styles.cardHeader}>
          <span style={styles.cardTitle}>
            配信店舗設定
            {selectedAd && (
              <span style={{ marginLeft: 10, fontSize: 12, color: "#38bdf8" }}>
                — {ads.find((a) => a.id === selectedAd)?.title}
              </span>
            )}
          </span>
          <span style={styles.badge}>{storeIds.length} 店舗選択中</span>
        </div>
        <div style={styles.storeGrid}>
          {stores.map((store) => {
            const active = storeIds.includes(store.id);
            return (
              <button
                key={store.id}
                onClick={() => selectedAd && toggleStore(store.id)}
                style={{
                  ...styles.storeToggle,
                  ...(active ? styles.storeToggleActive : {}),
                  ...(!selectedAd ? { opacity: 0.4, cursor: "not-allowed" } : {}),
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 8 }}>◉</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{store.name}</div>
                <div style={{ fontSize: 11, color: active ? "#a7f3d0" : "#64748b", marginTop: 4 }}>{store.screen}スクリーン</div>
                {active && <div style={styles.activeCheck}>✓</div>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── 再生ログ ────────────────────────────────────────────
function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);

    const { data, error } = await supabase
      .from("logs")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("Supabase logs data:", data);
    console.log("Supabase logs error:", error);

    if (!error) {
      setLogs(data || []);
    }

    setLoading(false);
  }

  return (
    <div>
      <h2>再生ログ</h2>

      {loading ? (
        <p>読み込み中...</p>
      ) : logs.length === 0 ? (
        <p>再生ログはまだありません。</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th>再生日時</th>
              <th>広告名</th>
              <th>店舗コード</th>
              <th>店舗名</th>
              <th>再生秒数</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.created_at ? new Date(log.created_at).toLocaleString("ja-JP") : "-"}</td>
                <td>{log.ad_title || "-"}</td>
                <td>{log.store_code || "-"}</td>
                <td>{log.store_name || "-"}</td>
                <td>{log.duration ? `${log.duration}秒` : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── 共通コンポーネント ────────────────────────────────
function StatusBadge({ status }) {
  return (
    <span style={{ ...styles.statusBadge, ...(status === "成功" ? styles.statusOk : styles.statusErr) }}>
      {status === "成功" ? "● 成功" : "✕ エラー"}
    </span>
  );
}

function FormField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={styles.formField}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={styles.input}
      />
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, color: "#64748b" }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={styles.select}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─── スタイル ────────────────────────────────────────────
const styles = {
  root: {
    display: "flex",
    height: "100vh",
    background: "#0a0f1e",
    color: "#e2e8f0",
    fontFamily: "'DM Sans', 'Noto Sans JP', sans-serif",
    overflow: "hidden",
  },
  sidebar: {
    width: 220,
    background: "#0d1526",
    borderRight: "1px solid #1e2d48",
    display: "flex",
    flexDirection: "column",
    padding: "24px 0",
    flexShrink: 0,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 20px 28px",
    borderBottom: "1px solid #1e2d48",
    marginBottom: 16,
  },
  logoIcon: { fontSize: 28, color: "#38bdf8" },
  logoTitle: { fontSize: 15, fontWeight: 800, letterSpacing: 3, color: "#f1f5f9" },
  logoSub: { fontSize: 9, color: "#38bdf8", letterSpacing: 2 },
  nav: { display: "flex", flexDirection: "column", gap: 2, padding: "0 12px" },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 8,
    background: "none",
    border: "none",
    color: "#64748b",
    fontSize: 13,
    cursor: "pointer",
    textAlign: "left",
    position: "relative",
    transition: "all 0.15s",
  },
  navItemActive: {
    background: "#172040",
    color: "#38bdf8",
    fontWeight: 600,
  },
  navIcon: { fontSize: 15, width: 20, textAlign: "center" },
  navDot: {
    position: "absolute",
    right: 10,
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#38bdf8",
  },
  sidebarFooter: { marginTop: "auto", padding: "20px 20px 0" },
  footerStatus: { display: "flex", alignItems: "center", gap: 8 },
  statusDot: {
    width: 8, height: 8, borderRadius: "50%",
    background: "#34d399",
    boxShadow: "0 0 8px #34d399",
  },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 32px",
    borderBottom: "1px solid #1e2d48",
    background: "#0d1526",
    flexShrink: 0,
  },
  headerLeft: {},
  headerRight: {},
  pageTitle: { margin: 0, fontSize: 20, fontWeight: 700, color: "#f1f5f9" },
  pagePath: { fontSize: 11, color: "#475569", marginTop: 2, display: "block" },
  dateBadge: {
    fontSize: 12,
    color: "#38bdf8",
    background: "#172040",
    border: "1px solid #1e3a5f",
    padding: "5px 12px",
    borderRadius: 6,
    fontWeight: 600,
    letterSpacing: 1,
  },
  content: { flex: 1, overflow: "auto", padding: 28 },

  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
  },
  card: {
    background: "#111827",
    border: "1px solid #1e2d48",
    borderRadius: 12,
    padding: 20,
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardTitle: { fontSize: 14, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.5 },
  statCard: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    flexShrink: 0,
  },
  statBody: {},
  statLabel: { fontSize: 11, color: "#64748b", marginBottom: 4 },
  statValue: { display: "flex", alignItems: "baseline", gap: 4 },
  statNum: { fontSize: 28, fontWeight: 800 },
  statUnit: { fontSize: 13, color: "#64748b" },

  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    fontSize: 11,
    color: "#475569",
    fontWeight: 600,
    padding: "8px 12px",
    borderBottom: "1px solid #1e2d48",
    letterSpacing: 0.5,
  },
  tr: { borderBottom: "1px solid #0f172a", transition: "background 0.1s" },
  td: { padding: "10px 12px", fontSize: 13 },
  mono: { fontFamily: "monospace", fontSize: 12, color: "#64748b" },

  statusBadge: {
    fontSize: 11,
    padding: "3px 8px",
    borderRadius: 4,
    fontWeight: 600,
  },
  statusOk: { background: "#064e3b", color: "#6ee7b7" },
  statusErr: { background: "#450a0a", color: "#fca5a5" },

  pageActions: { display: "flex", justifyContent: "flex-end", marginBottom: 16 },
  btnPrimary: {
    background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
    color: "#fff",
    border: "none",
    padding: "9px 18px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnDanger: {
    background: "#450a0a",
    color: "#fca5a5",
    border: "1px solid #7f1d1d",
    padding: "6px 12px",
    borderRadius: 6,
    fontSize: 12,
    cursor: "pointer",
    flexShrink: 0,
  },
  btnDangerSm: {
    background: "#450a0a",
    color: "#fca5a5",
    border: "1px solid #7f1d1d",
    padding: "4px 10px",
    borderRadius: 5,
    fontSize: 11,
    cursor: "pointer",
  },

  formCard: {
    background: "#111827",
    border: "1px solid #1e3a5f",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, margin: "16px 0" },
  formField: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 11, color: "#64748b", fontWeight: 600 },
  input: {
    background: "#0d1526",
    border: "1px solid #1e2d48",
    borderRadius: 6,
    padding: "8px 12px",
    color: "#e2e8f0",
    fontSize: 13,
    outline: "none",
  },

  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 },
  adCard: {
    background: "#111827",
    border: "1px solid #1e2d48",
    borderRadius: 12,
    padding: 16,
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  adThumb: {
    width: 52,
    height: 52,
    background: "#172040",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    flexShrink: 0,
  },
  adInfo: { flex: 1, minWidth: 0 },
  adTitle: { fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 },
  adMeta: { fontSize: 11, color: "#64748b", marginBottom: 4 },
  badge: {
    background: "#172040",
    border: "1px solid #1e3a5f",
    color: "#94a3b8",
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 4,
  },

  storeName: { fontWeight: 600, color: "#e2e8f0" },

  deliveryLayout: { display: "flex", gap: 16, alignItems: "flex-start" },
  adSelectItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: "10px 12px",
    background: "none",
    border: "1px solid transparent",
    borderRadius: 8,
    cursor: "pointer",
    textAlign: "left",
    marginBottom: 4,
  },
  adSelectItemActive: {
    background: "#172040",
    border: "1px solid #1e3a5f",
  },
  adSelectThumb: { fontSize: 20 },
  storeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 },
  storeToggle: {
    background: "#0d1526",
    border: "1px solid #1e2d48",
    borderRadius: 10,
    padding: "16px 12px",
    cursor: "pointer",
    color: "#94a3b8",
    textAlign: "center",
    position: "relative",
    transition: "all 0.15s",
  },
  storeToggleActive: {
    background: "#0c2a1f",
    border: "1px solid #065f46",
    color: "#6ee7b7",
  },
  activeCheck: {
    position: "absolute",
    top: 8,
    right: 10,
    width: 18,
    height: 18,
    background: "#34d399",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    color: "#022c22",
    fontWeight: 800,
  },

  filterBar: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 14,
    background: "#111827",
    border: "1px solid #1e2d48",
    borderRadius: 10,
    padding: "10px 16px",
  },
  select: {
    background: "#0d1526",
    border: "1px solid #1e2d48",
    borderRadius: 6,
    padding: "5px 10px",
    color: "#e2e8f0",
    fontSize: 12,
    outline: "none",
    cursor: "pointer",
  },

  toast: {
    position: "fixed",
    bottom: 28,
    right: 28,
    background: "#064e3b",
    border: "1px solid #065f46",
    color: "#6ee7b7",
    padding: "12px 20px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    gap: 8,
    boxShadow: "0 8px 24px #0005",
  },
  toastError: {
    background: "#450a0a",
    border: "1px solid #7f1d1d",
    color: "#fca5a5",
  },
  playerScreen: {
  width: "100%",
  height: "calc(100vh - 120px)",
  background: "#000",
  borderRadius: 12,
  overflow: "hidden",
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
},

playerMedia: {
  width: "100%",
  height: "100%",
  objectFit: "contain",
  background: "#000",
},

playerInfo: {
  position: "absolute",
  bottom: 20,
  left: 20,
  background: "rgba(0,0,0,0.6)",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 8,
  fontSize: 14,
},

playerEmpty: {
  background: "#111827",
  border: "1px solid #1e2d48",
  borderRadius: 12,
  padding: 40,
  textAlign: "center",
  color: "#94a3b8",
},
};