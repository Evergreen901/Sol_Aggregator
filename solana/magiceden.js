const {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
} = require('@solana/web3.js');
const { getTransaction } = require('./getTransaction');
const { Transactions } = require('../mongo/transactions');
const { TransactionTypes } = require('./transactionTypes');

const MARKETPLACE = 'MagicEden';
const PUBLIC_KEY = 'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K';

const processTrans = async (logData, callback) => {
  try {
    const connection = new Connection(
      clusterApiUrl('mainnet-beta'),
      'confirmed',
    );

    const transData = await getTransaction(connection, logData.signature);
    if (transData == null) {
      console.error('transData is null');
      return;
    }

    if (
      // Listing
      logData.logs.includes('Program log: Instruction: Sell') &&
      logData.logs.includes(`Program ${PUBLIC_KEY} success`)
    ) {
      parseLog(
        logData,
        logData.signature,
        transData,
        TransactionTypes.sell,
        callback,
      );
    } else if (
      // Sale
      logData.logs.includes('Program log: Instruction: Deposit') &&
      logData.logs.includes('Program log: Instruction: Buy') &&
      logData.logs.includes('Program log: Instruction: ExecuteSale') &&
      logData.logs.includes(`Program ${PUBLIC_KEY} success`)
    ) {
      parseLog(
        logData,
        logData.signature,
        transData,
        TransactionTypes.sale,
        callback,
      );
    } else if (
      // Place Bid
      logData.logs.includes('Program log: Instruction: Buy') &&
      logData.logs.includes(`Program ${PUBLIC_KEY} success`)
    ) {
      parseLog(
        logData,
        logData.signature,
        transData,
        TransactionTypes.buy,
        callback,
      );
    } else if (
      // Cancel Listing
      logData.logs.includes('Program log: Instruction: CancelSell') &&
      logData.logs.includes('Program log: Instruction: SetAuthority') &&
      logData.logs.includes(`Program ${PUBLIC_KEY} success`)
    ) {
      parseLog(
        logData,
        logData.signature,
        transData,
        TransactionTypes.cancelSell,
        callback,
      );
    } else if (
      // Cancel Bid
      logData.logs.includes('Program log: Instruction: CancelBuy') &&
      logData.logs.includes(`Program ${PUBLIC_KEY} success`)
    ) {
      parseLog(
        logData,
        logData.signature,
        transData,
        TransactionTypes.cancelBuy,
        callback,
      );
    } else {
      console.log(
        `-------------------------- Unknown transaction type (${MARKETPLACE}) ----------------------------`,
      );
      console.log({ signature: logData.signature });
      for (const log of logData.logs) {
        if (log.startsWith('Program log: Instruction: ')) {
          console.log(log);
        }
      }
    }
  } catch (err) {
    console.log(`Error in process${MARKETPLACE}Trans`, err);
  }
};

const parseLog = async (logData, sign, transData, type, callback) => {
  try {
    let data = {};

    try {
      if (type == TransactionTypes.sell) {
        data = parseListing(logData, transData);
      } else if (type == TransactionTypes.sale) {
        data = parseSale(logData, transData);
      } else if (type == TransactionTypes.buy) {
        data = parsePlaceBid(logData, transData);
      } else if (type == TransactionTypes.cancelSell) {
        data = parseCancelListing(logData, transData);
      } else if (type == TransactionTypes.cancelBuy) {
        data = parseCancelBid(logData, transData);
      }
    } catch (err) {
      data = {};
      console.log(`Error in parse ${MARKETPLACE} log`);
      console.log({ err });
    }

    console.log(
      `-------------------- ${MARKETPLACE} - ${type} --------------------`,
    );
    console.log({ LogData: logData.signature });
    console.log({ data });

    const newDocument = await Transactions.create({
      marketplace: MARKETPLACE,
      signature: logData.signature,
      instruction: type,
      data,
    });

    console.log({ Saved: newDocument._id.toString() });

    if (callback) callback(data);

    if (type === TransactionTypes.sale) {
      const { processSaleRecord } = require('./common');
      await processSaleRecord({ data });
    }
  } catch (err) {
    console.log(`Error in parse${MARKETPLACE}Log`);
  }
};

