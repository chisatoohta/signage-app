import { useEffect, useState } from "react";

function InfoPanel({ storeCode }) {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");

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

const location = storeLocations[storeCode] || storeLocations.please;

  useEffect(() => {
    async function loadWeather() {
      try {
        // 市川市付近の仮座標
        
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

        const temperature = Math.round(data.current?.temperature_2m ?? 0);
        const weatherCode = data.current?.weather_code ?? 0;
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

    // 30分ごとに更新
    const timer = setInterval(loadWeather, 30 * 60 * 1000);

    return () => clearInterval(timer);
  }, [location.latitude, location.longitude]);

  const getWeatherInfo = (code) => {
    if (code === 0) return { icon: "☀️", label: "快晴" };
    if (code <= 3) return { icon: "🌤️", label: "晴れ・くもり" };
    if (code <= 48) return { icon: "🌫️", label: "霧" };
    if (code <= 67) return { icon: "🌧️", label: "雨" };
    if (code <= 77) return { icon: "🌨️", label: "雪" };
    if (code <= 82) return { icon: "🌦️", label: "にわか雨" };
    return { icon: "⛈️", label: "雷雨" };
  };

  const getLaundryInfo = (precipitation, temperature) => {
    if (precipitation >= 60) {
      return { stars: 1, message: "部屋干しがおすすめです" };
    }

    if (precipitation >= 30) {
      return { stars: 3, message: "急な雨にご注意ください" };
    }

    if (temperature >= 20) {
      return { stars: 5, message: "よく乾きそうです" };
    }

    return { stars: 4, message: "まずまずの洗濯日和です" };
  };

  if (error) {
    return (
      <div style={{ padding: 18, color: "#64748b" }}>
        {error}
      </div>
    );
  }

  if (!weather) {
    return (
      <div style={{ padding: 18, color: "#64748b" }}>
        天気情報を読み込み中...
      </div>
    );
  }

  const weatherInfo = getWeatherInfo(weather.weatherCode);
  const laundryInfo = getLaundryInfo(
    weather.precipitation,
    weather.temperature
  );

  return (
    <div
      style={{
        height: "100%",
        boxSizing: "border-box",
        padding: 18,
        background: "#f8fafc",
        color: "#0f172a",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 14,
      }}
    >
      <div
        style={{
          paddingRight: 14,
          borderRight: "1px solid #cbd5e1",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800 }}>
          {location.name}の天気
        </div>

        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 34 }}>{weatherInfo.icon}</div>

          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>
              {weather.temperature}℃
            </div>
            <div style={{ fontSize: 14, color: "#64748b" }}>
              {weatherInfo.label}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 13,
            color: "#64748b",
          }}
        >
          降水確率 {weather.precipitation}%
        </div>
      </div>

      <div>
        <div style={{ fontSize: 16, fontWeight: 800 }}>
          洗濯予報
        </div>

        <div
          style={{
            marginTop: 12,
            fontSize: 20,
            letterSpacing: 2,
          }}
        >
          {"★".repeat(laundryInfo.stars)}
          {"☆".repeat(5 - laundryInfo.stars)}
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 14,
            lineHeight: 1.6,
            color: "#475569",
          }}
        >
          {laundryInfo.message}
        </div>
      </div>
    </div>
  );
}

export default InfoPanel;