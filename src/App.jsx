import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import AdsPage from "./components/AdsPage";
import ClientsPage from "./components/ClientsPage";
import FormField from "./components/FormField";
import NAV_ITEMS from "./constants/navItems";
import styles from "./styles/appStyles";
import DeliveryPage from "./components/DeliveryPage";
import PlayerPage from "./components/PlayerPage";
import ReportPage from "./components/ReportPage";
import LogsPage from "./components/LogsPage";


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
.select(`
  *,
  clients (
    company_name
  )
`)
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
  client_id: ad.client_id || null,
  clientName: ad.clients?.company_name || "未設定",
  file: ad.file_url || "未設定",
  duration: ad.duration || 15,

  start_date: ad.start_date || "",
  end_date: ad.end_date || "",
  priority: ad.priority || 1,
  placement: ad.placement || "main",

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
const [deliveryRules, setDeliveryRules] = useState([]);

const [clients, setClients] = useState([]);

const [newClient, setNewClient] = useState({
  company_name: "",
  contact_name: "",
  phone: "",
  email: "",
  memo: "",
});

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
  async function loadClients() {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("company_name");

    if (error) {
      console.error("広告主取得エラー:", error);
      return;
    }

    setClients(data);
  }

  loadClients();
}, []);
useEffect(() => {
  async function loadDeliveryRules() {
    const { data, error } = await supabase
      .from("delivery_rules")
      .select("*")
      .order("priority", { ascending: false });

    if (error) {
      console.error("配信ルール取得エラー:", error);
      return;
    }

    setDeliveryRules(data || []);
  }

  loadDeliveryRules();
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

  async function addClient() {
  if (!newClient.company_name) {
    showToast("会社名を入力してください", "error");
    return;
  }

  const { data, error } = await supabase
    .from("clients")
    .insert([newClient])
    .select();

  if (error) {
    console.error("広告主登録エラー:", error);
    showToast("広告主登録に失敗しました", "error");
    return;
  }

  setClients([...clients, data[0]]);

  setNewClient({
    company_name: "",
    contact_name: "",
    phone: "",
    email: "",
    memo: "",
  });

  showToast("広告主を登録しました");
}

async function deleteClient(id) {
  const linkedAds = ads.filter((ad) => ad.client_id === id);

  if (linkedAds.length > 0) {
    showToast(
      `この広告主には広告が${linkedAds.length}件紐付いているため削除できません`,
      "error"
    );
    return;
  }

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("広告主削除エラー:", error);
    showToast("広告主削除に失敗しました", "error");
    return;
  }

  setClients(clients.filter((client) => client.id !== id));
  showToast("広告主を削除しました");
}

async function updateClient(id, onDone) {
  if (!newClient.company_name) {
    showToast("会社名を入力してください", "error");
    return;
  }

  const { data, error } = await supabase
    .from("clients")
    .update(newClient)
    .eq("id", id)
    .select();

  if (error) {
    console.error("広告主更新エラー:", error);
    showToast("広告主更新に失敗しました", "error");
    return;
  }

  setClients(clients.map((client) => (client.id === id ? data[0] : client)));

  setNewClient({
    company_name: "",
    contact_name: "",
    phone: "",
    email: "",
    memo: "",
  });

  showToast("広告主を更新しました");

  if (onDone) onDone();
}

  if (isPlayerMode) {
  return (
  <PlayerPage
    ads={ads}
    stores={stores}
    storeCode={storeCode}
     deliveryRules={deliveryRules}
  />
);
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
  clients={clients}
  deliveryRules={deliveryRules}
  showToast={showToast}
  styles={styles}
  FormField={FormField}

/>
)}
{page === "clients" && (
<ClientsPage
  clients={clients}
  newClient={newClient}
  setNewClient={setNewClient}
  addClient={addClient}
  deleteClient={deleteClient}
  updateClient={updateClient}
  styles={styles}
/>
)}
          {page === "stores" && <StoresPage stores={stores} setStores={setStores} showToast={showToast} />}
          {page === "delivery" && <DeliveryPage
  ads={ads}
  stores={stores}
  deliveries={deliveries}
  setDeliveries={setDeliveries}
  showToast={showToast}
  styles={styles}
/>}
          {page === "logs" && <LogsPage logs={logs} styles={styles} />}
   {page === "reports" && (
 <ReportPage
  logs={logs}
  ads={ads}
  clients={clients}
  stores={stores}
  styles={styles}
  StatCard={StatCard}
/>
)}
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
  stores={stores}
  storeCode={storeCode}
   deliveryRules={deliveryRules}
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
  const mainAds = ads.filter(
  (ad) => (ad.placement || "main") === "main"
);

const bannerAds = ads.filter(
  (ad) => ad.placement === "banner"
);
  const successRate = 100;

  return (
    <div style={styles.grid2}>
      {/* KPI カード */}
      <StatCard
  label="登録広告数"
  value={ads.length}
  unit="本"
  icon="▶"
  color="#38bdf8"
/>

<StatCard
  label="メイン広告"
  value={mainAds.length}
  unit="本"
  icon="🖥"
  color="#6366f1"
/>

<StatCard
  label="バナー広告"
  value={bannerAds.length}
  unit="本"
  icon="📢"
  color="#ec4899"
/>

<StatCard
  label="店舗数"
  value={stores.length}
  unit="店"
  icon="◉"
  color="#a78bfa"
/>

<StatCard
  label="総再生回数"
  value={totalPlays}
  unit="回"
  icon="≡"
  color="#34d399"
/>

<StatCard
  label="本日の再生数"
  value={todayLogs.length}
  unit="回"
  icon="★"
  color="#fb923c"
/>

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


// ─── 共通コンポーネント ────────────────────────────────
function StatusBadge({ status }) {
  return (
    <span style={{ ...styles.statusBadge, ...(status === "成功" ? styles.statusOk : styles.statusErr) }}>
      {status === "成功" ? "● 成功" : "✕ エラー"}
    </span>
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