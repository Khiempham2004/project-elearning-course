const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', default: null },
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LearningActivity",
      default: undefined,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: "", maxlength: 5000 },
    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "draft",
    },
    passingScore: { type: Number, min: 0, max: 100, default: 60 },
    startsAt: { type: Date, default: null },
    dueAt: { type: Date, default: null },
    durationMinutes: { type: Number, min: 1, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
  },
  { timestamps: true },
);

quizSchema.index({ courseId: 1, status: 1, startsAt: 1 });
quizSchema.index({ activityId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);
