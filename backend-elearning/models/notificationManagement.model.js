const mongoose = require("mongoose");
const schema = new mongoose.Schema({
    title: { type: String, required: true },
    content: String,
    type: String,
    recipient: String,
    status: { type: String, default: "PUBLISHED" },
    createdAt: { type: Date, default: Date.now },
});
module.exports =
    mongoose.models.DirectoryNotification ||
    mongoose.model("DirectoryNotification", schema);
