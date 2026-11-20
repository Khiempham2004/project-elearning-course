const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },
    type: { type: String, required: true, trim: true, maxlength: 80 },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    link: { type: String, trim: true, default: "" },
    readAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

notificationSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ actorId: 1, createdAt: -1 });

module.exports =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
