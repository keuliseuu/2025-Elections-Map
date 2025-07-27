import { mapState, displayRegions, displayProvinces, displayCities, displayBarangays } from "./map";

let label, selectedColors;

const disableButton = document.getElementById('disableChoropleth');
const activeCandidateDiv = document.getElementById('active-candidate-nav');
const colorScheme = document.getElementById('color-selection');
const tooltipLookup = {};
const choroplethStatus = { status: false, };
const colorScale = {
  YlOrRd: ['#ffffb2','#fed976','#feb24c','#fd8d3c','#fc4e2a','#e31a1c','#b10026'],
  RdPu: ['#feebe2','#fcc5c0','#fa9fb5','#f768a1','#dd3497','#ae017e','#7a0177'],
  BuGn: ['#edf8fb','#ccece6','#99d8c9','#66c2a4','#41ae76','#238b45','#005824'],
  BuPu: ['#edf8fb','#bfd3e6','#9ebcda','#8c96c6','#8c6bb1','#88419d','#6e016b'],
  GnBu: ['#f0f9e8','#ccebc5','#a8ddb5','#7bccc4','#4eb3d3','#2b8cbe','#08589e'],
  OrRd: ['#fef0d9','#fdd49e','#fdbb84','#fc8d59','#ef6548','#d7301f','#990000'],
  PuBu: ['#f1eef6','#d0d1e6','#a6bddb','#74a9cf','#3690c0','#0570b0','#034e7b'],
  PuBuGn: ['#f6eff7','#d0d1e6','#a6bddb','#67a9cf','#3690c0','#02818a','#016450'],
};

async function displayChoropleth(currentLayer, candidateId) {
  choroplethStatus.status = true;
  showDisableButton();
  showActiveCandidate();
  showColorSelection();

  const params = new URLSearchParams({
    candidate_id: candidateId,
    current_level: mapState.currentLevel,
    parent_code: getCurrentParentCode()
  });
  const votesData = await fetch(`/api/votes?${params}`).then(response => response.json());
  // console.log(votesData);
  // console.log(params)

  const voteLookup = {};

  votesData.forEach(item => {
    let admCode;

    switch (mapState.currentLevel) {
    case 1:
        admCode = item.adm1_pcode;
        break;
    case 2:
        admCode = item.adm2_pcode;
        break;
    case 3:
        admCode = item.adm3_pcode;
        break;
    case 4:
        admCode = item.adm4_pcode;
        break;
    case 5:
        admCode = item.adm4_pcode;
        break;
    default:
        console.warn('Unknown level:', mapState.currentLevel);
        return;
    }

    voteLookup[admCode] = item.candidate_votes;
    tooltipLookup[admCode] = item;
  });

  // console.log("Debug", tooltipLookup['PH01']);
  let selectedColorScheme = colorScheme.value;
  selectedColors = colorScale[selectedColorScheme];
  const maxVotes = Math.max(...votesData.map(d => d.candidate_votes));

  const getColor = (votes) => {
    if (maxVotes === 0) return '#ffffff';

    const percentage = votes / maxVotes;
    const index = Math.floor(percentage * selectedColors.length);
    return selectedColors[Math.min(index, selectedColors.length - 1)];
  };
    
  currentLayer.setStyle((feature) => {
    const admCode = getLocationCode(feature.properties);
    const votes = voteLookup[admCode] || 0;
    
    return {
      fillColor: getColor(votes),
      fillOpacity: 0.7,
      color: '#000',
      weight: 2
    };
  });
  
  currentLayer.eachLayer(function(featureLayer) {
    const pcode = featureLayer.feature.properties[`ADM${mapState.currentLevel}_PCODE`];
    const data = tooltipLookup[pcode];
    const parsedVotes = parseInt(data.candidate_votes);

    label = featureLayer.feature.properties[`ADM${mapState.currentLevel}_EN`];
    if(data) {
      label += `<br>Candidate: ${data.candidate_name}<br>Votes: ${parsedVotes.toLocaleString('en')}`;
    }
    activeCandidate(data.candidate_name);
    featureLayer.setTooltipContent(label)
  })
  // console.log("Debug 2", currentLayer);
}

function getCurrentParentCode() {
  switch(mapState.currentLevel) {
    case 2: return mapState.selectedRegionCode;
    case 3: return mapState.selectedProvinceCode;
    case 4: return mapState.selectedCityCode;
    case 5: return mapState.selectedCityCode;
    default: return null;
  }
}

function getLocationCode(properties) {
  switch(mapState.currentLevel) {
    case 1: return properties.ADM1_PCODE;
    case 2: return properties.ADM2_PCODE;
    case 3: return properties.ADM3_PCODE;
    case 4: return properties.ADM4_PCODE;
    case 5: return properties.ADM4_PCODE;
  }
}

function activeCandidate(candidate) {
  activeCandidateDiv.textContent = `Active Candidate Choropleth: ${candidate}`;
}

//Disable button
function showDisableButton() {
  disableButton.style.display = 'block';
}

function hideDisableButton() {
  disableButton.style.display = 'none';
}

//Active candidate button
function showActiveCandidate() {
  activeCandidateDiv.style.display = 'block';
}

function hideActiveCandidate() {
  activeCandidateDiv.textContent = '';
  activeCandidateDiv.style.display = 'none';
}

//Color selection dropdown
function showColorSelection() {
  colorScheme.style.display = 'block';
}

function hideColorSelection() {
  colorScheme.style.display = 'none';
}

function hideElements() {
  hideDisableButton();
  hideActiveCandidate();
  hideColorSelection();
}

disableButton.addEventListener('click', function() {
  hideElements();
  switch(mapState.currentLevel) {
    case 1: displayRegions(); break;
    case 2: displayProvinces(); break;
    case 3: displayCities(); break;
    case 4: displayBarangays(); break;
    case 5: displayBarangays(); break;
  }
})

export { choroplethStatus, tooltipLookup, displayChoropleth, hideElements};