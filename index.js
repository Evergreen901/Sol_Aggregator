const { clusterApiUrl, Connection, PublicKey } = require('@solana/web3.js');
const { connect } = require('mongoose');
const {
  PUBLIC_KEY: ME_PUBLIC_KEY,
  processTrans: processMETrans,
} = require('./solana/magiceden');
const {
  PUBLIC_KEY: SOLANART_PUBLIC_KEY,
  processTrans: processSolanartTrans,
} = require('./solana/solanart');
const {
  PUBLIC_KEY: HYPERSPACE_PUBLIC_KEY,
  processTrans: processHyperSpaceTrans,
} = require('./solana/hyperspace');
const {
  PUBLIC_KEY: OPENSEA_PUBLIC_KEY,
  processTrans: processOpenSeaTrans,
} = require('./solana/opensea');
// TODO delete
const { AccountLayout, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const { serialize, deserialize, deserializeUnchecked } = require('borsh');
const { Buffer } = require('buffer');
const getWalletValue = require('./solana/getWalletValue');

const MONGODB_CONNECTION_STRING = 'mongodb://0.0.0.0:27017/test';
const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

(async () => {
  await getWalletValue('4Ge5L9fUtQc7ERaSUWig9mKbRz16KhzBsVJtYGRVE88r');
  await connect(MONGODB_CONNECTION_STRING);

  // Register a callback to listen to the wallet (ws subscription)
  try {
    connection.onLogs(
      new PublicKey(ME_PUBLIC_KEY),
      (logSubscribe) => processMETrans(connection, logSubscribe),
      'confirmed',
    );

    connection.onLogs(
      new PublicKey(SOLANART_PUBLIC_KEY),
      (logSubscribe) =>
        processSolanartTrans(connection, logSubscribe?.signature),
      'confirmed',
    );

    connection.onLogs(
      new PublicKey(HYPERSPACE_PUBLIC_KEY),
      (logSubscribe) =>
        processHyperSpaceTrans(connection, logSubscribe?.signature),
      'confirmed',
    );

    connection.onLogs(
      new PublicKey(OPENSEA_PUBLIC_KEY),
      (logSubscribe) =>
        processOpenSeaTrans(connection, logSubscribe?.signature),
      'confirmed',
    );
  } catch (err) {
    console.log({ err });
    process.exit(0);
  }
})();

console.log('Aggregator running');

// TODO delete
// processOpenSeaTrans(
//   connection,
//   '3ctxDxbaHUpik9HuoTm9BoPwqLPUeDh8EnjdBhLdF92PF8AjMCDVqaohfmnTxSkZ5f4V8Dr9oHQgFwoiUU1swuuX'
// );

// class Primitive extends Struct {
//   constructor(properties: any) {
//     super(properties);
//   }
// }

// // Borsh needs a schema describing the payload
// const schema = new Map([
//   [
//     Primitive,
//     {
//       kind: "struct",
//       fields: [
//         ["lamports", "u64"],
//       ],
//     },
//   ],
// ]);
// const value = new Primitive({
//   lamports: 4500000000,
// });

// console.log("Value = ", value);
// // Serialize then deserialize
// const dser = Buffer.from(serialize(schema, value));
// console.log(dser); // 3Bxs3zx1e93Wv72P
// const newValue = deserialize(schema, Primitive, dser);
// // Viola!
// console.log("New value = ", newValue);
// // console.log(deserializeUnchecked(payloadSchema, Payload, '3Bxs4TfyrRxcATJ7'));
