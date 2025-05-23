// server/models/Appointment.js
const mongoose = require('mongoose');

const appointmentSchema = mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      default: 'scheduled',
      enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    },
    type: {
      type: String,
      required: true,
      enum: ['new', 'followup', 'consultation'],
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['cash', 'creditCard', 'insurance', 'bankTransfer', 'other'],
    },
    paymentStatus: {
      type: String,
      required: true,
      default: 'pending',
      enum: ['pending', 'paid', 'refunded', 'partially_paid'],
    },
    paymentAmount: {
      type: Number,
      default: 0
    },
    paymentDate: {
      type: Date
    },
    paymentReference: {
      type: String
    },
    medicalReport: {
      type: String,
    },
    prescription: {
      type: String,
    },
    // حقول جديدة لطلبات التعديل
    editRequest: {
      newDate: {
        type: Date,
      },
      newTime: {
        type: String,
      },
      reason: {
        type: String,
      },
      requestedAt: {
        type: Date,
      }
    },
    editRequestStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', null],
      default: null
    }
  },
  {
    timestamps: true,
  }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;