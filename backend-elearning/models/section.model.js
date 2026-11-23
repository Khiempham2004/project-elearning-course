const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, default: "", maxlength: 1000 },
    order: { type: Number, min: 0, default: 1 },
    status: {
      type: String,
      enum: ["published", "draft"],
      default: "published",
    },
  },
  { timestamps: true },
);

sectionSchema.index({ courseId: 1, title: 1 }, { unique: true });
sectionSchema.index({ courseId: 1, order: 1 });

module.exports =
  mongoose.models.Section || mongoose.model("Section", sectionSchema);
