import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { getReceiptData } from "../data/receiptData";
import InfoPanel from "./InfoPanel";

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
  const [showThankYou, setShowThankYou] = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);

 
  const currentAd = mainAds[mainIndex];
 const checkoutAd =
  ads.find((ad) => ad.title?.trim() === "会計中広告") ||
  mainAds[0];
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
  let thankYouTimer;

  const handleKeyDown = (event) => {
    if (event.key.toLowerCase() !== "t") return;

    setShowThankYou(true);

    clearTimeout(thankYouTimer);

    thankYouTimer = setTimeout(() => {
      setShowThankYou(false);
    }, 4000);
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
    clearTimeout(thankYouTimer);
  };
}, []);

useEffect(() => {
  const handleCheckoutKey = (event) => {
    if (event.key.toLowerCase() !== "c") return;

    setIsCheckout((prev) => {
      // 会計中 → 会計終了
      if (prev) {
        setShowThankYou(true);

        setTimeout(() => {
          setShowThankYou(false);
        }, 4000);
      }

      return !prev;
    });
  };

  window.addEventListener("keydown", handleCheckoutKey);

  return () => {
    window.removeEventListener("keydown", handleCheckoutKey);
  };
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
  <>
    <style>
  {`
    @keyframes playerMediaFade {
      from {
        opacity: 0;
        transform: scale(0.995);
      }

      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes thankYouFade {
      from {
        opacity: 0;
        transform: scale(1.02);
      }

      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `}
</style>

<div
  style={{
    position: "relative",
    background: "#0b1120",
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
    background: "#0b1120",
    borderRight: "1px solid #334155",
  }}
>
  {/* メイン広告 */}
  <div
    style={{
      flex: 1,
      minHeight: 0,
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      background:
        "linear-gradient(135deg, #020617 0%, #0f172a 100%)",
    }}
  >
    <div
  key={
    isCheckout
      ? `checkout-${checkoutAd?.id ?? "empty"}`
      : `main-${currentAd?.id ?? "empty"}`
  }
  style={{
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animation: "playerMediaFade 0.55s ease",
  }}
>
  {renderMedia(isCheckout ? checkoutAd : currentAd)}
</div>
    {/* 左上の小さな表示 */}
    <div
      style={{
        position: "absolute",
        top: 14,
        left: 16,
        padding: "6px 10px",
        borderRadius: 999,
        background: "rgba(15, 23, 42, 0.72)",
        color: "#e2e8f0",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1,
        backdropFilter: "blur(6px)",
        pointerEvents: "none",
      }}
    >
      INFORMATION
    </div>

    {isCheckout && (
  <div
    style={{
      position: "absolute",
      top: 14,
      right: 16,
      padding: "7px 12px",
      borderRadius: 999,
      background: "rgba(37, 99, 235, 0.9)",
      color: "#ffffff",
      fontSize: 12,
      fontWeight: 800,
      letterSpacing: 1,
      zIndex: 10,
    }}
  >
    会計中
  </div>
)}
  </div>

  {/* バナー広告 */}
  <div
    style={{
      height: "22vh",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      borderTop: "1px solid #334155",
      background: "#020617",
      flexShrink: 0,
    }}
  >
    {/* バナー① */}
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 0,
        overflow: "hidden",
        borderRight: "1px solid #334155",
        background: "#020617",
      }}
    >
      <div
        key={`banner-1-${bannerAd1?.id ?? "empty"}`}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "playerMediaFade 0.45s ease",
        }}
      >
        {renderMedia(bannerAd1)}
      </div>
    </div>

    {/* バナー② */}
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 0,
        overflow: "hidden",
        background: "#020617",
      }}
    >
      <div
        key={`banner-2-${bannerAd2?.id ?? "empty"}`}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "playerMediaFade 0.45s ease",
        }}
      >
        {renderMedia(bannerAd2)}
      </div>
    </div>
  </div>
</div>
    {/* 右側：レジ情報エリア */}
<div
  style={{
    position: "relative",
    background: "#f1f5f9",
    color: "#0f172a",
    height: "100vh",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  }}
