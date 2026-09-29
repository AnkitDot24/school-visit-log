const mongoose = require('mongoose');


const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
      trim: true,
    },

   
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    _id: false,
  }
);


const visitSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      required: true,
      trim: true,
    },

    userId: {
      type: String,
      required: true,
      trim: true,
    },

    udiseCode: {
      type: String,
      required: true,
      trim: true,
    },

    visitedAt: {
      type: Date,
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    districtCode: {
      type: String,
      required: true,
      trim: true,
    },

    blockCode: {
      type: String,
      required: true,
      trim: true,
    },

    clusterCode: {
      type: String,
      required: true,
      trim: true,
    },

    questionnaireId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Questionnaire',
      required: true,
    },

    answers: {
      type: [answerSchema],
      required: true,
      default: [],
    },
  },
  {
    collection: 'visits',
    timestamps: true,
  }
);


visitSchema.index(
  { clientId: 1 },
  { unique: true }
);

visitSchema.index({ userId: 1, visitedAt: -1, _id: -1 });

visitSchema.index({ userId: 1, year: 1, month: 1, visitedAt: -1, _id: -1 });

visitSchema.index({ blockCode: 1, year: 1, month: 1, userId: 1, udiseCode: 1 });

const Visit = mongoose.model(
  'Visit',
  visitSchema
);

module.exports = Visit;
