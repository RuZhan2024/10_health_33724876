// routes/weather.js
const express = require('express');
const router = express.Router();


const API_BASE = process.env.WEATHER_BASE_API || "https://api.openweathermap.org/data/2.5/weather";

// Helper to fetch and normalise weather data
async function fetchWeatherForCity(city) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    // Special error code so we can show a friendly message
    const err = new Error('OPENWEATHER_API_KEY missing');
    err.code = 'NO_API_KEY';
    throw err;
  }

  const url =
    `${API_BASE}?q=${encodeURIComponent(city)}` +
    `&appid=${apiKey}&units=metric`;

  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    // Network or DNS error
    const e = new Error('Network error calling weather API');
    e.code = 'NETWORK_ERROR';
    throw e;
  }

  if (!res.ok) {
    // OpenWeatherMap uses 404 for unknown city
    if (res.status === 404) {
      const e = new Error('City not found');
      e.code = 'CITY_NOT_FOUND';
      throw e;
    }
    const e = new Error(`Weather API error (status ${res.status})`);
    e.code = 'API_ERROR';
    throw e;
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    const e = new Error('Failed to parse weather API response');
    e.code = 'BAD_JSON';
    throw e;
  }

  // Normalise fields we care about
  return {
    cityName: data.name,
    country: data.sys && data.sys.country,
    temp: data.main && data.main.temp,
    feelsLike: data.main && data.main.feels_like,
    humidity: data.main && data.main.humidity,
    windSpeed: data.wind && data.wind.speed,
    description:
      data.weather && data.weather[0] && data.weather[0].description,
  };
}

// GET /weather?city=London,uk
router.get('/', async (req, res) => {
  const rawCity = (req.query.city || '').trim();

  // First load, no city chosen yet – just show the form
  if (!rawCity) {
    return res.render('weather', {
      pageTitle: 'Weather',
      city: '',
      weather: null,
      error: null,
    });
  }

  const city = rawCity;

  try {
    const weather = await fetchWeatherForCity(city);

    return res.render('weather', {
      pageTitle: 'Weather',
      city,
      weather,
      error: null,
    });
  } catch (err) {
    console.error('Weather error:', err);

    let message = 'Unable to load weather right now. Please try again.';
    if (err.code === 'NO_API_KEY') {
      message =
        'Weather is not configured (OPENWEATHER_API_KEY is missing). ' +
        'Please add an API key in .env to enable this feature.';
    } else if (err.code === 'CITY_NOT_FOUND') {
      message = `No weather data found for "${city}". Please check the spelling and try again.`;
    } else if (err.code === 'NETWORK_ERROR') {
      message = 'Cannot reach the weather service. Please check your connection and try again.';
    }

    return res.render('weather', {
      pageTitle: 'Weather',
      city,
      weather: null,
      error: message,
    });
  }
});

module.exports = router;