>
  {/* 店舗名・時計 */}
  <div
    style={{
      padding: "22px 24px 18px",
      background: "#ffffff",
      borderBottom: "1px solid #cbd5e1",
      flexShrink: 0,
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 13,
            color: "#64748b",
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          STORE
        </div>

        <div
          style={{
            marginTop: 4,
            fontSize: 25,
            fontWeight: 900,
            lineHeight: 1.25,
          }}
        >
          {currentStore?.name || "デモ店舗"}
        </div>
      </div>

      <div
        style={{
          textAlign: "right",
          color: "#475569",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          {currentDateTime.toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>

        <div
          style={{
            marginTop: 6,
            fontSize: 12,
          }}
        >
          {currentDateTime.toLocaleDateString("ja-JP", {
            month: "numeric",
            day: "numeric",
            weekday: "short",
          })}
        </div>
      </div>
    </div>
  </div>

  {/* レジ情報本体 */}
  <div
    style={{
      padding: "18px 20px 0",
      display: "flex",
      flexDirection: "column",
      flex: 1,
      minHeight: 0,
      overflow: "hidden",
    }}
  >
    {/* 受付番号 */}
    <div
      style={{
        padding: "14px 18px",
        background: "#0f172a",
        color: "#ffffff",
        borderRadius: 14,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 13,
            color: "#cbd5e1",
            fontWeight: 700,
          }}
        >
          受付番号
        </div>

        <div
          style={{
            marginTop: 2,
            fontSize: 12,
            color: "#94a3b8",
          }}
        >
          お預かり内容
        </div>
      </div>

      <div
        style={{
          fontSize: 38,
          fontWeight: 900,
          letterSpacing: 2,
          lineHeight: 1,
        }}
      >
        {receiptData.receiptNumber}
      </div>
    </div>

    {/* 品目一覧 */}
    <div
      style={{
        marginTop: 14,
        display: "grid",
        gap: 8,
        overflowY: "auto",
        minHeight: 0,
      }}
    >
      {receiptData.items.map((item) => {
        const subtotal = item.count * item.unitPrice;

        return (
          <div
            key={item.name}
            style={{
              padding: "11px 14px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.name}
              </span>

              <strong
                style={{
                  fontSize: 19,
                  flexShrink: 0,
                }}
              >
                {item.count}点
              </strong>
            </div>

            <div
              style={{
                marginTop: 5,
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "#64748b",
              }}
            >
              <span>単価 ¥{item.unitPrice.toLocaleString()}</span>

              <span style={{ fontWeight: 700 }}>
                小計 ¥{subtotal.toLocaleString()}
              </span>
            </div>
          </div>
        );
      })}
    </div>

    {/* 合計・仕上がり予定 */}
    <div
      style={{
        marginTop: "auto",
        paddingTop: 12,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: "13px 16px",
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <span
            style={{
              fontSize: 14,
              color: "#64748b",
              fontWeight: 700,
            }}
          >
            合計点数
          </span>

          <strong style={{ fontSize: 22 }}>
            {receiptData.itemCount}点
          </strong>
        </div>

        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <span
            style={{
              fontSize: 15,
              color: "#475569",
              fontWeight: 800,
            }}
          >
            合計金額
          </span>

          <strong
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: "#0f172a",
            }}
          >
            ¥{receiptData.totalAmount.toLocaleString()}
          </strong>
        </div>
      </div>

      <div
        style={{
          marginTop: 10,
          padding: "10px 14px",
          background: "#dbeafe",
          borderRadius: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: "#475569",
            fontWeight: 700,
          }}
        >
          仕上がり予定
        </span>

        <strong
          style={{
            fontSize: 20,
            color: "#1e3a8a",
          }}
        >
          {receiptData.pickupDate}
        </strong>
      </div>
    </div>
  </div>

  {/* 天気・洗濯予報・店舗のお知らせ */}
  <div
    style={{
      height: 180,
      marginTop: 14,
      borderTop: "1px solid #cbd5e1",
      background: "#ffffff",
      flexShrink: 0,
      overflow: "hidden",
    }}
  >
    <InfoPanel storeCode={storeCode || "please"} />
  </div>
  {showThankYou && (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 180,
      zIndex: 100,
      background:
        "linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(30, 41, 59, 0.94))",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      boxSizing: "border-box",
      animation: "thankYouFade 0.45s ease",
    }}
  >
    <div
      style={{
        width: "100%",
        maxWidth: 420,
        padding: "34px 24px",
        boxSizing: "border-box",
        textAlign: "center",
        background: "rgba(255, 255, 255, 0.1)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        borderRadius: 22,
        boxShadow: "0 18px 50px rgba(0, 0, 0, 0.35)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          fontSize: 42,
          lineHeight: 1,
        }}
      >
        ✨
      </div>

      <div
        style={{
          marginTop: 18,
          fontSize: 30,
          fontWeight: 900,
          lineHeight: 1.3,
          letterSpacing: 1,
          whiteSpace: "nowrap",
          color: "#ffffff",
        }}
      >
        ありがとうございました
      </div>

      <div
        style={{
          marginTop: 18,
          fontSize: 16,
          lineHeight: 1.8,
          color: "#ffffff",
        }}
      >
        またのご来店を
        <br />
        心よりお待ちしております
      </div>

      <div
        style={{
          marginTop: 24,
          fontSize: 14,
          fontWeight: 700,
          color: "#cbd5e1",
        }}
      >
        {currentStore?.name || "デモ店舗"}
      </div>
    </div>
  </div>
)}

</div>

      </div>
  </>
);
}

export default PlayerPage;
