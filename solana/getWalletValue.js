const { LAMPORTS_PER_SOL } = require('@solana/web3.js');

const getWalletValue = async (address) => {
  let nfts = null;
  try {
    nfts = JSON.parse(
      JSON.stringify(
        await get(
          `https://nft.yaku.ai/api/magiceden/v2/wallets/${address}/tokens`,
        ),
      ),
    );

    let totalValue = 0;

    for (const nft of nfts) {
      const tokenStats = nft.collectionName
        ? await get(
            `https://nft.yaku.ai/api/magiceden//v2/collections/${nft.collectionName}/stats`,
          )
        : {};
      totalValue += tokenStats?.floorPrice ?? 0;
    }

    return totalValue / LAMPORTS_PER_SOL;
  } catch (err) {
    console.error({ err, address, nfts });
    return 0;
  }
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
