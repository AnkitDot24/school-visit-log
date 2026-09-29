const mongoose = require('mongoose');

const QUESTION_TYPES = [
  'yesNo',
  'number',
  'singleChoice',
  'text',
];

const questionSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: QUESTION_TYPES,
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },

    min: {
      type: Number,
    },

    max: {
      type: Number,
    },

    options: {
      type: [String],
      default: undefined,
    },

    maxLength: {
      type: Number,
      min: 1,
    },

    optional: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);


const questionnaireSchema = new mongoose.Schema(
  {
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

    title: {
      type: String,
      required: true,
      trim: true,
    },

    questions: {
      type: [questionSchema],
      required: true,
      default: [],
    },
  },
  {
    collection: 'questionnaires',
    timestamps: true,
  }
);


questionnaireSchema.index(
  { year: 1, month: 1 },
  { unique: true }
);

const Questionnaire = mongoose.model(
  'Questionnaire',
  questionnaireSchema
);

module.exports = Questionnaire;
module.exports.QUESTION_TYPES = QUESTION_TYPES;
