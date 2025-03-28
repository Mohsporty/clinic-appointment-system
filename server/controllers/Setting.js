// server/models/Setting.js
const mongoose = require('mongoose');

const settingSchema = mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['general', 'appointments', 'prices', 'notifications'],
      unique: true
    },
    data: {
      type: Object,
      required: true
    }
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.model('Setting', settingSchema);

module.exports = Setting;