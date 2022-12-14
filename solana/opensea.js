const {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
} = require('@solana/web3.js');
const { getTransaction } = require('./getTransaction');
const { Transactions } = require('../mongo/transactions');
const { getTokenAddress } = require('./getTokenAddress');
const { TransactionTypes } = require('./transactionTypes');

const MARKETPLACE = 'OpenSea';
const PUBLIC_KEY = 'hausS13jsjafwWwGqZTUQRmWyvyxn9EQpqMwV1PBBmk';

const processTrans = async (signature, callback) => {
  try {
    const connection = new Connection(
      clusterApiUrl('mainnet-beta'),
      'confirmed',
    );

    const transData = await getTransaction(connection, signature);
    if (transData == null) {
      console.error('transData is null');
      return;
    }

    const logMessages = transData.meta?.logMessages ?? [];

    if (
      logMessages.includes('Program log: Instruction: Sell') &&
      logMessages.includes('Program log: Instruction: Approve') &&
      logMessages.includes(`Program ${PUBLIC_KEY} success`)
    ) {
      parseLog(transData, TransactionTypes.sell, callback);
    } else if (
      logMessages.includes('Program log: Instruction: Cancel') &&
      logMessages.includes('Program log: Instruction: WithdrawFromFee') &&
      logMessages.includes(`Program ${PUBLIC_KEY} success`)
    ) {
      parseLog(transData, TransactionTypes.cancelSell, callback);
    } else if (
      logMessages.includes('Program log: Instruction: Buy') &&
      logMessages.includes('Program log: Instruction: ExecuteSale') &&
      logMessages.includes(`Program ${PUBLIC_KEY} success`)
    ) {
      parseLog(transData, TransactionTypes.sale, callback);
    } else {
      console.log(
        `-------------------------- Unknown transaction type (${MARKETPLACE}) ----------------------------`,
      );
      console.log({ signature });
      for (const log of logMessages) {
        console.log(log);
      }
    }
  } catch (err) {
    console.log(`Error in process${MARKETPLACE}Trans: \n`, err);
  }
};

const parseLog = async (transData, type, callback) => {
  try {
    let data = {};

    try {
      if (type == TransactionTypes.sell) {
        data = await parseList(transData);
      } else if (type == TransactionTypes.cancelSell) {
        data = await parseCancelListing(transData);
      } else if (type == TransactionTypes.sale) {
        data = await parseSale(transData);
      }
    } catch (err) {
      data = {};
      console.log(`Error in parse ${MARKETPLACE} log`, err);
    }

    console.log(
      `-------------------- ${MARKETPLACE} - ${type} --------------------`,
    );
    console.log({ LogData: transData?.transaction?.signatures?.[0] });
    console.log({ data });

    const parsed = {
      marketplace: MARKETPLACE,
      signature: transData?.transaction?.signatures?.[0],
      instruction: type,
      data,
    };

    const newDocument = await Transactions.create(parsed);

    console.log({ Saved: newDocument._id.toString() });

    if (callback) callback(parsed);

    if (type === TransactionTypes.sale) {
      const { processSaleRecord } = require('./common');
      await processSaleRecord(parsed);
    }
  } catch (err) {
    console.log(`Error in parse${MARKETPLACE}Log`, err);
  }
};

const parseList = async (transData) => {
  // test with fNGKwWsU8CK7ZXBBJWX3e2QBn9Wisy7CTMHoL3WXGjqK75W9ukRtpMXpyFAkemo6jAQmEXyGrEsfNegeVrZBokT
  const seller = transData?.transaction?.message?.accountKeys[0].toBase58();
  const tokenAccountAddress = transData?.transaction?.message?.accountKeys[2].toBase58();
  const tokenAddress = await getTokenAddress(seller, tokenAccountAddress);

  return {
    seller,
    tokenAddress: tokenAddress ?? tokenAccountAddress,
    price: 0, // TODO couldn't get price
  };
};

const parseCancelListing = async (transData) => {
  // test with oCcHvq5SCsBnG7M1m9sEN8Cnx38qwT3KAqEDXUkt3ZyYfUFnViiYne7pEwFoDRr2Ut36oJTK7CSqDZ21LbSMwpX
  return {
    seller: transData?.transaction?.message?.accountKeys[0].toBase58(),
    tokenAddress: transData?.transaction?.message?.accountKeys[6].toBase58(),
  };
};

const parseSale = async (transData) => {
  const buyer = transData?.transaction?.message?.accountKeys[0].toBase58();

  if (
    transData.meta.logMessages.includes('Program log: Instruction: Deposit')
  ) {
    // test with 4kjzW1Eee259wzhYUq7QwuCkC871aYLMBkNDFE12WLaajmLshexetRhjcJZ3A3pAdWby3PjXrLhZkXxnjRAyzJGr
    const seller = transData?.transaction?.message?.accountKeys[8].toBase58();
    const tokenAddress = transData?.transaction?.message?.accountKeys[19].toBase58();
    const price =
      (transData.meta.postBalances[8] -
        transData.meta.preBalances[8] +
        transData.meta.postBalances[9] -
        transData.meta.preBalances[9] +
        transData.meta.postBalances[10] -
        transData.meta.preBalances[10] +
        transData.meta.postBalances[13] -
        transData.meta.preBalances[13]) /
      LAMPORTS_PER_SOL;

    return {
      buyer,
      seller,
      tokenAddress,
      price,
    };
  } else if (
    transData.meta.logMessages.includes('Program log: Instruction: Transfer')
  ) {
    // test with 3ctxDxbaHUpik9HuoTm9BoPwqLPUeDh8EnjdBhLdF92PF8AjMCDVqaohfmnTxSkZ5f4V8Dr9oHQgFwoiUU1swuuX
    const seller = transData?.transaction?.message?.accountKeys[4].toBase58();
    const tokenAddress = transData?.transaction?.message?.accountKeys[15].toBase58();
    console.log(transData);

    const price =
      (transData.meta.postBalances[2] -
        transData.meta.preBalances[2] +
        transData.meta.postBalances[4] -
        transData.meta.preBalances[4] +
        transData.meta.postBalances[11] -
        transData.meta.preBalances[11] +
        transData.meta.postBalances[12] -
        transData.meta.preBalances[12]) /
      LAMPORTS_PER_SOL;

    return {
      buyer,
      seller,
      tokenAddress,
      price,
    };
  }
};

module.exports = { PUBLIC_KEY, processTrans };
