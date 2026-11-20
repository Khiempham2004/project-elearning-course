const mongoose = require("mongoose");

const quizAttemptSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    attemptNumber: { type: Number, min: 1, required: true },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
          required: true,
        },
        selectedOptionIndex: { type: Number, min: 0, required: true },
      },
    ],
    rawAnswer: { type: String, trim: true, maxlength: 10000, default: "" },
    score: { type: Number, min: 0, max: 100, default: null },
    feedback: { type: String, trim: true, default: "", maxlength: 3000 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

quizAttemptSchema.index(
  { quizId: 1, studentId: 1, attemptNumber: 1 },
  { unique: true },
);
quizAttemptSchema.index({ studentId: 1, submittedAt: -1 });
quizAttemptSchema.index({ courseId: 1, quizId: 1 });

module.exports =
  mongoose.models.QuizAttempt ||
  mongoose.model("QuizAttempt", quizAttemptSchema);
