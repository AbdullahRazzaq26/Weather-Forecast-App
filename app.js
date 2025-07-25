let baseUrl = 'https://api.weatherapi.com/v1/current.json?key=486d67f155704c51a8a225058252407&q=';
let nextDaysUrl = 'https://api.weatherapi.com/v1/forecast.json?key=486d67f155704c51a8a225058252407&q='
let city = document.querySelector('#city');
let getBtn = document.querySelector('#getBtn');
let details = document.querySelector('#details');
let icon = document.querySelector('#weather-icon')


let getWeather = async (location) => {
    try {
        let url = `${baseUrl}${location}`;
        let response = await fetch(url);
        let data = await response.json();

        if (data.error) throw new Error(data.error.message);

        const condition = data.current.condition.text;
        const iconURL = "https:" + data.current.condition.icon;

        icon.src = iconURL;
        icon.alt = condition;

        details.innerHTML = `
            <h2>${data.location.name}, ${data.location.country}</h2>
            <p id="current-time" class="current-time "></p>
            <p><strong>🌤️ Condition:</strong> ${condition}</p>
            <p><strong>🌡️ Temp:</strong> ${data.current.temp_c}°C <em>(Feels like ${data.current.feelslike_c}°C)</em></p>
            <p><strong>💨 Wind:</strong> ${data.current.wind_kph} kph ${data.current.wind_dir}</p>
            <p><strong>💧 Humidity:</strong> ${data.current.humidity}%</p>
            <p><strong>☁️ Cloud:</strong> ${data.current.cloud}%</p>
            <p class="last-updated">⏱️ Last Updated: ${data.current.last_updated}</p>
        `;


        let localTime = data.location.localtime;
        let [dateStr, timeStr] = localTime.split(" ");
        let [hourStr, minuteStr] = timeStr.split(":");
        let hour = parseInt(hourStr);
        let minutes = parseInt(minuteStr);


        setThemeByTime(hour, minutes);


        document.querySelector("#current-time").textContent = `🕒 Local Time: ${formatTime(hour, minutes)}`;

        city.value = data.location.name;

        document.querySelector('.weather-output').classList.add('show');

        let body = document.querySelector('#body');
        let isDay = data.current.is_day;

        if (isDay === 1) {
            body.classList.remove('night-theme');
            body.classList.add('day-theme');
        } else {
            body.classList.remove('day-theme');
            body.classList.add('night-theme');
        }


    } catch (error) {
        details.innerHTML = `<p class="error">⚠️ ${error.message || "Unable to fetch weather data."}</p>`;
        icon.src = '';
        icon.alt = '';
        document.querySelector('.weather-output').classList.remove('show');
        console.error(error);
    }
};


function formatTime(hour, minute) {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    let hour12 = hour % 12;
    hour12 = hour12 === 0 ? 12 : hour12;
    let minuteStr = minute < 10 ? '0' + minute : minute;
    return `${hour12}:${minuteStr} ${ampm}`;
}


let nextDaysWeather = async (location) => {
    try {
        let response = await fetch(`${nextDaysUrl}${location}&days=5`);
        let nextDaysData = await response.json();
        let forecast = nextDaysData.forecast.forecastday;

        let forecastHTML = '';

        forecast.forEach((dayData) => {
            let date = dayData.date;
            let iconURL = "https:" + dayData.day.condition.icon;
            let condition = dayData.day.condition.text;

            forecastHTML += `
                <div class="forecast-card">
                    <img src="${iconURL}" alt="${condition}" />
                    <h4>${date}</h4>
                    <p>${condition}</p>
                    <p>🌡️<b> Max: </b>${dayData.day.maxtemp_c}°C</p>
                    <p>🌡️<b> Min: </b>${dayData.day.mintemp_c}°C</p>
                    <p>💨<b> Wind: </b>${dayData.day.maxwind_kph} kph</p>
                    <p>🌅<b> Sunrise: </b>${dayData.astro.sunrise}</p>
                    <p>🌇<b> Sunset: </b>${dayData.astro.sunset}</p>
                </div>
            `;
        });

        let localTime = nextDaysData.location.localtime;
        let [hourStr, minuteStr] = localTime.split(" ")[1].split(":");
        let hour = parseInt(hourStr);
        let minutes = parseInt(minuteStr);
        setThemeByTime(hour, minutes);

        document.querySelector('#forecast').innerHTML = forecastHTML;
    } catch (error) {
        console.error("Forecast error:", error);
        document.querySelector('#forecast').innerHTML = `<p class="error">⚠️ Unable to load forecast.</p>`;
    }
};




getBtn.addEventListener('click', () => {
    if (city.value.trim() !== '') {
        getWeather(city.value.trim());
        nextDaysWeather(city.value.trim());
    }
});


city.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' && city.value.trim() !== '') {
        getWeather(city.value.trim());
        nextDaysWeather(city.value.trim());
    }
});


function setThemeByTime(hour, minutes) {
    document.body.classList.remove('night-theme', 'day-theme', 'sunny-theme', 'golden-hour-theme');

    const totalMinutes = hour * 60 + minutes;

    if (totalMinutes >= 300 && totalMinutes <= 480) {
        document.body.classList.add('day-theme');
    } else if (totalMinutes > 480 && totalMinutes < 1080) {
        document.body.classList.add('sunny-theme');
    } else if (totalMinutes >= 1080 && totalMinutes <= 1175) {
        document.body.classList.add('golden-hour-theme');
    } else {
        document.body.classList.add('night-theme');
    }
}


window.addEventListener('load', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                let lat = position.coords.latitude;
                let lon = position.coords.longitude;
                let location = `${lat},${lon}`;
                getWeather(location);
                nextDaysWeather(location)
            },
            (error) => {
                console.warn("Geolocation failed or denied. Showing default city.");
                getWeather("Karachi");
            }
        );
    } else {
        console.warn("Geolocation not supported. Showing default city.");
        getWeather("Karachi");
        nextDaysWeather('karachi')
    }
});



const suggestionBox = document.querySelector('#suggestions');

city.addEventListener('input', () => {
    let inputVal = city.value.toLowerCase().trim();
    suggestionBox.innerHTML = '';

    if (inputVal.length === 0) {
        suggestionBox.style.display = 'none';
        return;
    }

    let matches = allCities.filter(cityName =>
        cityName.toLowerCase().startsWith(inputVal)
    ).slice(0, 10); // Show max 10 suggestions

    if (matches.length > 0) {
        matches.forEach(match => {
            let li = document.createElement('li');
            li.textContent = match;
            li.addEventListener('click', () => {
                city.value = match;
                suggestionBox.style.display = 'none';
                getWeather(match);
                nextDaysWeather(match);
            });
            suggestionBox.appendChild(li);
        });
        suggestionBox.style.display = 'block';
    } else {
        suggestionBox.style.display = 'none';
    }
});

document.addEventListener('click', (e) => {
    if (!suggestionBox.contains(e.target) && e.target !== city) {
        suggestionBox.style.display = 'none';
    }
});
