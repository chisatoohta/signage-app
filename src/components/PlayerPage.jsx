import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { getReceiptData } from "../data/receiptData";

function PlayerPage({ ads = [], stores = [], storeCode, deliveryRules = [] }) {
  // この店舗で有効な配信ルールだけ取得
// 今日の曜日
const today = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][
  new Date().getDay()
];

// 現在時刻（HH:mm）
const now = new Date();
const currentTime = now.toTimeString().slice(0, 5);

// 今日の日付（YYYY-MM-DD）
const todayDate = now.toISOString().split("T")[0];

// この店舗・曜日・時間・期間で有効なルール
const activeRules = deliveryRules.filter((rule) => {
  if (!rule.enabled) return false;

  if (
    storeCode &&
    rule.store_code?.toLowerCase().trim() !==
      storeCode?.toLowerCase().trim()
  ) {
    return false;
  }

  if (
    rule.days_of_week &&
    rule.days_of_week.length > 0 &&
    !rule.days_of_week.includes(today)
  ) {
    return false;
  }

  if (rule.start_time && currentTime < rule.start_time.slice(0, 5)) {
    return false;
  }

  if (rule.end_time && currentTime > rule.end_time.slice(0, 5)) {
    return false;
  }

  if (rule.start_date && todayDate < rule.start_date) {
    return false;
  }

  if (rule.end_date && todayDate > rule.end_date) {
    return false;
  }

  return true;
});

// ルールに紐づく広告を、優先順位付きで取得
const candidateAds = activeRules
  .map((rule) => {
    const ad = ads.find((ad) => String(ad.id) === String(rule.ad_id));
    if (!ad) return null;

    return {
  ...ad,
  ruleId: rule.id,
  rulePriority: Number(rule.priority) || 1,
  ruleStoreCode: rule.store_code,
};
  })
  .filter(Boolean);

// メイン広告候補
const mainCandidates = candidateAds.filter(
  (ad) => (ad.placement || "main") === "main"
);

// バナー広告候補
const bannerCandidates = candidateAds.filter(
  (ad) => ad.placement === "banner"
);

// 一番高い優先順位だけを残す
const maxMainPriority =
  mainCandidates.length > 0
    ? Math.max(...mainCandidates.map((ad) => ad.rulePriority))
    : null;

const maxBannerPriority =
  bannerCandidates.length > 0
    ? Math.max(...bannerCandidates.map((ad) => ad.rulePriority))
    : null;

const mainAds = mainCandidates.filter(
  (ad) => ad.rulePriority === maxMainPriority
);

