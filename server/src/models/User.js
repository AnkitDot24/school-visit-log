const mongoose = require('mongoose');


const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
    },

    userName: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    collection: 'users',
    timestamps: true,
  }
);


userSchema.index(
  { userId: 1 },
  { unique: true }
);

const User = mongoose.model(
  'User',
  userSchema
);

module.exports = User;
