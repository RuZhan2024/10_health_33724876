const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

const API_BASE = "https://api.openweathermap.org/data/2.5/weather";

/**
 * Fetch current weather for a given city from OpenWeather.
 * Returns a small, normalised object with just the fields we care about.
 */
async function fetchWeatherForCity(city) {
  const apiKey = process.env.OPENWEATHER_API_KEY || "b44940e5eda0e721e710cd08b3725ba0";

  if (!apiKey) {
    // We use a custom error code so the route can show a helpful message.
    const err = new Error("OPENWEATHER_API_KEY missing");
    err.code = "NO_API_KEY";
    throw err;
  }

  const url =
    `${API_BASE}?q=${encodeURIComponent(city)}` +
    `&appid=${apiKey}&units=metric`;

  let res;
  try {
    // Use the global fetch to call the external weather API.
    res = await fetch(url);
  } catch (err) {
    // Covers network issues, DNS problems, etc.
    const e = new Error("Network error calling weather API");
    e.code = "NETWORK_ERROR";
    throw e;
  }

  if (!res.ok) {
    // OpenWeatherMap returns 404 if the city name cannot be found.
    if (res.status === 404) {
      const e = new Error("City not found");
      e.code = "CITY_NOT_FOUND";
      throw e;
    }
    const e = new Error(`Weather API error (status ${res.status})`);
    e.code = "API_ERROR";
    throw e;
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    const e = new Error("Failed to parse weather API response");
    e.code = "BAD_JSON";
    throw e;
  }

  // Return a tidy object so the template does not have to know API details.
  return {
    cityName: data.name,
    country: data.sys && data.sys.country,
    temp: data.main && data.main.temp,
    feelsLike: data.main && data.main.feels_like,
    humidity: data.main && data.main.humidity,
    windSpeed: data.wind && data.wind.speed,
    description: data.weather && data.weather[0] && data.weather[0].description,
  };
}

// GET /weather?city=London
router.get("/", async (req, res) => {
  const rawCity = (req.query.city || "").trim();

  // When no city is provided, just render the empty form.
  if (!rawCity) {
    return res.render("weather", {
      pageTitle: "Weather",
      city: "",
      weather: null,
      error: null,
    });
  }

  const city = rawCity;

  try {
    const weather = await fetchWeatherForCity(city);

    // Successful lookup: show the weather card in the template.
    return res.render("weather", {
      pageTitle: "Weather",
      city,
      weather,
      error: null,
    });
  } catch (err) {
    console.error("Weather error:", err);

    // Default message for unexpected failures.
    let message = "Unable to load weather right now. Please try again.";

    // Tailor the message for the most common error cases.
    if (err.code === "NO_API_KEY") {
      message =
        "Weather is not configured (OPENWEATHER_API_KEY is missing). " +
        "Please add an API key in .env to enable this feature.";
    } else if (err.code === "CITY_NOT_FOUND") {
      message = `No weather data found for "${city}". Please check the spelling and try again.`;
    } else if (err.code === "NETWORK_ERROR") {
      message =
        "Cannot reach the weather service. Please check your connection and try again.";
    }

    return res.render("weather", {
      pageTitle: "Weather",
      city,
      weather: null,
      error: message,
    });
  }
});

module.exports = router;
