const { Schema, model, models } = require('mongoose');

const dataSchema = new Schema(
  {
    marketplace: { type: String, required: true },
    signature: { type: String, required: true },
    instruction: { type: String, required: true },
    data: { type: Object },
  },
  {
    timestamps: true,
  },
);

dataSchema.set('timestamps', true);

const Transactions =
  models.soltransactions || model('soltransactions', dataSchema);

module.exports = { Transactions };
