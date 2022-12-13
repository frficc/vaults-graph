// example from: https://github.com/decentraland/marketplace/tree/master/indexer
const addressesJson = require('../addresses.json');
const fs = require('node:fs/promises');

const autofarmApiUrl = 'https://backend-api-prod.frfi.io';

const Networks = {
  56: 'bsc',
};

const getContracts = async () => {
  const response = await fetch(`${autofarmApiUrl}/autofarm?$limit=200`);
  if (!response.ok) throw new Error('no response from vault config service');
  return response.json().then((data) => data?.data);
};

const main = async () => {
  const yamlTemplate = await fs.readFile('./subgraph.template.yaml', { encoding: 'utf-8' });
  const contracts = await getContracts();
  console.log('contracts fetched');
  const dataSources = [];
  contracts.forEach((contract) => {
    const { vaultAddress, chainId } = contract;
    const network = Networks[chainId];
    const addressConfig = addressesJson[chainId][vaultAddress];
    if (!network) {
      console.warn('no network of', chainId);
      return;
    }
    if (!addressConfig) {
      console.warn('no config of', vaultAddress);
      return;
    }
    if (!addressConfig.startBlock) {
      console.warn('no start block of', vaultAddress);
      return;
    }
    const template = yamlTemplate
      .replace('{{name}}', addressConfig.name)
      .replace('{{network}}', network)
      .replace('{{address}}', vaultAddress)
      .replace('{{startBlock}}', addressConfig.startBlock);
    dataSources.push(template);
  });
  await fs.writeFile(
    './subgraph.yaml',
    `
specVersion: 0.0.5
schema:
  file: ./schema.graphql
dataSources:
${dataSources.join('\n')}
`,
    { encoding: 'utf-8' },
  );
  console.log('done');
};

main();
