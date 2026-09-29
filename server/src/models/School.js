const mongoose = require('mongoose');


const schoolSchema = new mongoose.Schema(
  {
    udiseCode: {
      type: String,
      required: true,
      trim: true,
    },

    schoolName: {
      type: String,
      required: true,
      trim: true,
    },

    districtCode: {
      type: String,
      required: true,
      trim: true,
    },

    districtName: {
      type: String,
      trim: true,
      default: null,
    },

    blockCode: {
      type: String,
      required: true,
      trim: true,
    },

    blockName: {
      type: String,
      trim: true,
      default: null,
    },

    clusterCode: {
      type: String,
      required: true,
      trim: true,
    },

    clusterName: {
      type: String,
      trim: true,
      default: null,
    },

    schoolType: {
      type: String,
      trim: true,
      default: null,
    },

    management: {
      type: String,
      trim: true,
      default: null,
    },

    category: {
      type: String,
      trim: true,
      default: null,
    },

    classFrom: {
      type: Number,
      default: null,
    },

    classTo: {
      type: Number,
      default: null,
    },

    address: {
      type: String,
      trim: true,
      default: null,
    },

    isNv: {
      type: Boolean,
      default: null,
    },

    createdAt: {
      type: Date,
    },
  },
  {
    collection: 'schools',
    timestamps: false,
  }
);


schoolSchema.index(
  { udiseCode: 1 },
  { unique: true }
);

schoolSchema.index({ districtCode: 1, blockCode: 1, blockName: 1 });

schoolSchema.index({ districtCode: 1, schoolName: 1, udiseCode: 1 });

schoolSchema.index({ blockCode: 1, schoolName: 1, udiseCode: 1 });

schoolSchema.index({ clusterCode: 1, schoolName: 1, udiseCode: 1 });

schoolSchema.index({ schoolName: 1, udiseCode: 1 });

const School = mongoose.model(
  'School',
  schoolSchema
);

module.exports = School;
