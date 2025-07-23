// import { mapState } from './map.js';

function showLoadingRank() {
  document.getElementById('loadingRank').style.display = 'block';
}

function hideLoadingRank() {
  document.getElementById('loadingRank').style.display = 'none';
}

function createCandidateRow(candidate, rank, totalVotes) {
  const percentage = totalVotes > 0 ? (candidate.total_votes / totalVotes * 100).toFixed(1) : 0;
  const isTop12 = rank <= 12;
  const barColor = isTop12 ? 'bg-success' : 'bg-primary';
  const circleColor = isTop12 ? 'bg-success' : 'bg-primary';
  
  const container = document.createElement('div');
  container.className = 'card mb-2 shadow-sm';
  container.innerHTML = `
    <div class="card-body p-3">
      <div class="d-flex align-items-center">
        <div class="me-3">
          <div class="rounded-circle ${circleColor} text-white d-flex align-items-center justify-content-center" style="width: 35px; height: 35px; font-weight: bold;">
            ${rank}
          </div>
        </div>
        <div class="me-3">
          <img src="${candidate.photo_url}" alt="${candidate.name}" class="rounded-circle" style="width: 50px; height: 50px; object-fit: cover;">
        </div>
        <div class="flex-grow-1">
          <div><strong>${candidate.name}</strong></div>
          <div class="text-muted small">${candidate.party}</div>
          <div class="progress mt-1" style="height: 8px;">
            <div class="progress-bar ${barColor}" style="width: ${percentage}%;"></div>
          </div>
        </div>
        <div class="text-end ms-3" style="min-width: 80px;">
          <div><strong>${candidate.total_votes.toLocaleString()}</strong></div>
          <div class="text-muted small">${percentage}%</div>
        </div>
      </div>
    </div>
  `;
  return container;
}

async function loadCandidateRanks(code = null) {
  try {
    showLoadingRank();
    let url;
    if (code) {
        url = `/api/candidates?code=${code}`;
    } else {
        url = `/api/candidates`;
    }

    const response = await fetch(url);
    const candidates = await response.json();
    if (candidates) {
      hideLoadingRank();
      renderCandidateRanks(candidates);
    }
  } catch (err) {
    console.error('Failed to fetch candidate ranks:', err);
  }
}

function renderCandidateRanks(candidates) {
  const container = document.getElementById('candidate-ranks');
  container.innerHTML = '';

  const totalVotes = candidates.reduce((sum, c) => sum + c.total_votes, 0);

//   let locationName = 'National Results';
//   if (mapState.currentLevel === 1) locationName = mapState.selectedRegion;
//   else if (mapState.currentLevel === 2) locationName = mapState.selectedProvince;
//   else if (mapState.currentLevel === 3) locationName = mapState.selectedCity;
//   else if (mapState.currentLevel === 4) locationName = mapState.selectedBarangay;
  
//   document.getElementById('dynamic-header').textContent = `${locationName} - ${totalVotes.toLocaleString()}`;

  candidates.forEach((candidate, index) => {
    const row = createCandidateRow(candidate, index + 1, totalVotes);
    container.appendChild(row);
  });
}

export default {loadCandidateRanks};