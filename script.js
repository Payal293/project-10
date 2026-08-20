let countriesData = [];
let chart;

const apiUrl = '/.netlify/functions/countries';
const browserApiUrls = {
  details: 'https://countriesnow.space/api/v0.1/countries/info?returns=flag,capital',
  regions: 'https://api.first.org/data/v1/countries?limit=300',
  population: 'https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2023&per_page=400',
  metadata: 'https://raw.githubusercontent.com/mledoze/countries/master/countries.json'
};

function normalizeCountry(country) {
  return {
    name: { common: country.name?.common || country.name || 'Unknown country' },
    capital: Array.isArray(country.capital) ? country.capital : [],
    population: Number(country.population) || 0,
    flags: country.flags || {},
    languages: country.languages || {},
    region: country.region || ''
  };
}

async function loadBrowserData() {
  const responses = await Promise.all(
    Object.values(browserApiUrls).map(url => fetch(url))
  );
  if (responses.some(response => !response.ok)) {
    throw new Error('A browser country data source returned an error');
  }

  const [detailsPayload, regionsPayload, worldBankPayload, metadataPayload] = await Promise.all(
    responses.map(response => response.json())
  );
  if (detailsPayload.error || regionsPayload.status !== 'OK' ||
    !Array.isArray(worldBankPayload) || worldBankPayload.length < 2 ||
    !Array.isArray(metadataPayload)) {
    throw new Error('A browser country data source returned an invalid response');
  }

  const regionsByName = Object.values(regionsPayload.data || {}).reduce((regions, country) => {
    regions[country.country.toLowerCase()] = country.region;
    return regions;
  }, {});
  const populationByName = (worldBankPayload[1] || []).reduce((populations, country) => {
    if (country.value) populations[country.country.value.toLowerCase()] = country.value;
    return populations;
  }, {});
  const metadataByName = metadataPayload.reduce((metadata, country) => {
    metadata[country.name.common.toLowerCase()] = country;
    return metadata;
  }, {});

  return detailsPayload.data.map(country => ({
    name: { common: country.name },
    capital: country.capital ? [country.capital] : [],
    population: populationByName[country.name.toLowerCase()] || 0,
    flags: { svg: country.flag },
    languages: metadataByName[country.name.toLowerCase()]?.languages || {},
    region: regionsByName[country.name.toLowerCase()] ||
      metadataByName[country.name.toLowerCase()]?.region || ''
  }));
}

async function loadData() {
  const container = document.getElementById('countries');
  container.textContent = 'Loading countries...';

  try {
    let data;
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`Country API returned ${res.status}`);
      data = await res.json();
      if (!Array.isArray(data)) throw new Error('Country API returned an invalid response');
    } catch (proxyError) {
      console.warn('Netlify Function unavailable; using browser data sources.', proxyError);
      data = await loadBrowserData();
    }

    countriesData = data.map(normalizeCountry);
    document.getElementById('count').textContent = countriesData.length;
    displayCountries(countriesData);
  } catch (error) {
    console.error('Unable to load country data:', error);
    container.textContent = 'Unable to load country data. Please refresh and try again.';
  }
}


function displayCountries(data) {
  const container = document.getElementById('countries');
  container.innerHTML = '';
  data.forEach(c => {
    const div = document.createElement('div');
    div.className = 'country-card';
    div.innerHTML = `
      <img src="${c.flags?.svg || c.flags?.png}" alt="Flag of ${c.name.common}">
      <h3>${c.name.common}</h3>
      <p><strong>Capital:</strong> ${c.capital?.[0] || '-'}</p>
      <p><strong>Population:</strong> ${c.population.toLocaleString()}</p>
      <p><strong>Languages:</strong> ${Object.values(c.languages || {}).join(', ')}</p>
    `;
    div.addEventListener('click', () => openChart(c));
    container.appendChild(div);
  });
}

document.getElementById('search').addEventListener('input', function (e) {
  const keyword = e.target.value.toLowerCase();
  const filtered = countriesData.filter(c =>
    c.name.common.toLowerCase().includes(keyword) ||
    (c.capital?.[0]?.toLowerCase() || '').includes(keyword) ||
    Object.values(c.languages || {}).some(lang => lang.toLowerCase().includes(keyword))
  );
  displayCountries(filtered);
});

function sortBy(type) {
  let sorted = [...countriesData];
  if (type === 'name') {
    sorted.sort((a, b) => a.name.common.localeCompare(b.name.common));
  } else if (type === 'capital') {
    sorted.sort((a, b) => (a.capital?.[0] || '').localeCompare(b.capital?.[0] || ''));
  } else if (type === 'population') {
    sorted.sort((a, b) => b.population - a.population);
  }
  displayCountries(sorted);
}

function openChart(country) {
  document.getElementById('chartPanel').style.display = 'block';
  const ctx = document.getElementById('countryChart').getContext('2d');
  const totalPopulation = countriesData.reduce((sum, c) => sum + c.population, 0);
  const restPopulation = totalPopulation - country.population;

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [country.name.common, 'Rest of the World'],
      datasets: [{
        label: 'Population',
        data: [country.population, restPopulation],
        backgroundColor: ['#FF9933', '#138808']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => value.toLocaleString()
          }
        }
      }
    }
  });
}

document.getElementById('closeChart').onclick = () => {
  document.getElementById('chartPanel').style.display = 'none';
};

window.showChart = () => {
  if (countriesData.length > 0) {
    openChart(countriesData[0]);
  }
};

loadData();


