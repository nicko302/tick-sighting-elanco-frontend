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

var citySightings = {};

async function getUniqueCities() {
    try {
        const response = await fetch('https://dev-task.elancoapps.com/data/tick-sightings');
        const sightings = await response.json();
        
        sightings.forEach(sighting => {
            const cityName = sighting.location;
            
            if (citySightings[cityName]) {
                citySightings[cityName]++;
            } else {
                citySightings[cityName] = 1;
            }
        });
        
        const uniqueCities = Object.keys(citySightings);
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
                const marker = L.marker([cityData[0].lat, cityData[0].lon], { riseOnHover: true, title: city }).addTo(map);
                cityCoordinates[city] = { lat: cityData[0].lat, lon: cityData[0].lon };
                marker.on('click', () => {
                    map.setView([cityCoordinates[city].lat, cityCoordinates[city].lon], 11);
                    displayCityDetails(city);
                });
            }
            await sleep(300);
        });
    }
    catch (error) {
        console.error("Error displaying city markers:", error);
    }
}

function getBadgeColour(sightings) {
    if (sightings >= 80) {
        return "bg-red-100 text-red-800";     // 80<
    } else if (sightings >= 60) {
        return "bg-orange-100 text-orange-800"; // 60-79
    } else {
        return "bg-green-100 text-green-800";   // >60
    }
}

async function displayCityList(uniqueCities) {
    map.setView([54.2, -3], 6);
    const cityContainer = document.getElementById('city-content');
    cityContainer.classList.remove('opacity-100');
    cityContainer.classList.add('opacity-0');
    await sleep(200);
    cityContainer.innerHTML = `
        <h1 class="font-bold text-2xl mb-2 flex-shrink-0">Cities</h1>
        <ul id="city-items" class="list-none pl-5 overflow-y-auto flex-grow"></ul>
    `;

    const cityListElement = document.getElementById('city-items');

    uniqueCities.sort((a, b) => citySightings[b] - citySightings[a]);
    uniqueCities.forEach(city => {
        const sightingsColour = getBadgeColour(citySightings[city]);
        const cityItem = document.createElement('li');
        cityItem.className = "text-xl hover:text-blue-600 cursor-pointer py-2";
        cityItem.textContent = city;
        cityItem.innerHTML += `<span class="text-sm ${sightingsColour} ml-3 rounded-lg py-1 px-1">${citySightings[city]}</span>`;
        cityItem.addEventListener('click', () => {
            const coords = cityCoordinates[city];
            map.setView([coords.lat, coords.lon], 11);
            displayCityDetails(city);
        });
        cityListElement.appendChild(cityItem);
    });
    cityContainer.classList.remove('opacity-0');
}

// short delay to prevent hitting the geocoding API too quickly
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// display city details when a city is clicked
async function displayCityDetails(city) {
    const cityContainer = document.getElementById('city-content');
    cityContainer.classList.remove('opacity-100');
    cityContainer.classList.add('opacity-0');
    await sleep(200);

    const sightingsCount = citySightings[city];
    cityContainer.innerHTML = `
        <div class="flex justify-between items-center">
            <h2 class="font-bold text-2xl mb-2">${city}</h2>
            <button class="w-[5rem] bg-blue-500 text-white px-3 py-1 mb-2 rounded-lg hover:bg-blue-600" onclick="displayCityList(Object.keys(citySightings))">Back</button>
        </div>
        <p class="bg-blue-100 text-blue-800 py-2 px-4 rounded-lg"><b>${sightingsCount}</b> total sightings</p>
    `;

    // retrieve and display the sightings for the selected city
    const response = await fetch('https://dev-task.elancoapps.com/data/tick-sightings/city/' + encodeURIComponent(city));
    const sightings = await response.json();
    sightings.sort((a, b) => new Date(b.date) - new Date(a.date));

    const sightingsList = document.createElement('ul');
    sightingsList.className = "list-none pl-2 overflow-y-auto flex-grow";
    cityContainer.appendChild(sightingsList);

    sightings.forEach(sighting => {
        const date = new Date(sighting.date);

        const sightingItem = document.createElement('li');
        sightingItem.className = "text-lg py-1";
        sightingItem.innerHTML = ` <span class="font-normal text-md"><span class="font-semibold text-lg">${sighting.species}</span> - ${sighting.latinName}</span>`;
        sightingItem.innerHTML += `<br><p class="text-sm text-gray-600 m-0">${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}</p>`;

        sightingsList.appendChild(sightingItem);
    });

    cityContainer.classList.remove('opacity-0');
}


// initialisation function to load and display data
async function init() {
    const uniqueCities = await getUniqueCities();
    displayCityMarkers(uniqueCities);
    displayCityList(uniqueCities);
}

init();