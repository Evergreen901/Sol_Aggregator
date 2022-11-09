const processSaleRecord = (data) => {
  const getWalletValue = require('./getWalletValue');

  const seller = data.data.seller;
  const buyer = data.data.buyer;
  getWalletValue(seller).then((value) =>
    createOrUpdateValueRecord(seller, value),
  );
  getWalletValue(buyer).then((value) =>
    createOrUpdateValueRecord(buyer, value),
  );
};

const createOrUpdateValueRecord = async (wallet, value) => {
  const mongoose = require('mongoose');
  const toObjectId = mongoose.Types.ObjectId;
  const ValueSeries = require('../mongo/valueSeries');

  const latestRecord = await ValueSeries.aggregate([
    { $match: { wallet } },
    { $sort: { updatedAt: -1 } },
    { $project: { _id: 1, updatedAt: 1 } },
    { $limit: 1 },
  ]);

  if (
    new Date(latestRecord?.[0].updatedAt ?? 0)
      .toISOString()
      .substring(0, 10) !== new Date().toISOString().substring(0, 10)
  ) {
    await ValueSeries.insertOne({ wallet, value });
  } else {
    await ValueSeries.updateOne(
      { _id: toObjectId(latestRecord[0]._id.toString()) },
      { $set: { value } },
    );
  }
};

module.exports = { processSaleRecord };