const parseListing = (logData, transData) => {
  for (const element of logData.logs) {
    if (element.includes('Program log: {"price":')) {
      const parsedDict = JSON.parse(element.split('Program log: ')[1]);
      const indexMap = transData.transaction.message.instructions[0].accounts.map(
        (a) => a.toString(),
      );
      const accountKeys = transData.transaction.message.accountKeys.map((x) =>
        x.toBase58(),
      );
      const accountMapped = [];

      for (let j = 0; j < indexMap.length; j++) {
        accountMapped[j] = accountKeys[Number(indexMap[j])];
      }

      return {
        price: parsedDict['price'] / LAMPORTS_PER_SOL,
        expiry: parsedDict['seller_expiry'],
        pdaAddress: accountMapped[8],
        auctionHouse: accountMapped[7],
        tokenAddress2: accountMapped[2], // tokenAddress
        tokenAddress: accountMapped[4], // tokenMint
        seller: accountMapped[0],
        sellerReferral: accountMapped[6],
      };
    }
  }

  return [];
};

const parseSale = (logData, transData) => {
  for (const element of logData.logs) {
    if (element.includes('"seller_expiry"')) {
      const parsedDict = JSON.parse(element.split('Program log: ')[1]);
      const indexMap = transData.transaction.message.instructions[2].accounts.map(
        (a) => a.toString(),
      );
      const accountKeys = transData.transaction.message.accountKeys.map((x) =>
        x.toBase58(),
      );
      const accountMapped = [];

      for (let j = 0; j < indexMap.length; j++) {
        accountMapped[j] = accountKeys[Number(indexMap[j])];
      }

      return {
        price: parsedDict['price'] / LAMPORTS_PER_SOL,
        buyer_expiry: parsedDict['buyer_expiry'],
        seller_expiry: parsedDict['seller_expiry'],
        auctionHouse: accountMapped[9],
        tokenAddress: accountMapped[7],
        tokenMint: accountMapped[4],
        buyer: accountMapped[0],
        buyerReferral: accountMapped[8],
        seller: accountMapped[1],
        sellerReferral: accountMapped[14],
      };
    }
  }

  return [];
};

const parsePlaceBid = (logData, transData) => {
  for (const element of logData.logs) {
    if (element.includes('Program log: {"price":')) {
      const parsedDict = JSON.parse(element.split('Program log: ')[1]);
      const indexMap = transData.transaction.message.instructions[0].accounts.map(
        (a) => a.toString(),
      );
      const accountKeys = transData.transaction.message.accountKeys.map((x) =>
        x.toBase58(),
      );
      const accountMapped = [];

      for (let j = 0; j < indexMap.length; j++) {
        accountMapped[j] = accountKeys[Number(indexMap[j])];
      }

      return {
        price: parsedDict['price'] / LAMPORTS_PER_SOL,
        expiry: parsedDict['buyer_expiry'],
        auctionHouse: accountMapped[6],
        tokenMint: accountMapped[2],
        buyer: accountMapped[0],
        buyerReferral: accountMapped[5],
      };
    }
  }

  return [];
};

const parseCancelListing = (logData, transData) => {
  if (logData.signature === transData.transaction.signatures[0]) {
    const indexMap = transData.transaction.message.instructions[0].accounts.map(
      (a) => a.toString(),
    );
    const accountKeys = transData.transaction.message.accountKeys.map((x) =>
      x.toBase58(),
    );
    const accountMapped = [];

    for (let j = 0; j < indexMap.length; j++) {
      accountMapped[j] = accountKeys[Number(indexMap[j])];
    }

    return {
      auctionHouse: accountMapped[5],
      tokenMint: accountMapped[3],
      seller: accountMapped[0],
      sellerReferral: accountMapped[4],
    };
  } else {
    console.error(
      `Signature mismatched: ${logData.signature}, ${transData.transaction.signatures[0]}`,
    );
  }

  return {};
};

const parseCancelBid = (logData, transData) => {
  if (logData.signature === transData.transaction.signatures[0]) {
    const indexMap = transData.transaction.message.instructions[0].accounts.map(
      (a) => a.toString(),
    );
    const accountKeys = transData.transaction.message.accountKeys.map((x) =>
      x.toBase58(),
    );
    const accountMapped = [];

    for (let j = 0; j < indexMap.length; j++) {
      accountMapped[j] = accountKeys[Number(indexMap[j])];
    }

    return {
      auctionHouse: accountMapped[4],
      tokenMint: accountMapped[2],
      buyer: accountMapped[0],
      buyerReferral: accountMapped[3],
    };
  } else {
    console.error(
      `Signature mismatched: ${logData.signature}, ${transData.transaction.signatures[0]}`,
    );
  }

  return {};
};

module.exports = { PUBLIC_KEY, processTrans };
