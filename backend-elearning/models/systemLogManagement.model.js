const mongoose = require("mongoose");
const schema = new mongoose.Schema({
    logCode: { type: String, required: true, unique: true, trim: true },
    userId: mongoose.Schema.Types.Mixed,
    userName: String,
    action: String,
    module: String,
    description: String,
    ipAddress: String,
    status: String,
    createdAt: { type: Date, default: Date.now },
});
module.exports =
    mongoose.models.DirectorySystemLog ||
    mongoose.model("DirectorySystemLog", schema);
