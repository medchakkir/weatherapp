// Constants
const CONFIG = {
  API_KEY: "255c7549955d253fc1d5844f03a9b211",
  BASE_URL: "https://api.openweathermap.org/data/2.5/weather",
  UNITS: "metric",
  DEBOUNCE_DELAY: 1000,
  ERROR_DISPLAY_TIME: 5000,
  FLAG_API_BASE: "https://flagsapi.com",
  WEATHER_ICON_BASE: "https://openweathermap.org/img/wn"
};

// DOM Elements
const elements = {
  valueSearch: document.getElementById("valueSearch"),
  city: document.getElementById("city"),
  temperature: document.querySelector(".temperature"),
  description: document.querySelector(".description"),
  clouds: document.getElementById("clouds"),
  humidity: document.getElementById("humidity"),
  pressure: document.getElementById("pressure"),
  form: document.querySelector("form"),
  geolocationBtn: document.getElementById("geolocationBtn"),
  errorMessage: document.getElementById("errorMessage"),
  loadingSpinner: document.getElementById("loadingSpinner"),
  emptyState: document.getElementById("emptyState"),
  weatherContent: document.getElementById("weatherContent"),
  main: document.querySelector("main")
};

// State
let debounceTimer = null;

// Initialize App
function initApp() {
  setupEventListeners();
  showEmptyState();
}

// Setup Event Listeners
function setupEventListeners() {
  // Form submission
  elements.form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (elements.valueSearch.value.trim() !== "") {
      searchWeather(elements.valueSearch.value.trim());
    }
  });

  // Debounced search input
  elements.valueSearch.addEventListener("input", (e) => {
    const cityName = e.target.value.trim();
    if (cityName !== "") {
      debounceSearch(cityName);
    }
  });

  // Geolocation button
  elements.geolocationBtn.addEventListener("click", handleGeolocation);
}

// Debounce Search
function debounceSearch(cityName) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    searchWeather(cityName);
  }, CONFIG.DEBOUNCE_DELAY);
}

// Search Weather by City Name
async function searchWeather(cityName) {
  if (!cityName) return;

  hideError();
  showLoading();
  hideEmptyState();

  try {
    const url = `${CONFIG.BASE_URL}?units=${CONFIG.UNITS}&appid=${CONFIG.API_KEY}&q=${encodeURIComponent(cityName)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.cod === 200) {
      updateUI(data);
      updateBackground(data);
    } else {
      showError("City not found. Please try another city name.");
      showEmptyState();
    }
  } catch (error) {
    console.error("Error fetching weather:", error);
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      showError("Network error. Please check your internet connection.");
    } else {
      showError("Unable to fetch weather data. Please try again.");
    }
    showEmptyState();
  } finally {
    hideLoading();
    elements.valueSearch.value = "";
  }
}

// Get Weather by Coordinates
async function getWeatherByCoords(lat, lon) {
  hideError();
  showLoading();
  hideEmptyState();

  try {
    const url = `${CONFIG.BASE_URL}?units=${CONFIG.UNITS}&appid=${CONFIG.API_KEY}&lat=${lat}&lon=${lon}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.cod === 200) {
      updateUI(data);
      updateBackground(data);
    } else {
      showError("Unable to get weather for your location.");
      showEmptyState();
    }
  } catch (error) {
    console.error("Error fetching weather by coordinates:", error);
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      showError("Network error. Please check your internet connection.");
    } else {
      showError("Unable to fetch weather data. Please try again.");
    }
    showEmptyState();
  } finally {
    hideLoading();
  }
}

// Handle Geolocation
function handleGeolocation() {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by your browser.");
    return;
  }

  hideError();
  elements.geolocationBtn.disabled = true;
  elements.geolocationBtn.querySelector("span").textContent = "Getting location...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      getWeatherByCoords(latitude, longitude);
      elements.geolocationBtn.disabled = false;
      elements.geolocationBtn.querySelector("span").textContent = "Use my location";
    },
    (error) => {
      elements.geolocationBtn.disabled = false;
      elements.geolocationBtn.querySelector("span").textContent = "Use my location";

      let errorMsg = "Unable to get your location.";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMsg = "Location access denied. Please enable location permissions.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMsg = "Location information unavailable.";
          break;
        case error.TIMEOUT:
          errorMsg = "Location request timed out. Please try again.";
          break;
      }
      showError(errorMsg);
    }
  );
}

