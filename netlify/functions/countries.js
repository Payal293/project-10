const endpoints = {
  details: 'https://countriesnow.space/api/v0.1/countries/info?returns=flag,capital',
  population: 'https://countriesnow.space/api/v0.1/countries/population',
  regions: 'https://api.first.org/data/v1/countries?limit=300',
  worldBankPopulation: 'https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2023&per_page=400',
  metadata: 'https://raw.githubusercontent.com/mledoze/countries/master/countries.json'
};

exports.handler = async function () {
  try {
    const responses = await Promise.all(Object.values(endpoints).map(url => fetch(url)));
    if (responses.some(response => !response.ok)) {
      throw new Error('A country data source returned an error');
    }

    const [detailsPayload, populationPayload, regionsPayload, worldBankPayload, metadataPayload] = await Promise.all(
      responses.map(response => response.json())
    );
    if (detailsPayload.error || populationPayload.error || regionsPayload.status !== 'OK' ||
      !Array.isArray(worldBankPayload) || worldBankPayload.length < 2 || !Array.isArray(metadataPayload)) {
      throw new Error('A country data source returned an invalid response');
    }

    const regionsByName = Object.values(regionsPayload.data || {}).reduce((regions, country) => {
      regions[country.country.toLowerCase()] = country.region;
      return regions;
    }, {});
    const populationByName = (populationPayload.data || []).reduce((populations, country) => {
      const latest = country.populationCounts?.at(-1)?.value;
      if (latest) populations[country.country.toLowerCase()] = latest;
      return populations;
    }, {});
    const worldBankPopulationByName = (worldBankPayload[1] || []).reduce((populations, country) => {
      if (country.value) populations[country.country.value.toLowerCase()] = country.value;
      return populations;
    }, {});
    const metadataByName = metadataPayload.reduce((metadata, country) => {
      metadata[country.name.common.toLowerCase()] = country;
      return metadata;
    }, {});
    const countries = (detailsPayload.data || []).map(country => ({
      name: { common: country.name },
      capital: country.capital ? [country.capital] : [],
      population: populationByName[country.name.toLowerCase()] ||
        worldBankPopulationByName[country.name.toLowerCase()] || 0,
      flags: { svg: country.flag },
      languages: metadataByName[country.name.toLowerCase()]?.languages || {},
      region: regionsByName[country.name.toLowerCase()] || metadataByName[country.name.toLowerCase()]?.region || ''
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      },
      body: JSON.stringify(countries)
    };
  } catch (error) {
    console.error('Countries function failed:', error);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Unable to retrieve country data' })
    };
  }
};