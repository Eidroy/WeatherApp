const weatherForm = document.getElementById("weather-form");
const weatherInfo = document.getElementById("weather-info");

const APICall =
  "https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&units=metric&appid=1ddcbac86962f66da4105d88357161ad";
const GeoCall =
  "https://api.openweathermap.org/geo/1.0/direct?q={city},{country_code}&limit=1&appid=1ddcbac86962f66da4105d88357161ad";

const lastCity = localStorage.getItem("lastCity");
if (lastCity) {
  document.getElementById("city").value = lastCity;
}

weatherForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearPreviousChart();
  const city = document.getElementById("city").value.trim();

  if (!city) {
    weatherInfo.innerHTML = "Please enter a city name.";
    return;
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error);
  } else {
    fetchWeatherByCity(city);
  }
});

function success(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  const weatherAPIUrl = APICall.replace("{lat}", lat).replace("{lon}", lon);

  fetchWeather(weatherAPIUrl);
}

function error(err) {
  console.error("Error getting geolocation:", err);
  weatherInfo.innerHTML =
    "Unable to retrieve geolocation. Trying city search...";
  fetchWeatherByCity(city);
}

function fetchWeatherByCity(city) {
  const cityName = city.value;
  const cityAPIUrl = GeoCall.replace("{city}", cityName);
  console.log(cityName);

  fetch(cityAPIUrl)
    .then((response) => response.json())
    .then((data) => {
      if (data.length === 0) {
        console.log(data);
        weatherInfo.innerHTML = "City not found.";
      } else {
        const lat = data[0].lat;
        const lon = data[0].lon;
        const weatherAPIUrl = APICall.replace("{lat}", lat).replace(
          "{lon}",
          lon
        );
        fetchWeather(weatherAPIUrl);
      }
    })
    .catch((err) => {
      console.error("Error fetching weather by city:", err);
      weatherInfo.innerHTML = "Error fetching weather data.";
    });
}

function fetchWeather(url) {
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      const cityName = data.city.name;
      const country_code = data.city.country;
      localStorage.setItem("lastCity", `${cityName}, ${country_code}`);

      const temperatures = [];

      const specificIndices = [0, 8, 16, 24, 32];
      for (const index of specificIndices) {
        const temp = Math.floor(data.list[index].main.temp);
        temperatures.push(temp);
      }

      document.querySelector(
        "#weather-info"
      ).innerHTML = `Weather in ${cityName}`;
      fetchUnsplashPhoto(cityName)
        .then((imageUrl) => {
          console.log(imageUrl);
          document.getElementById("weather-image").style.display = "block";
          document.getElementById("weather-image").src = imageUrl;
        })
        .catch((error) => {
          console.error("Error displaying image:", error);
        });
      displayTemperatureChart(temperatures, cityName);
    })
    .catch((err) => {
      console.error("Error fetching weather data:", err);
      weatherInfo.innerHTML = "Error fetching weather data.";
    });
}

function displayTemperatureChart(temperatures, cityName) {
  const ctx = document.getElementById("weather-chart").getContext("2d");
  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"],
      datasets: [
        {
          label: `Temperature (°C) in ${cityName}`,
          data: temperatures,
          backgroundColor: "#31332A",
          borderColor: "#FFFFFF",
          borderWidth: 5,
        },
      ],
    },
    options: {
      scales: {
        yAxes: {
          ticks: {
            beginAtZero: true,
          },
        },
      },
    },
  });
}

function clearPreviousChart() {
  const chart = Chart.getChart("weather-chart");
  try {
    chart.destroy();
  } catch (error) {
    console.log("Error destroying previous chart:", error);
  }
}

async function fetchUnsplashPhoto(cityName) {
  const accessKey = "Y937AF7_jt0ED54mFLEAnf-ph0tk_mVbyOSnsPHlN68";
  const baseUrl = "https://api.unsplash.com/search/photos";

  const url = new URL(baseUrl);
  url.searchParams.append("query", cityName);
  url.searchParams.append("client_id", accessKey);
  url.searchParams.append("per_page", 1);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching Unsplash photo: ${response.statusText}`);
    }
    const data = await response.json();
    const photo = data.results[0];

    return photo.urls.regular;
  } catch (error) {
    console.error("Error fetching Unsplash photo:", error);
    return "/image.jpg";
  }
}
