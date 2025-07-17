import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import candidateRankModule from './candidateRank.js';


const corner1 = L.latLng(21.13, 115.11);
const corner2 = L.latLng(4.48, 131.00);
const bounds = L.latLngBounds(corner1, corner2);

const ADM1 = '/ADM1_withNIRsimplified.json'
const ADM2 = '/ADM2_simplified.json';
const ADM3 = '/ADM3_updated.geojson';
const ADM4 = '/ADM4_updated.geojson';
//JSON data
let regionData = null;
let provinceData = null;
let citiesData = null;
let barangayData = null;

let currentLayer;

let filteredProvince = null;
let filteredCities = null;
let filteredBarangays = null;

const mapState = {
  currentLevel: null,
  selectedRegion: null,
  selectedRegionCode: null,
  selectedProvince: null,
  selectedProvinceCode: null,
  selectedCity: null,
  selectedCityCode: null,
  selectedBarangay: null,
  selectedBarangayCode: null
};

let map = L.map('map', {
    center: [12,122],
    zoom: 6,
    maxBounds: bounds,
    minZoom: 6,
    zoomControl: false
});

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map)

//Interaction
function mouseOver(e) {
  const layer = e.target;
  layer.on('mouseover', function(e) {
    e.target.setStyle({
      color:'yellow',
      weight: 2,
      fillOpacity: 0.4
    });
  });
}

function mouseOut(e) {
  const layer = e.target;
  e.target.setStyle({
    color:'gray',
    weight: 2,
    fillOpacity: 0.4
  })
}

// Load administrative levels 1-4
async function loadRegions() {
  try{
    const response = await fetch(ADM1);
    const data = await response.json();
    console.log('Loaded regions: ', data.features.length);
    return data;
  }
  catch(error){
    console.error('Failed to load regions: ', error);
  }
}

async function loadProvinces() {
  try{
    const response = await fetch(ADM2);
    const data = await response.json();
    console.log('Loaded provinces: ', data.features.length);
    return data;
  }
  catch(error){
    console.error('Failed to load provinces: ', error);
  }
}

async function loadCities() {
  try{
    const response = await fetch(ADM3);
    const data = await response.json();
    console.log('Loaded cities:', data.features.length);
    return data;
  }
  catch(error) {
    console.error('Failed to load cities: ', error);
  }
}

async function loadBarangays() {
  try{
    const response = await fetch(ADM4);
    const data = await response.json();
    console.log("Loaded barangays: ", data.features.length);
    return data;
  }
  catch(error) {
    console.error('Failed to load barangays: ', error);
  }
}

async function displayRegions() {
  if (!provinceData) provinceData = await loadProvinces(ADM2);
  candidateRankModule.loadCandidateRanks();
  currentLayer = L.geoJSON(regionData, {
    style: {
      color:'gray',
      weight: 2,
      fillOpacity: 0.4
    },
    onEachFeature: function(feature, layer) {
      let label = feature.properties.ADM1_EN;
      layer.bindTooltip(label, {
        permanent: false,
        direction: "auto",
        opacity: 0.9,
        sticky: true,
        className: "region-tooltip"
      });
      layer.on('click', function(e) {
        mapState.currentLevel = 1;
        mapState.selectedRegion = feature.properties.ADM1_EN;
        mapState.selectedRegionCode = feature.properties.ADM1_PCODE;
        console.log('Clicked: ', mapState.selectedRegion, mapState.selectedRegionCode);
  
        filteredProvince = provinceData.features.filter(feature => 
          feature.properties.ADM1_PCODE === mapState.selectedRegionCode
        )
        console.log('Filtered: ', filteredProvince.length);
        candidateRankModule.loadCandidateRanks(mapState.selectedRegionCode);
        renderBreadcrumb();
        displayProvinces();
      });
      layer.on({
        mouseover: mouseOver,
        mouseout: mouseOut
      });
    }
  }).addTo(map);
  map.fitBounds(currentLayer.getBounds());
}

async function displayProvinces() {
  if (!citiesData) citiesData = await loadCities(ADM3);
  console.log('Current level', mapState.currentLevel);
  if(currentLayer){
    map.removeLayer(currentLayer);
  }
  currentLayer = L.geoJSON(filteredProvince, {
    style: {
      color:'gray',
      weight: 2,
      fillOpacity: 0.4
    },
    onEachFeature: function(feature, layer) {
      let label = feature.properties.ADM2_EN;
      layer.bindTooltip(label, {
        permanent: false,
        direction: "auto",
        opacity: 0.9,
        sticky: true,
        className: "province-tooltip"
      });
      layer.on('click', function(e) {
        mapState.currentLevel = 2;
        mapState.selectedProvince = feature.properties.ADM2_EN;
        mapState.selectedProvinceCode = feature.properties.ADM2_PCODE;
        console.log('Clicked: ', mapState.selectedProvince, mapState.selectedProvinceCode);

        filteredCities = citiesData.features.filter(feature => 
          feature.properties.ADM2_PCODE === mapState.selectedProvinceCode
        )
        console.log('Filtered: ', filteredCities.length);
        candidateRankModule.loadCandidateRanks(mapState.selectedProvinceCode);
        renderBreadcrumb();
        displayCities();
      });
      layer.on({
        mouseover: mouseOver,
        mouseout: mouseOut
      });
    }
  }).addTo(map);
  map.fitBounds(currentLayer.getBounds());
}