const bannerAds = bannerCandidates.filter(
  (ad) => ad.rulePriority === maxBannerPriority
);
  const [mainIndex, setMainIndex] = useState(0);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
 
  const currentAd = mainAds[mainIndex];
  const bannerAd1 = bannerAds[bannerIndex];
  const bannerAd2 =
    bannerAds.length > 1
      ? bannerAds[(bannerIndex + 1) % bannerAds.length]
      : null;

  const currentStore = stores.find(
    (store) =>
      store.code?.toLowerCase().trim() === storeCode?.toLowerCase().trim()
  );

  const receiptData = getReceiptData(storeCode || "please");

  useEffect(() => {
  const timer = setInterval(() => {
    setCurrentDateTime(new Date());
  }, 1000);

  return () => clearInterval(timer);
}, []);
  
  useEffect(() => {
    if (!currentAd || mainAds.length === 0) return;

    async function saveLog() {
      
      await supabase.from("logs").insert([
        {
          ad_id: currentAd.id,
          ad_title: currentAd.title,
          duration: currentAd.duration,
          store_code: storeCode || null,
          store_name: currentStore?.name || null,
          placement: currentAd.placement,
        },
      ]);
    }

  
    saveLog();

    const timer = setTimeout(() => {
      setMainIndex((prev) => (prev + 1) % mainAds.length);
    }, (currentAd.duration || 10) * 1000);

    return () => clearTimeout(timer);
  }, [currentAd, mainAds.length, storeCode, currentStore?.name]);

  useEffect(() => {
    if (bannerAds.length === 0) return;
    if (storeCode && !currentStore) return;

    async function saveBannerLogs() {
      const logsToInsert = [bannerAd1, bannerAd2]
        .filter(Boolean)
        .map((ad) => ({
          ad_id: ad.id,
          ad_title: ad.title,
          duration: 8,
          store_code: storeCode || null,
          store_name: currentStore?.name || null,
          placement: ad.placement,
        }));

      if (logsToInsert.length > 0) {
        await supabase.from("logs").insert(logsToInsert);
      }
    }

    saveBannerLogs();

    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 2) % bannerAds.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [
    bannerAds.length,
    bannerIndex,
    bannerAd1,
    bannerAd2,
    storeCode,
    currentStore?.name,
  ]);

  const renderMedia = (ad) => {
    if (!ad) {
      return (
        <div style={{ color: "#94a3b8", fontSize: 24 }}>
          バナー広告なし
        </div>
      );
    }

    const isVideo = ad.file?.match(/\.(mp4|webm|mov)$/i);

    return isVideo ? (
      <video
        src={ad.file}
        autoPlay
        muted
        playsInline
        loop
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    ) : (
      <img
        src={ad.file}
        alt={ad.title}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    );
  };

  if (!currentAd && bannerAds.length === 0) {
    return (
      <div
        style={{
          color: "white",
          background: "black",
          height: "100vh",
          display: "grid",
          placeItems: "center",
        }}
      >
        配信中の広告がありません
      </div>
    );
  }

 return (
  <div
    style={{
      background: "black",
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
      display: "grid",
      gridTemplateColumns: "7fr 3fr",
    }}
  >
    {/* 左側：広告エリア */}
    <div
      style={{
        minWidth: 0,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        borderRight: "2px solid #1e293b",
      }}
    >
      {/* メイン広告 */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {renderMedia(currentAd)}
      </div>

      {/* バナー広告 */}
      <div
        style={{
          height: "22vh",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderTop: "2px solid #111",
        }}
      >
        <div
          style={{
            borderRight: "2px solid #111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 0,
          }}
        >
          {renderMedia(bannerAd1)}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 0,
          }}
        >
          {renderMedia(bannerAd2)}
        </div>
      </div>
    </div>

    {/* 右側：レジ情報エリア */}
    <div
      style={{
        background: "#f8fafc",
        color: "#0f172a",
        height: "100vh",
        padding: "28px 24px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
  style={{
    paddingBottom: 16,
    borderBottom: "2px solid #cbd5e1",
  }}
>
  <div
    style={{
      fontSize: 14,
      color: "#64748b",
      marginBottom: 4,
    }}
  >
    📍店舗
  </div>

  <div
    style={{
      fontSize: 26,
      fontWeight: 800,
      color: "#0f172a",
    }}
  >
    {currentStore?.name || "デモ店舗"}
  </div>

  <div
  style={{
    marginTop: 8,
    fontSize: 15,
    color: "#64748b",
  }}
>
  {currentDateTime.toLocaleString("ja-JP")}
</div>

  <div
    style={{
      marginTop: 12,
      fontSize: 18,
      fontWeight: 700,
      color: "#334155",
    }}
  >
    お預かり内容
  </div>
</div>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 14, color: "#64748b" }}>受付番号</div>
        <div style={{ fontSize: 38, fontWeight: 900 }}>
          {receiptData.receiptNumber}
        </div>
      </div>

      <div
        style={{
          marginTop: 24,
          display: "grid",
          gap: 14,
        }}
      >
        {receiptData.items.map((item) => (
  <div
    key={item.name}
    style={{
      paddingBottom: 10,
      borderBottom: "1px solid #e2e8f0",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 20,
      }}
    >
      <span>{item.name}</span>
      <strong>{item.count}点</strong>
    </div>

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginTop: 5,
        fontSize: 14,
        color: "#64748b",
      }}
    >
      <span>単価 ¥{item.unitPrice.toLocaleString()}</span>
      <span>
        小計 ¥{(item.count * item.unitPrice).toLocaleString()}
      </span>
    </div>
  </div>
))}
      </div>

      <div
        style={{
          marginTop: "auto",
          borderTop: "2px solid #cbd5e1",
          paddingTop: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <span style={{ fontSize: 16, color: "#64748b" }}>合計点数</span>
          <strong style={{ fontSize: 26 }}>
            {receiptData.itemCount}点
          </strong>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginTop: 12,
          }}
        >
          <span style={{ fontSize: 16, color: "#64748b" }}>合計金額</span>
          <strong style={{ fontSize: 36 }}>
            ¥{receiptData.totalAmount.toLocaleString()}
          </strong>
        </div>

        <div
          style={{
            marginTop: 22,
            padding: "16px",
            background: "#e2e8f0",
            borderRadius: 12,
          }}
        >
          <div style={{ fontSize: 14, color: "#64748b" }}>
            仕上がり予定
          </div>
          <div style={{ fontSize: 25, fontWeight: 800, marginTop: 4 }}>
            {receiptData.pickupDate}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}

export default PlayerPage;