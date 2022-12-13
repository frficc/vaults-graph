// example from: https://github.com/decentraland/marketplace/tree/master/indexer

const autofarmApiUrl = 'https://backend-api-prod.frfi.io';

const getContracts = async () => {
  const response = await fetch(`${baseUrl}/autofarm?$limit=200&${params}`);
  if (!response.ok) throw new Error('no response from vault config service');
  return response.json().then((data) => data?.data);
};
