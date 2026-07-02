import { useState } from "react";

function DeliveryPage({
  ads,
  stores,
  deliveries,
  setDeliveries,
  showToast,
  styles,
}) {
  const [selectedAd, setSelectedAd] = useState(ads[0]?.id || null);

  const delivery = deliveries.find((d) => d.adId === selectedAd);
  const storeIds = delivery?.storeIds || [];

  const toggleStore = (storeId) => {
    const exists = storeIds.includes(storeId);
    const newIds = exists
      ? storeIds.filter((id) => id !== storeId)
      : [...storeIds, storeId];

    setDeliveries(
      deliveries.some((d) => d.adId === selectedAd)
        ? deliveries.map((d) =>
            d.adId === selectedAd ? { ...d, storeIds: newIds } : d
          )
        : [...deliveries, { adId: selectedAd, storeIds: newIds }]
    );

    showToast(exists ? "配信店舗を解除しました" : "配信店舗を追加しました");
  };

  return (
    <div style={styles.deliveryLayout}>
      <div style={{ ...styles.card, flex: "0 0 280px" }}>
        <div style={styles.cardHeader}>
          <span style={styles.cardTitle}>広告を選択</span>
        </div>

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
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#e2e8f0",
                  }}
                >
                  {ad.title}
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  {ad.duration}秒
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

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
                  ...(!selectedAd
                    ? { opacity: 0.4, cursor: "not-allowed" }
                    : {}),
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 8 }}>◉</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {store.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: active ? "#a7f3d0" : "#64748b",
                    marginTop: 4,
                  }}
                >
                  {store.screen_count || store.screen || 1}スクリーン
                </div>
                {active && <div style={styles.activeCheck}>✓</div>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DeliveryPage;