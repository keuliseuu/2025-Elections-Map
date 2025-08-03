import { mapState, displayRegions, displayProvinces, displayCities, displayBarangays } from "./map";
import { hideLoadingRank } from "./candidateRank";
import { jenks } from "simple-statistics";

let label, selectedColors;

const disableButton = document.getElementById('disableChoropleth');
const activeCandidateDiv = document.getElementById('active-candidate-nav');
const colorScheme = document.getElementById('color-selection');
const tooltipLookup = {};
const choroplethStatus = { status: false, };

const colorScale = {
  YlOrRd: {2: ['rgb(255,237,160)', 'rgb(240,59,32)'], 3: ['rgb(255,237,160)', 'rgb(254,178,76)', 'rgb(240,59,32)'], 4: ['rgb(255,255,178)', 'rgb(254,204,92)', 'rgb(253,141,60)', 'rgb(227,26,28)'], 5: ['rgb(255,255,178)', 'rgb(254,204,92)', 'rgb(253,141,60)', 'rgb(240,59,32)', 'rgb(189,0,38)'], 6: ['rgb(255,255,178)', 'rgb(254,217,118)', 'rgb(254,178,76)', 'rgb(253,141,60)', 'rgb(240,59,32)', 'rgb(189,0,38)'], 7: ['rgb(255,255,178)', 'rgb(254,217,118)', 'rgb(254,178,76)', 'rgb(253,141,60)', 'rgb(252,78,42)', 'rgb(227,26,28)', 'rgb(177,0,38)']},
  RdPu:  {2: ['rgb(253,224,221)', 'rgb(197,27,138)'], 3: ['rgb(253,224,221)', 'rgb(250,159,181)', 'rgb(197,27,138)'], 4: ['rgb(254,235,226)', 'rgb(251,180,185)', 'rgb(247,104,161)', 'rgb(174,1,126)'], 5: ['rgb(254,235,226)', 'rgb(251,180,185)', 'rgb(247,104,161)', 'rgb(197,27,138)', 'rgb(122,1,119)'], 6: ['rgb(254,235,226)', 'rgb(252,197,192)', 'rgb(250,159,181)', 'rgb(247,104,161)', 'rgb(197,27,138)', 'rgb(122,1,119)'], 7: ['rgb(254,235,226)', 'rgb(252,197,192)', 'rgb(250,159,181)', 'rgb(247,104,161)', 'rgb(221,52,151)', 'rgb(174,1,126)', 'rgb(122,1,119)']},
  BuGn:  {2: ['rgb(229,245,249)', 'rgb(44,162,95)'], 3: ['rgb(229,245,249)', 'rgb(153,216,201)', 'rgb(44,162,95)'], 4: ['rgb(237,248,251)', 'rgb(178,226,226)', 'rgb(102,194,164)', 'rgb(35,139,69)'], 5: ['rgb(237,248,251)', 'rgb(178,226,226)', 'rgb(102,194,164)', 'rgb(44,162,95)', 'rgb(0,109,44)'], 6: ['rgb(237,248,251)', 'rgb(204,236,230)', 'rgb(153,216,201)', 'rgb(102,194,164)', 'rgb(44,162,95)', 'rgb(0,109,44)'], 7: ['rgb(237,248,251)', 'rgb(204,236,230)', 'rgb(153,216,201)', 'rgb(102,194,164)', 'rgb(65,174,118)', 'rgb(35,139,69)', 'rgb(0,88,36)']},
  BuPu:  {2: ['rgb(224,236,244)', 'rgb(136,86,167)'], 3: ['rgb(224,236,244)', 'rgb(158,188,218)', 'rgb(136,86,167)'], 4: ['rgb(237,248,251)', 'rgb(179,205,227)', 'rgb(140,150,198)', 'rgb(136,65,157)'], 5: ['rgb(237,248,251)', 'rgb(179,205,227)', 'rgb(140,150,198)', 'rgb(136,86,167)', 'rgb(129,15,124)'], 6: ['rgb(237,248,251)', 'rgb(191,211,230)', 'rgb(158,188,218)', 'rgb(140,150,198)', 'rgb(136,86,167)', 'rgb(129,15,124)'], 7: ['rgb(237,248,251)', 'rgb(191,211,230)', 'rgb(158,188,218)', 'rgb(140,150,198)', 'rgb(140,107,177)', 'rgb(136,65,157)', 'rgb(110,1,107)']},
  GnBu:  {2: ['rgb(224,243,219)', 'rgb(67,162,202)'], 3: ['rgb(224,243,219)', 'rgb(168,221,181)', 'rgb(67,162,202)'], 4: ['rgb(240,249,232)', 'rgb(186,228,188)', 'rgb(123,204,196)', 'rgb(43,140,190)'], 5: ['rgb(240,249,232)', 'rgb(186,228,188)', 'rgb(123,204,196)', 'rgb(67,162,202)', 'rgb(8,104,172)'], 6: ['rgb(240,249,232)', 'rgb(204,235,197)', 'rgb(168,221,181)', 'rgb(123,204,196)', 'rgb(67,162,202)', 'rgb(8,104,172)'], 7: ['rgb(240,249,232)', 'rgb(204,235,197)', 'rgb(168,221,181)', 'rgb(123,204,196)', 'rgb(78,179,211)', 'rgb(43,140,190)', 'rgb(8,88,158)']},
  OrRd:  {2: ['rgb(254,232,200)', 'rgb(227,74,51)'], 3: ['rgb(254,232,200)', 'rgb(253,187,132)', 'rgb(227,74,51)'], 4: ['rgb(254,240,217)', 'rgb(253,204,138)', 'rgb(252,141,89)', 'rgb(215,48,31)'], 5: ['rgb(254,240,217)', 'rgb(253,204,138)', 'rgb(252,141,89)', 'rgb(227,74,51)', 'rgb(179,0,0)'], 6: ['rgb(254,240,217)', 'rgb(253,212,158)', 'rgb(253,187,132)', 'rgb(252,141,89)', 'rgb(227,74,51)', 'rgb(179,0,0)'], 7: ['rgb(254,240,217)', 'rgb(253,212,158)', 'rgb(253,187,132)', 'rgb(252,141,89)', 'rgb(239,101,72)', 'rgb(215,48,31)', 'rgb(153,0,0)']},
  PuBu:  {2: ['rgb(236,231,242)', 'rgb(43,140,190)'], 3: ['rgb(236,231,242)', 'rgb(166,189,219)', 'rgb(43,140,190)'], 4: ['rgb(241,238,246)', 'rgb(189,201,225)', 'rgb(116,169,207)', 'rgb(5,112,176)'], 5: ['rgb(241,238,246)', 'rgb(189,201,225)', 'rgb(116,169,207)', 'rgb(43,140,190)', 'rgb(4,90,141)'], 6: ['rgb(241,238,246)', 'rgb(208,209,230)', 'rgb(166,189,219)', 'rgb(116,169,207)', 'rgb(43,140,190)', 'rgb(4,90,141)'], 7: ['rgb(241,238,246)', 'rgb(208,209,230)', 'rgb(166,189,219)', 'rgb(116,169,207)', 'rgb(54,144,192)', 'rgb(5,112,176)', 'rgb(3,78,123)']},
  PuBuGn:  {2: ['rgb(236,226,240)', 'rgb(28,144,153)'], 3: ['rgb(236,226,240)', 'rgb(166,189,219)', 'rgb(28,144,153)'], 4: ['rgb(246,239,247)', 'rgb(189,201,225)', 'rgb(103,169,207)', 'rgb(2,129,138)'], 5: ['rgb(246,239,247)', 'rgb(189,201,225)', 'rgb(103,169,207)', 'rgb(28,144,153)', 'rgb(1,108,89)'], 6: ['rgb(246,239,247)', 'rgb(208,209,230)', 'rgb(166,189,219)', 'rgb(103,169,207)', 'rgb(28,144,153)', 'rgb(1,108,89)'], 7: ['rgb(246,239,247)', 'rgb(208,209,230)', 'rgb(166,189,219)', 'rgb(103,169,207)', 'rgb(54,144,192)', 'rgb(2,129,138)', 'rgb(1,100,80)']},
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
  console.log(selectedColorScheme);

  const votes = votesData.map(d => parseInt(d.candidate_votes,10));
  // console.log('Votes array:', votes);
  // console.log('Array length:', votes.length);

  let jenksBreaks, getColor;  

  if (votes.length < 7) {
    selectedColors = colorScale[selectedColorScheme][votes.length];
    jenksBreaks = jenks(votes, votes.length);
    console.log(jenksBreaks);
    console.log(selectedColors.length-1);
    console.log(selectedColors);
      getColor = (voteCount) => {
        for (let i = 0; i < jenksBreaks.length - 1; i++) {
        if (voteCount < jenksBreaks[i + 1]) {
          return selectedColors[i];
        }
      }
      return selectedColors[selectedColors.length - 1];
    };
  }
  else {
    selectedColors = colorScale[selectedColorScheme][7];
    jenksBreaks = jenks(votes, 7);
    console.log(jenksBreaks);
    console.log(selectedColors);
    getColor = (voteCount) => {
      console.log('Vote value causing issue:', voteCount);
      for (let i = 0; i < jenksBreaks.length - 1; i++) {
        console.log(`Checking if ${voteCount} < ${jenksBreaks[i + 1]}`);
        if (voteCount < jenksBreaks[i + 1]) {
          console.log(`Returning color index ${i}`);
          return selectedColors[i];
        }
      }
      return selectedColors[selectedColors.length - 1];
    };
  }
    
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
    try{
      const pcode = featureLayer.feature.properties[`ADM${mapState.currentLevel}_PCODE`];
      const data = tooltipLookup[pcode];
      const parsedVotes = parseInt(data.candidate_votes);

      label = featureLayer.feature.properties[`ADM${mapState.currentLevel}_EN`];
      if(data) {
        label += `<br>Candidate: ${data.candidate_name}<br>Votes: ${parsedVotes.toLocaleString('en')}`;
      }
      activeCandidate(data.candidate_name);
      featureLayer.setTooltipContent(label)
    }
    catch(error){
      console.log('No results found for location');
      console.log(error);
      const noResultsModal = new bootstrap.Modal(document.getElementById('noResultsModal'));
      noResultsModal.show();
    }
  })
  hideLoadingRank();
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
  activeCandidateDiv.classList.add('d-flex');
  activeCandidateDiv.style.display = 'block';
}

function hideActiveCandidate() {
  activeCandidateDiv.classList.remove('d-flex');
  activeCandidateDiv.style.display = 'none';
  activeCandidateDiv.textContent = '';
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