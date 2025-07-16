const apiKey = 'e739ce15245f73acae70ecd682f38db1';

const sunrisePkEl = document.getElementById('sunrise-pk');
const sunsetPkEl = document.getElementById('sunset-pk');
const searchBtn = document.getElementById('searchBtn');
const voiceBtn = document.getElementById('voiceBtn');
const searchInput = document.getElementById('searchInput');
const locationEl = document.querySelector('.location');
const tempEl = document.querySelector('.temp');
const descEl = document.querySelector('.desc');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const feelsEl = document.getElementById('feels');
const pressureEl = document.getElementById('pressure');
const forecastEl = document.getElementById('forecast');
const hourlyEl = document.getElementById('hourly');
const sunriseEl = document.getElementById('sunrise');
const sunsetEl = document.getElementById('sunset');
const weatherIcon = document.getElementById('weatherIcon');
const weatherEffectsEl = document.querySelector('.weather-effects');

// Search button
searchBtn.addEventListener('click', () => {
    const city = searchInput.value.trim();
    if (city !== '') fetchWeather(city);
});

// Voice command
voiceBtn.addEventListener('click', () => {
    const recognition = new(window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = (event) => {
        let spokenCity = event.results[0][0].transcript.trim();
        spokenCity = spokenCity.replace(/[.,!?]+$/, '');
        searchInput.value = spokenCity;
        fetchWeather(spokenCity);
    };

    recognition.onerror = (event) => {
        alert('Voice error: ' + event.error);
    };
});

// Auto location on page load
window.addEventListener('load', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async(position) => {
            const { latitude, longitude } = position.coords;
            try {
                const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`);
                const data = await res.json();
                updateCurrentWeather(data);
                setTimeBasedTheme();
                setWeatherBackground(data.weather[0].main);
                addWeatherEffects(data.weather[0].main);
                fetchForecast(data.name);
            } catch (error) {
                alert("Unable to detect weather automatically.");
            }
        });
    }
});

async function fetchWeather(city) {
    try {
        document.body.classList.add('loading');
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`);
        const data = await res.json();

        if (data.cod !== 200) {
            throw new Error(data.message);
        }

        updateCurrentWeather(data);
        setTimeBasedTheme();
        setWeatherBackground(data.weather[0].main);
        addWeatherEffects(data.weather[0].main);
        await fetchForecast(city);
    } catch (error) {
        alert('City not found! Please try again.');
    } finally {
        document.body.classList.remove('loading');
    }
}
// offset 
function getTimeZoneFromOffset(offsetInSeconds) {
    const offsetHours = offsetInSeconds / 3600;

    // Common mappings (expand if needed)

    if (offsetHours === 5.5) return 'Asia/Kolkata'; // Mumbai, Delhi
    if (offsetHours === 5) return 'Asia/Karachi'; // Pakistan
    if (offsetHours === 3) return 'Europe/Moscow';
    if (offsetHours === 1) return 'Europe/Berlin';
    if (offsetHours === 0) return 'Etc/UTC';
    if (offsetHours === -5) return 'America/New_York';
    if (offsetHours === 9) return 'Asia/Tokyo';

    return 'UTC'; // fallback
}

// 🕒 Convert UTC timestamp to time in specific timezone name
function convertWithTimeZoneName(utcTimestamp, timeZoneName) {
    return new Intl.DateTimeFormat('en-US', {
        timeZone: timeZoneName,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(new Date(utcTimestamp * 1000));
}

// 🌦️ Update weather UI
function updateCurrentWeather(data) {
    const { name, main, weather, wind, sys, timezone } = data;

    locationEl.textContent = name;
    tempEl.textContent = `${Math.round(main.temp)}°C`;
    descEl.textContent = weather[0].description;
    humidityEl.textContent = `Humidity: ${main.humidity}%`;
    windEl.textContent = `Wind: ${wind.speed} m/s`;
    feelsEl.textContent = `Feels like: ${Math.round(main.feels_like)}°C`;
    pressureEl.textContent = `Pressure: ${main.pressure} hPa`;

    const cityTimeZone = getTimeZoneFromOffset(timezone);

    // Local sunrise/sunset
    sunriseEl.textContent = `🌅 Sunrise: ${convertWithTimeZoneName(sys.sunrise, cityTimeZone)}`;
    sunsetEl.textContent = `🌇 Sunset: ${convertWithTimeZoneName(sys.sunset, cityTimeZone)}`;

    // Pakistan sunrise/sunset
    sunrisePkEl.textContent = `🌅 Sunrise: ${convertWithTimeZoneName(sys.sunrise, 'Asia/Karachi')}`;
    sunsetPkEl.textContent = `🌇 Sunset: ${convertWithTimeZoneName(sys.sunset, 'Asia/Karachi')}`;

    weatherIcon.src = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;
}

// 🌇 Theme changer
function setTimeBasedTheme() {
    const hour = new Date().getHours();
    const isDay = hour > 6 && hour < 18;
    document.body.style.setProperty('--primary-color', isDay ? '#4a90e2' : '#1a237e');
    document.body.style.setProperty('--text-color', isDay ? '#333' : '#fff');
}

// 💧 Weather Effects
function addWeatherEffects(weatherType) {
    weatherEffectsEl.innerHTML = '';
    weatherType = weatherType.toLowerCase();

    if (weatherType.includes('rain')) {
        weatherEffectsEl.innerHTML = `
            <div class="rain-effect">
                ${Array(50).fill().map(() =>
            `<div class="raindrop" style="
                left: ${Math.random() * 100}%;
                animation-delay: ${Math.random()}s;
                height: ${10 + Math.random() * 15}px;
            "></div>`).join('')}
            </div>`;
    }
}

// 🔮 Forecast: hourly + daily
function fetchForecast(city) {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`)
        .then(res => res.json())
        .then(data => {
            // Hourly
            hourlyEl.innerHTML = '';
            data.list.slice(0, 6).forEach(hour => {
                const timeString = new Date(hour.dt_txt).toLocaleTimeString([], {
                    hour: '2-digit',
                    hour12: true
                }).replace(':00', '');

                const card = document.createElement('div');
                card.className = 'forecast-card';
                card.innerHTML = `
                    <div class="forecast-time">${timeString}</div>
                    <img src="https://openweathermap.org/img/wn/${hour.weather[0].icon}.png" class="forecast-icon">
                    <div class="forecast-temp">${Math.round(hour.main.temp)}°C</div>
                    <div class="forecast-desc">${hour.weather[0].main}</div>
                `;
                hourlyEl.appendChild(card);
            });

            // Daily
            forecastEl.innerHTML = '';
            const dailyData = data.list.filter((_, index) => index % 8 === 0).slice(0, 5);
            dailyData.forEach(day => {
                const card = document.createElement('div');
                card.className = 'forecast-card';
                card.innerHTML = `
                    <div class="forecast-day">${new Date(day.dt_txt).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" class="forecast-icon">
                    <div class="forecast-temp">${Math.round(day.main.temp)}°C</div>
                    <div class="forecast-desc">${day.weather[0].main}</div>
                `;
                forecastEl.appendChild(card);
            });
        });
}

// 🌄 Weather Backgrounds
function setWeatherBackground(type) {
    const backgrounds = {
        clear: 'url("./images/clear.jpg")',
        clouds: 'url("./images/cloudy.jpg")',
        rain: 'url("./images/rainy.jpg")',
        thunder: 'url("./images/thunder.jpg")',
        snow: 'url("./images/snowy.jpg")',
        default: 'url("./images/default.jpg")'
    };

    type = type.toLowerCase();
    const bg =
        type.includes("clear") ? backgrounds.clear :
            type.includes("cloud") ? backgrounds.clouds :
                type.includes("rain") ? backgrounds.rain :
                    type.includes("thunder") ? backgrounds.thunder :
                        type.includes("snow") ? backgrounds.snow :
                            backgrounds.default;

    document.body.style.backgroundImage = `${bg}, linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5))`;
    document.body.style.backgroundBlendMode = 'overlay';
}