// Update UI with Weather Data
function updateUI(data) {
  // City name and flag
  elements.city.querySelector("figcaption").innerText = data.name;
  elements.city.querySelector("img").src = `${CONFIG.FLAG_API_BASE}/${data.sys.country}/shiny/24.png`;
  elements.city.querySelector("img").alt = `${data.name} flag`;

  // Temperature and icon
  elements.temperature.querySelector("img").src = `${CONFIG.WEATHER_ICON_BASE}/${data.weather[0].icon}@4x.png`;
  elements.temperature.querySelector("img").alt = data.weather[0].description;
  elements.temperature.querySelector("figcaption span").innerText = Math.round(data.main.temp);

  // Description
  elements.description.innerText = data.weather[0].description;

  // Metrics
  elements.clouds.innerText = data.clouds.all;
  elements.humidity.innerText = data.main.humidity;
  elements.pressure.innerText = data.main.pressure;

  // Show weather content with animation
  elements.weatherContent.style.display = "block";
  elements.weatherContent.style.opacity = "0";
  setTimeout(() => {
    elements.weatherContent.style.opacity = "1";
  }, 10);
}

// Loading State Management
function showLoading() {
  elements.loadingSpinner.style.display = "block";
  elements.loadingSpinner.setAttribute("aria-hidden", "false");
}

function hideLoading() {
  elements.loadingSpinner.style.display = "none";
  elements.loadingSpinner.setAttribute("aria-hidden", "true");
}

// Error Message Management
function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.style.display = "block";
  elements.errorMessage.style.opacity = "1";

  // Auto-hide after CONFIG.ERROR_DISPLAY_TIME
  setTimeout(() => {
    hideError();
  }, CONFIG.ERROR_DISPLAY_TIME);
}

function hideError() {
  elements.errorMessage.style.opacity = "0";
  setTimeout(() => {
    elements.errorMessage.style.display = "none";
    elements.errorMessage.textContent = "";
  }, 300);
}

// Empty State Management
function showEmptyState() {
  elements.emptyState.style.display = "block";
  elements.weatherContent.style.display = "none";
}

function hideEmptyState() {
  elements.emptyState.style.display = "none";
}

// Update Background Based on Weather and Time
function updateBackground(weatherData) {
  const hour = new Date().getHours();
  let timeOfDay = "day";

  if (hour >= 6 && hour < 12) {
    timeOfDay = "morning";
  } else if (hour >= 12 && hour < 18) {
    timeOfDay = "afternoon";
  } else if (hour >= 18 && hour < 21) {
    timeOfDay = "evening";
  } else {
    timeOfDay = "night";
  }

  // Get weather condition
  const weatherMain = weatherData.weather[0].main.toLowerCase();
  const weatherId = weatherData.weather[0].id;

  let weatherCondition = "clear";

  if (weatherId >= 200 && weatherId < 300) {
    weatherCondition = "thunderstorm";
  } else if (weatherId >= 300 && weatherId < 400) {
    weatherCondition = "drizzle";
  } else if (weatherId >= 500 && weatherId < 600) {
    weatherCondition = "rain";
  } else if (weatherId >= 600 && weatherId < 700) {
    weatherCondition = "snow";
  } else if (weatherId >= 700 && weatherId < 800) {
    weatherCondition = "atmosphere";
  } else if (weatherId === 800) {
    weatherCondition = "clear";
  } else if (weatherId > 800) {
    weatherCondition = "clouds";
  }

  // Remove existing background classes from body
  const body = document.body;
  body.className = body.className.replace(/time-\w+|weather-\w+/g, "").trim();

  // Add new background classes to body
  body.classList.add(`time-${timeOfDay}`);
  body.classList.add(`weather-${weatherCondition}`);
}

// Initialize the app
initApp();
