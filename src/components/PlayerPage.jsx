import { useEffect, useState } from "react";
import { supabase } from "../supabase";

function PlayerPage({ ads = [], stores = [], storeCode, deliveryRules = [] }) {
  const mainAds = ads.filter((ad) => (ad.placement || "main") === "main");
  const bannerAds = ads.filter((ad) => ad.placement === "banner");

  const [mainIndex, setMainIndex] = useState(0);
  const [bannerIndex, setBannerIndex] = useState(0);

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
        display: "flex",
        flexDirection: "column",
      }}
    >
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
          }}
        >
          {renderMedia(bannerAd1)}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {renderMedia(bannerAd2)}
        </div>
      </div>
    </div>
  );
}

export default PlayerPage;