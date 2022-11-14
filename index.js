const { clusterApiUrl, Connection, PublicKey } = require('@solana/web3.js');
const { connect } = require('mongoose');
const { Server } = require('ws');
const { createServer } = require('http');

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

const WEBSOCKET_PORT = 3337;
const MONGODB_CONNECTION_STRING = 'mongodb://0.0.0.0:27017/test';

const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

const server = createServer();
const wss = new Server({ server });

wss.on('connection', (ws) => {
  console.log('connected');
});

wss.on('close', function close() {
  console.log('closed');
});

const broadcast = function(data) {
  wss.clients.forEach((client) => client.send(JSON.stringify(data)));
};

server.listen(WEBSOCKET_PORT);

(async () => {
  await connect(MONGODB_CONNECTION_STRING);

  // Register a callback to listen to the wallet (ws subscription)
  try {
    connection.onLogs(
      new PublicKey(ME_PUBLIC_KEY),
      (logSubscribe) => processMETrans(logSubscribe, broadcast),
      'confirmed',
    );

    connection.onLogs(
      new PublicKey(SOLANART_PUBLIC_KEY),
      (logSubscribe) =>
        processSolanartTrans(logSubscribe?.signature, broadcast),
      'confirmed',
    );

    connection.onLogs(
      new PublicKey(HYPERSPACE_PUBLIC_KEY),
      (logSubscribe) =>
        processHyperSpaceTrans(logSubscribe?.signature, broadcast),
      'confirmed',
    );

    connection.onLogs(
      new PublicKey(OPENSEA_PUBLIC_KEY),
      (logSubscribe) => processOpenSeaTrans(logSubscribe?.signature, broadcast),
      'confirmed',
    );
  } catch (err) {
    console.log({ err });
    process.exit(0);
  }
})();

console.log('Aggregator running');
