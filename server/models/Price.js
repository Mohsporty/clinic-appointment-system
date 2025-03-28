// server/models/Price.js
const mongoose = require('mongoose');

const priceSchema = mongoose.Schema(
  {
    serviceType: {
      type: String,
      required: true,
      enum: ['new', 'followup', 'consultation'],
      unique: true
    },
    name: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);

const Price = mongoose.model('Price', priceSchema);

module.exports = Price;