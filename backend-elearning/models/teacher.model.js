const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    teacherCode: {
      type: String,
      required: true,
      unique: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', default: undefined },

    fullName: {
      type: String,
      required: true,
    },

    gender: {
      type: String,
      required: true,
      enum: ['Nam', 'Nữ'],
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    hometown: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    department: {
      type: String,
      required: true,
    },

    specialization: {
      type: String,
      required: true,
    },

    degree: {
      type: String,
      required: true,
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

teacherSchema.index({ userId: 1 }, { unique: true, sparse: true });

const TeacherModel = mongoose.model('Teacher', teacherSchema);

module.exports = TeacherModel;
