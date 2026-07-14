import { useEffect, useState } from "react";
import { getNotice } from "../data/noticeData";

function InfoPanel({ storeCode }) {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [currentCard, setCurrentCard] = useState(0);

  const storeLocations = {
    please: {
      name: "市川市",
      latitude: 35.72,
      longitude: 139.93,
    },
    pearl: {
      name: "パール店舗地域",
      latitude: 35.72,
      longitude: 139.93,
    },
  };

  const location =
    storeLocations[storeCode] || storeLocations.please;

  useEffect(() => {
    async function loadWeather() {
      try {
        setError("");

        const url =
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${location.latitude}` +
          `&longitude=${location.longitude}` +
          `&current=temperature_2m,weather_code` +
          `&daily=precipitation_probability_max` +
          `&timezone=Asia%2FTokyo` +
          `&forecast_days=1`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("天気情報を取得できませんでした");
        }

        const data = await response.json();

        const temperature = Math.round(
          data.current?.temperature_2m ?? 0
        );

        const weatherCode =
          data.current?.weather_code ?? 0;

        const precipitation =
          data.daily?.precipitation_probability_max?.[0] ?? 0;

        setWeather({
          temperature,
          weatherCode,
          precipitation,
        });
      } catch (err) {
        console.error("天気取得エラー:", err);
        setError("天気情報を取得できません");
      }
    }

    loadWeather();

    const timer = setInterval(
      loadWeather,
      30 * 60 * 1000
    );

    return () => clearInterval(timer);
  }, [location.latitude, location.longitude]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentCard((prev) => (prev + 1) % 3);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const getWeatherInfo = (code) => {
    if (code === 0) {
      return {
        icon: "☀️",
        label: "快晴",
      };
    }

    if (code <= 3) {
      return {
        icon: "🌤️",
        label: "晴れ・くもり",
      };
    }

    if (code <= 48) {
      return {
        icon: "🌫️",
        label: "霧",
      };
    }

    if (code <= 67) {
      return {
        icon: "🌧️",
        label: "雨",
      };
    }

    if (code <= 77) {
      return {
        icon: "🌨️",
        label: "雪",
      };
    }

    if (code <= 82) {
      return {
        icon: "🌦️",
        label: "にわか雨",
      };
    }

    return {
      icon: "⛈️",
      label: "雷雨",
    };
  };

  const getLaundryInfo = (
    precipitation,
    temperature
  ) => {
    if (precipitation >= 60) {
      return {
        stars: 1,
        message: "部屋干しがおすすめです",
        subMessage: "外干しは控えましょう",
      };
    }

    if (precipitation >= 30) {
      return {
        stars: 3,
        message: "急な雨にご注意ください",
        subMessage: "早めの取り込みがおすすめ",
      };
    }

    if (temperature >= 20) {
      return {
        stars: 5,
        message: "よく乾きそうです",
        subMessage: "絶好の洗濯日和です",
      };
    }

    return {
      stars: 4,
      message: "まずまずの洗濯日和です",
      subMessage: "日中の外干しがおすすめ",
    };
  };

  const panelStyle = {
    height: "100%",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#0f172a",
    overflow: "hidden",
  };

  const headerStyle = {
    height: 38,
    padding: "0 18px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  };

  const titleStyle = {
    fontSize: 15,
    fontWeight: 900,
    letterSpacing: 0.5,
  };

  const indicatorStyle = {
    display: "flex",
    gap: 5,
  };

  const notice = getNotice(storeCode);

  const renderIndicators = () => (
    <div style={indicatorStyle}>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          style={{
            width: index === currentCard ? 16 : 6,
            height: 6,
            borderRadius: 999,
            background:
              index === currentCard
                ? "#0f172a"
                : "#cbd5e1",
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </div>
  );

  if (error) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>
          <span style={titleStyle}>
            インフォメーション
          </span>
        </div>

        <div
          style={{
            height: "calc(100% - 38px)",
            display: "grid",
            placeItems: "center",
            padding: 16,
            boxSizing: "border-box",
            color: "#64748b",
            fontSize: 15,
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>
          <span style={titleStyle}>
            インフォメーション
          </span>
        </div>

        <div
          style={{
            height: "calc(100% - 38px)",
            display: "grid",
            placeItems: "center",
            color: "#64748b",
            fontSize: 15,
          }}
        >
          天気情報を読み込み中...
        </div>
      </div>
    );
  }

  const weatherInfo = getWeatherInfo(
    weather.weatherCode
  );

  const laundryInfo = getLaundryInfo(
    weather.precipitation,
    weather.temperature
  );

  return (
    <div style={panelStyle}>
      <style>
        {`
          @keyframes infoPanelFade {
            from {
              opacity: 0;
              transform: translateY(5px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      <div style={headerStyle}>
        <span style={titleStyle}>
          {currentCard === 0 && "今日の天気"}
          {currentCard === 1 && "洗濯予報"}
          {currentCard === 2 && "店舗からのお知らせ"}
        </span>

        {renderIndicators()}
      </div>

      <div
        key={currentCard}
        style={{
          height: "calc(100% - 38px)",
          animation: "infoPanelFade 0.45s ease",
        }}
      >
        {currentCard === 0 && (
          <div
            style={{
              height: "100%",
              padding: "10px 18px",
              boxSizing: "border-box",
              display: "grid",
              gridTemplateColumns: "72px 1fr",
              alignItems: "center",
              columnGap: 14,
            }}
          >
            <div
              style={{
                fontSize: 54,
                lineHeight: 1,
                textAlign: "center",
              }}
            >
              {weatherInfo.icon}
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                }}
              >
                <strong
                  style={{
                    fontSize: 34,
                    lineHeight: 1,
                    fontWeight: 900,
                  }}
                >
                  {weather.temperature}℃
                </strong>

                <span
                  style={{
                    fontSize: 15,
                    color: "#475569",
                    fontWeight: 700,
                  }}
                >
                  {weatherInfo.label}
                </span>
              </div>

              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                  }}
                >
                  {location.name}
                </span>

                <span
                  style={{
                    padding: "5px 9px",
                    background: "#eff6ff",
                    borderRadius: 999,
                    color: "#1e40af",
                    fontSize: 13,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}
                >
                  降水確率 {weather.precipitation}%
                </span>
              </div>
            </div>
          </div>
        )}

        {currentCard === 1 && (
          <div
            style={{
              height: "100%",
              padding: "12px 18px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: 27,
                letterSpacing: 3,
                lineHeight: 1,
                color: "#f59e0b",
                whiteSpace: "nowrap",
              }}
            >
              {"★".repeat(laundryInfo.stars)}
              <span style={{ color: "#cbd5e1" }}>
                {"★".repeat(5 - laundryInfo.stars)}
              </span>
            </div>

            <div
              style={{
                marginTop: 12,
                fontSize: 19,
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              {laundryInfo.message}
            </div>

            <div
              style={{
                marginTop: 5,
                fontSize: 13,
                color: "#64748b",
              }}
            >
              {laundryInfo.subMessage}
            </div>
          </div>
        )}

        {currentCard === 2 && (
          <div
            style={{
              height: "100%",
              padding: "13px 18px",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: "#fff7ed",
                display: "grid",
                placeItems: "center",
                fontSize: 25,
                flexShrink: 0,
              }}
            >
              📢
            </div>

            <div
              style={{
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 900,
                  lineHeight: 1.3,
                }}
              >
                {notice.title}
              </div>

              <div
                style={{
                  marginTop: 7,
                  fontSize: 14,
                  lineHeight: 1.45,
                  color: "#475569",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {notice.message}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InfoPanel;