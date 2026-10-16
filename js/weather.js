/* ============================================================
   Weather app — live weather from the UAPI Weather API
   https://uapis.cn/api/v1/misc/weather?city=<city name>
   ============================================================ */
(function () {
  "use strict";

  var API_URL = "https://uapis.cn/api/v1/misc/weather";
  var ICON_URL = "https://cdn.jsdelivr.net/gh/qwd/Icons@1.8.0/icons/";

  var form = document.getElementById("weather-form");
  if (!form) return;

  var input = document.getElementById("weather-input");
  var searchBtn = form.querySelector(".weather-search");
  var messageEl = document.getElementById("weather-message");
  var cardEl = document.getElementById("weather-card");
  var iconEl = document.getElementById("weather-icon");
  var iconFallbackEl = document.getElementById("weather-icon-fallback");
  var cityEl = document.getElementById("weather-city");
  var regionEl = document.getElementById("weather-region");
  var tempEl = document.getElementById("weather-temp");
  var conditionEl = document.getElementById("weather-condition");

  var requestId = 0;

  /* The API describes conditions in Chinese; translate the common ones
     for this English-language site and fall back to the raw text. */
  var CONDITION_TRANSLATIONS = {
    "晴": "Clear",
    "多云": "Partly cloudy",
    "阴": "Overcast",
    "附近局部降雨": "Patchy rain nearby",
    "阵雨": "Showers",
    "强阵雨": "Heavy showers",
    "雷阵雨": "Thundery showers",
    "强雷阵雨": "Heavy thunderstorms",
    "雷阵雨伴有冰雹": "Thundery showers with hail",
    "小雨": "Light rain",
    "中雨": "Moderate rain",
    "大雨": "Heavy rain",
    "极端降雨": "Extreme rain",
    "毛毛雨": "Drizzle",
    "暴雨": "Rainstorm",
    "大暴雨": "Heavy rainstorm",
    "特大暴雨": "Torrential rainstorm",
    "冻雨": "Freezing rain",
    "雨夹雪": "Sleet",
    "雨雪天气": "Rain and snow",
    "阵雨夹雪": "Sleet showers",
    "小雪": "Light snow",
    "中雪": "Moderate snow",
    "大雪": "Heavy snow",
    "暴雪": "Snowstorm",
    "阵雪": "Snow flurries",
    "强阵雪": "Heavy snow flurries",
    "薄雾": "Mist",
    "雾": "Fog",
    "霾": "Haze",
    "浮尘": "Dust",
    "扬沙": "Blowing sand",
    "沙尘暴": "Sandstorm",
    "强沙尘暴": "Severe sandstorm",
    "热": "Hot",
    "冷": "Cold",
    "未知": "Unknown"
  };

  function translateCondition(text) {
    if (!text) return "";
    if (CONDITION_TRANSLATIONS[text]) return CONDITION_TRANSLATIONS[text];
    // Handle combined descriptions such as "小到中雨".
    var key = Object.keys(CONDITION_TRANSLATIONS).find(function (k) {
      return text.indexOf(k) !== -1;
    });
    return key ? CONDITION_TRANSLATIONS[key] : text;
  }

  /* Emoji used if the hosted SVG icon can't be loaded. */
  function emojiForIconCode(code) {
    var n = parseInt(code, 10);

    if (isNaN(n)) return "🌤️";
    if (n === 100) return "☀️";
    if (n === 150) return "🌙";
    if (n >= 101 && n <= 103 || n >= 151 && n <= 153) return "⛅";
    if (n === 104 || n === 154) return "☁️";
    if (n === 313 || n === 404 || n === 405 || n === 406) return "🌨️";
    if (n === 302 || n === 303 || n === 304) return "⛈️";
    if (n >= 300 && n < 400) return "🌧️";
    if (n >= 400 && n < 500) return "❄️";
    if (n === 500 || n === 501) return "🌫️";
    if (n === 502) return "😶‍🌫️";
    if (n >= 503 && n < 600) return "🌪️";
    if (n === 900) return "🥵";
    if (n === 901) return "🥶";
    return "🌤️";
  }

  function showMessage(text, state) {
    messageEl.textContent = text;
    messageEl.className = "weather-message" + (state ? " " + state : "");
  }

  function clearMessage() {
    messageEl.textContent = "";
    messageEl.className = "weather-message";
  }

  function hideCard() {
    cardEl.hidden = true;
  }

  function regionLabel(data) {
    var province = (data.province || "").trim();
    var city = (data.city || "").trim();
    if (!province || !city) return "";
    if (province.indexOf(city) !== -1 || city.indexOf(province) !== -1) return "";
    return province;
  }

  function renderWeather(data) {
    cityEl.textContent = data.city || "";

    var region = regionLabel(data);
    regionEl.textContent = region;
    regionEl.hidden = !region;

    tempEl.textContent = Math.round(Number(data.temperature));

    var condition = translateCondition(data.weather);
    conditionEl.textContent = condition;

    var code = data.weather_icon ? String(data.weather_icon) : "999";
    iconFallbackEl.textContent = emojiForIconCode(code);
    iconEl.alt = condition ? condition + " weather icon" : "Weather icon";
    iconFallbackEl.hidden = true;
    iconEl.hidden = false;
    iconEl.src = ICON_URL + encodeURIComponent(code) + ".svg";

    cardEl.hidden = false;
  }

  // If the SVG can't be reached, swap in the emoji fallback.
  iconEl.addEventListener("error", function () {
    iconEl.hidden = true;
    iconFallbackEl.hidden = false;
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var city = input.value.trim();

    if (!city) {
      hideCard();
      showMessage("Enter a city first.", "is-error");
      input.focus();
      return;
    }

    var thisRequest = ++requestId;
    searchBtn.disabled = true;
    hideCard();
    showMessage("Loading…", "is-loading");

    fetch(API_URL + "?city=" + encodeURIComponent(city), {
      headers: { "Accept": "application/json" }
    })
      .then(function (response) {
        return response
          .json()
          .then(function (data) {
            return { ok: response.ok, data: data };
          })
          .catch(function () {
            return { ok: false, data: null };
          });
      })
      .then(function (result) {
        if (thisRequest !== requestId) return;

        var data = result.data;
        var isValid =
          result.ok &&
          data &&
          !data.error &&
          data.city &&
          data.temperature !== undefined &&
          data.temperature !== null;

        if (!isValid) {
          hideCard();
          showMessage("Couldn't find that city — check the spelling.", "is-error");
          return;
        }

        clearMessage();
        renderWeather(data);
      })
      .catch(function () {
        if (thisRequest !== requestId) return;
        hideCard();
        showMessage("Couldn't find that city — check the spelling.", "is-error");
      })
      .then(function () {
        if (thisRequest === requestId) searchBtn.disabled = false;
      });
  });
})();
