const {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
} = require('@metaplex-foundation/js');
const { Connection, clusterApiUrl, Keypair } = require('@solana/web3.js');

const connection = new Connection(clusterApiUrl('mainnet-beta'));
const wallet = Keypair.generate();

const metaplex = Metaplex.make(connection)
  .use(keypairIdentity(wallet))
  .use(bundlrStorage());

// const Moralis = require('moralis').default;
// const { SolNetwork, SolAddress } = require('@moralisweb3/sol-utils');

// const sleep = (milliseconds) => {
//   return new Promise((resolve) => setTimeout(resolve, milliseconds));
// };

const getWalletValue = async (address) => {
  const nfts = await get(
    `https://nft.yaku.ai/api/magiceden/v2/wallets/${address}/tokens`,
  );

  let totalValue = 0;

  for (const nft of nfts) {
    const tokenStats = nft.collectionName
      ? await get(
          `https://nft.yaku.ai/api/magiceden//v2/collections/${nft.collectionName}/stats`,
        )
      : {};
    totalValue += tokenStats.floorPrice;
  }

  return totalValue;
};

const get = async (url) => {
  try {
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });

    const text = await resp.text();
    return JSON.parse(text);
  } catch {
    return {};
  }
};

module.exports = getWalletValue;
