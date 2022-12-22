// example from: https://github.com/decentraland/marketplace/tree/master/indexer
const addressesJson = require('../addresses.json');
const fs = require('node:fs/promises');

// const autofarmApiUrl = 'https://backend-api-prod.frfi.io';
const autofarmApiUrl = 'https://backend-api-dev.frfi.io';

const CHAIN_ID = process.env.CHAIN_ID;

const Networks = {
  56: 'bsc',
  137: 'matic',
};

const NetworkStartBlock = {
  56: 21093570,
  137: 36291664,
};

const MissedNetworksSet = new Set();

const getContracts = async () => {
  const response = await fetch(`${autofarmApiUrl}/autofarm?$limit=200&chainId=${CHAIN_ID}`);
  if (!response.ok) throw new Error('no response from vault config service');
  return response.json().then((data) => data?.data);
};

const main = async () => {
  const yamlTemplate = await fs.readFile('./subgraph.template.yaml', { encoding: 'utf-8' });
  const contracts = await getContracts();
  console.log(`fetched ${contracts.length} contracts`);
  const dataSources = [];
  contracts.forEach((contract) => {
    const { vaultAddress, chainId, token, quoteToken } = contract;
    if (MissedNetworksSet.has(chainId)) return;
    const network = Networks[chainId];
    const networkAddresses = addressesJson[chainId];
    if (!networkAddresses) {
      console.warn('no addresses for', chainId, 'network');
      MissedNetworksSet.add(chainId);
      return;
    }
    const addressConfig = networkAddresses[vaultAddress.toLowerCase()];
    if (!addressConfig) return;
    const symbol = token.symbol.toLowerCase();
    const quoteSymbol = quoteToken.symbol.toLowerCase();
    const prefix = 'Vault';
    const fallbackName =
      symbol === quoteSymbol ? `${prefix}_${symbol}` : `${prefix}_${symbol}_${quoteSymbol}`;
    const template = yamlTemplate
      .replace('{{name}}', addressConfig?.name ?? fallbackName)
      .replace('{{network}}', network)
      .replace('{{address}}', vaultAddress)
      .replace('{{startBlock}}', addressConfig?.startBlock || NetworkStartBlock[chainId]);
    dataSources.push(template);
    console.log(`address ${vaultAddress} added`);
  });
  await fs.writeFile(
    './subgraph.yaml',
    `specVersion: 0.0.5
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
