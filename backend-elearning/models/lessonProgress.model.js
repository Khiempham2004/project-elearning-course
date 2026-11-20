const mongoose = require("mongoose");

const lessonProgressSchema = new mongoose.Schema(
  {
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
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    isCompleted: { type: Boolean, default: false },
    lastPositionSeconds: { type: Number, min: 0, default: 0 },
    lastViewedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

lessonProgressSchema.index({ enrollmentId: 1, lessonId: 1 }, { unique: true });
lessonProgressSchema.index({ studentId: 1, courseId: 1, lastViewedAt: -1 });

module.exports =
  mongoose.models.LessonProgress ||
  mongoose.model("LessonProgress", lessonProgressSchema);
