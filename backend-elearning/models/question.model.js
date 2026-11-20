const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    prompt: { type: String, required: true, trim: true, maxlength: 3000 },
    options: {
      type: [{ type: String, required: true, trim: true, maxlength: 1000 }],
      validate: {
        validator: (options) => options.length >= 2,
        message: "Câu hỏi cần ít nhất hai lựa chọn.",
      },
    },
    correctAnswerIndex: { type: Number, required: true, min: 0 },
    points: { type: Number, min: 0, default: 1 },
    order: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true },
);

questionSchema.pre("validate", function validateAnswerIndex(next) {
  if (this.correctAnswerIndex >= this.options.length) {
    this.invalidate(
      "correctAnswerIndex",
      "Đáp án đúng phải nằm trong danh sách lựa chọn.",
    );
  }
  next();
});
questionSchema.index({ quizId: 1, order: 1 }, { unique: true });

module.exports =
  mongoose.models.Question || mongoose.model("Question", questionSchema);
