import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const corner1 = L.latLng(21.13, 115.11);
const corner2 = L.latLng(4.48, 131.00);
const bounds = L.latLngBounds(corner1, corner2);
const ADM1 = '/ADM1_withNIRsimplified.json'
const ADM2 = '/ADM2_simplified.json';
const ADM3 = '/ADM3_simplified.json';
const ADM4 = '/ADM4_simplified.json';

let currentLayer = null;
let currentRegion = null, currentRegionCode = null;
let currentLevel = 1;

let map = L.map('map', {
    center: [12,122],
    zoom: 6,
    maxBounds: bounds,
    minZoom: 6
});

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map)

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

function displayRegions(data) {
  currentLayer = L.geoJSON(data, {
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
        currentRegion = feature.properties.ADM1_EN;
        currentRegionCode = feature.properties.ADM1_PCODE;
        console.log('Clicked: ', currentRegion, currentRegionCode);
        //console.log('Provinces for ', feature.properties.ADM1_EN, ': ', feature.)
      });
      layer.on('mouseover', function(e) {
        e.target.setStyle({
          color:'yellow',
          weight: 2,
          fillOpacity: 0.4
        });
      });
      layer.on('mouseout', function(e) {
        e.target.setStyle({
          color:'gray',
          weight: 2,
          fillOpacity: 0.4
        })
      })
    }
  }).addTo(map);
}

async function init(){
  const data = await loadRegions();
  displayRegions(data);
}

init();