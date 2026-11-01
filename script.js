var map = L.map('map');

const tiles = L.tileLayer('https://api.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=f12b8de0c2e44f3394cdfc9577d214e0', {
    maxZoom: 12,
    minZoom: 5,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

//map.locate({ setView: true, maxZoom: 14 });
//map.on('locationerror', function() {
    map.setView([54.2, -3], 6);
//});


async function getAllData() {
  const url = "https://dev-task.elancoapps.com/data/tick-sightings";
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const sightings = await response.json();
    console.log(sightings);
  }
  catch (error) {
    console.error(error.message);
  }
}

async function getUniqueCities() {
    try {
        const response = await fetch('https://dev-task.elancoapps.com/data/tick-sightings');
        const sightings = await response.json();
        
        const uniqueCities = [];
        
        sightings.forEach(sighting => {
            const cityName = sighting.location;
            
            if (!uniqueCities.includes(cityName)) {
                uniqueCities.push(cityName);
            }
        });
        
        console.log("Unique cities in dataset:", uniqueCities);
        return uniqueCities;
        
    } catch (error) {
        console.error("Error loading data:", error);
        return [];
    }
}

var cityCoordinates = {};

async function displayCityMarkers(uniqueCities) {
    try {
        uniqueCities.forEach(async city => {
            const response = await fetch('https://geocode.maps.co/search?city=' + city + '&api_key=6ae6ca6cc5a7e492422232kvl7d837e');
            const cityData = await response.json();
            if (cityData.length > 0) {
                L.marker([cityData[0].lat, cityData[0].lon]).addTo(map);
                cityCoordinates[city] = { lat: cityData[0].lat, lon: cityData[0].lon };
            }
            await sleep(300);
        });
    }
    catch (error) {
        console.error("Error displaying city markers:", error);
    }
}

async function displayCityList(uniqueCities) {
    const cityListElement = document.getElementById('city-items');

    uniqueCities.forEach(city => {
        const cityItem = document.createElement('li');
        cityItem.className = "text-xl hover:text-blue-600 cursor-pointer py-2";
        cityItem.textContent = city;
        cityItem.addEventListener('click', () => {
            const coords = cityCoordinates[city];
            if (coords) {
                map.setView([coords.lat, coords.lon], 11);
            }
        });
        cityListElement.appendChild(cityItem);
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function init() {
    const uniqueCities = await getUniqueCities();
    displayCityMarkers(uniqueCities);
    displayCityList(uniqueCities);
}

init();