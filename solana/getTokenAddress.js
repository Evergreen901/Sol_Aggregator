const { clusterApiUrl, Connection, PublicKey } = require('@solana/web3.js');
const { AccountLayout, TOKEN_PROGRAM_ID } = require('@solana/spl-token');

const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

const getTokenAddress = async (ownerAddress, tokenAccountAddress) => {
  const tokenAccounts = await connection.getTokenAccountsByOwner(
    new PublicKey(ownerAddress),
    {
      programId: TOKEN_PROGRAM_ID,
    },
  );

  for (let tokenAccount of tokenAccounts.value) {
    if (tokenAccount.pubkey.toBase58() == tokenAccountAddress) {
      const accountData = AccountLayout.decode(tokenAccount.account.data);
      return accountData.mint.toBase58();
    }
  }

  return null;
};

module.exports = { getTokenAddress };