async function displayCities() {
  if (!barangayData) barangayData = await loadBarangays(ADM4);
  if(currentLayer){
    map.removeLayer(currentLayer);
  }
  currentLayer = L.geoJSON(filteredCities, {
    style: {
      color:'gray',
      weight: 2,
      fillOpacity: 0.4
    },
    onEachFeature: function(feature, layer) {
      let label = feature.properties.ADM3_EN;
      layer.bindTooltip(label, {
        permanent: false,
        direction: "auto",
        opacity: 0.9,
        sticky: true,
        className: "city/municipality-tooltip"
      });
      layer.on('click', function(e) {
        mapState.currentLevel = 3;
        mapState.selectedCity = feature.properties.ADM3_EN;
        mapState.selectedCityCode = feature.properties.ADM3_PCODE;
        console.log('Clicked: ', mapState.selectedCity, mapState.selectedCityCode);

        filteredBarangays = barangayData.features.filter(feature => 
          feature.properties.ADM3_PCODE === mapState.selectedCityCode
        )
        console.log('Filtered: ', filteredBarangays.length);
        candidateRankModule.loadCandidateRanks(mapState.selectedCityCode);
        renderBreadcrumb();
        displayBarangays();
      });
      layer.on({
        mouseover: mouseOver,
        mouseout: mouseOut
      });
    }
  }).addTo(map);
  map.fitBounds(currentLayer.getBounds());
}

async function displayBarangays() {
  if(currentLayer){
    map.removeLayer(currentLayer);
  }
  currentLayer = L.geoJSON(filteredBarangays, {
    style: {
      color:'gray',
      weight: 2,
      fillOpacity: 0.4
    },
    onEachFeature: function(feature, layer) {
      let label = feature.properties.ADM4_EN;
      layer.bindTooltip(label, {
        permanent: false,
        direction: "auto",
        opacity: 0.9,
        sticky: true,
        className: "barangay-tooltip"
      });
      layer.on('click', function(e) {
        mapState.currentLevel = 4;
        mapState.selectedBarangay = feature.properties.ADM4_EN;
        mapState.selectedBarangayCode = feature.properties.ADM4_PCODE;
        console.log('Clicked: ', mapState.selectedBarangay, mapState.selectedBarangayCode);
        candidateRankModule.loadCandidateRanks(mapState.selectedBarangayCode);
        renderBreadcrumb();
      });
      layer.on({
        mouseover: mouseOver,
        mouseout: mouseOut
      });
    }
  }).addTo(map);
  map.fitBounds(currentLayer.getBounds());
}

function goToLevel(level) {
  if (level === 0) {
    mapState.currentLevel = 0;
    mapState.selectedRegion = null;
    mapState.selectedRegionCode = null;
    mapState.selectedProvince = null;
    mapState.selectedProvinceCode = null;
    mapState.selectedCity = null;
    mapState.selectedCityCode = null;
    mapState.selectedBarangay = null;
    mapState.selectedBarangayCode = null;

    if (currentLayer) map.removeLayer(currentLayer);

    displayRegions();
    renderBreadcrumb();
  }
  else if (level === 1) {
    mapState.currentLevel = 1;
    mapState.selectedProvince = null;
    mapState.selectedProvinceCode = null;
    mapState.selectedCity = null;
    mapState.selectedCityCode = null;
    mapState.selectedBarangay = null;
    mapState.selectedBarangayCode = null;

    if (currentLayer) map.removeLayer(currentLayer);

    displayProvinces();
    renderBreadcrumb();
  }
  else if (level === 2) {
    mapState.currentLevel = 2;
    mapState.selectedCity = null;
    mapState.selectedCityCode = null;
    mapState.selectedBarangay = null;
    mapState.selectedBarangayCode = null;    

    if (currentLayer) map.removeLayer(currentLayer);

    displayCities();
    renderBreadcrumb();
  }
  else if (level === 3) {
    mapState.currentLevel = 3;
    mapState.selectedBarangay = null;
    mapState.selectedBarangayCode = null;   

    if (currentLayer) map.removeLayer(currentLayer);

    displayBarangays();
    renderBreadcrumb();
  }
  else if (level === 4) {
    mapState.currentLevel = 4;

    if (currentLayer) map.removeLayer(currentLayer);

    renderBreadcrumb();
  }
}

//breadcrumb

function renderBreadcrumb() {
  const breadcrumb = document.querySelector('#breadcrumb');
  breadcrumb.innerHTML = '';

  const currentLevel = mapState.currentLevel;

  breadcrumb.appendChild(
    createBreadcrumbItem('Philippines', 0, currentLevel > 0)
  );

  if (mapState.selectedRegion) {
    breadcrumb.appendChild(
      createBreadcrumbItem(mapState.selectedRegion, 1, currentLevel > 1)
    );
  }

  if (mapState.selectedProvince) {
    breadcrumb.appendChild(
      createBreadcrumbItem(mapState.selectedProvince, 2, currentLevel > 2)
    );
  }

  if (mapState.selectedCity) {
    breadcrumb.appendChild(
      createBreadcrumbItem(mapState.selectedCity, 3, currentLevel > 3)
    );
  }

  if (mapState.selectedBarangay) {
    breadcrumb.appendChild(
      createBreadcrumbItem(mapState.selectedBarangay, 4, false)
    );
  }
}

function createBreadcrumbItem(label, level, isLink) {
  const li = document.createElement('li');
  li.classList.add('breadcrumb-item');
  
  if (isLink) {
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = label;
    a.dataset.level = level;
    a.addEventListener('click', () => goToLevel(level));
    li.appendChild(a);
  } else {
    li.textContent = label;
  }

  return li;
}

async function init(){
  regionData = await loadRegions();
  displayRegions();
  renderBreadcrumb();
}

init();

export { mapState };