const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    configKey: { type: String, required: true, unique: true, trim: true },
    configName: { type: String, required: true },
    configValue: String,
    configType: { type: [String], default: [] },
    category: { type: [String], required: true },
    description: String,
    status: { type: Boolean, default: true },
  },
  { timestamps: true },
);
module.exports =
  mongoose.models.DirectoryConfiguration ||
  mongoose.model("DirectoryConfiguration", schema);
