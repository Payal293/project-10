let countriesData = [];
let chart;

async function loadData() {
  const res = await fetch('https://restcountries.com/v3.1/all?fields=name,capital,population,flags,languages');
  countriesData = await res.json();
  document.getElementById('count').textContent = countriesData.length;
  displayCountries(countriesData);
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
    div.addEventListener('click', () => openChart(c)); // 🔗 chart trigger
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

loadData();


