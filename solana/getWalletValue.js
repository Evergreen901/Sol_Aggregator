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
  // try {
  //   await Moralis.start({
  //     apiKey:
  //       'P7wifmaXjwI2qyaBuRhTBnW4aiwAu1c8iBOTfOrXNPwsPvqTJo1OzdikcVT9GOxQ',
  //   });

  //   const walletAddress = SolAddress.create(address);
  //   const network = SolNetwork.MAINNET;
  //   const response = await Moralis.SolApi.account.getNFTs({
  //     walletAddress,
  //     network,
  //   });

  //   const nfts = response?.toJSON();
  //   for (const nft of nfts) {
  //     const tokenAddress = SolAddress.create(nft.associatedTokenAddress);
  //     console.log({ tokenAddress });
  //     const tokenResponse = await Moralis.SolApi.token.getTokenPrice({
  //       tokenAddress,
  //       network,
  //     });
  //     console.log(tokenResponse?.toJSON());
  //   }
  // } catch (e) {
  //   console.error(e);
  // }

  const nfts = await metaplex.nfts().findAllByOwner({ owner: address });
  let totalValue = 0;
  for (const nft of nfts) {
    const response = await fetch(
      'https://api.blockchainapi.com/third-party-apis/2d9UPbepdAmCwqJ5cExy/v0.0.1/utility/getFloorPriceOfAttribute',
      {
        method: 'POST',
        headers: {
          APIKeyID: '2Sp3H7oVMbhLms0',
          APISecretKey: 'FOu80ZtTUaLUEc4',
        },
        body: JSON.stringify([{ collection_name: nft.name.split(' ')[0] }]),
      },
    );
    totalValue += response?.floor_price ?? 0;
  }

  return totalValue;
};

module.exports = getWalletValue;
