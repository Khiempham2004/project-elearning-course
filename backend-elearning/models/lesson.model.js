const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      default: null,
    },
    section: { type: String, required: true, trim: true, default: "Chương 1" },
    title: { type: String, required: true, trim: true },
    contentType: {
      type: String,
      enum: ["text", "video", "pdf"],
      default: "text",
    },
    durationMinutes: { type: Number, min: 0, default: 0 },
    textContent: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    pdfUrl: { type: String, default: "" },
    order: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true },
);

lessonSchema.index({ courseId: 1, section: 1, order: 1 });
lessonSchema.index({ courseId: 1, sectionId: 1, order: 1 });
lessonSchema.index({ title: "text", textContent: "text" });
module.exports = mongoose.model("Lesson", lessonSchema);
