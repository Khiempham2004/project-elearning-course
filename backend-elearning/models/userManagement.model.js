const mongoose = require("mongoose");
const schema = new mongoose.Schema(
    {
        userCode: { type: String, required: true, unique: true, trim: true },
        fullName: { type: String, required: true },
        email: { type: String, lowercase: true, trim: true },
        phone: String,
        role: String,
        departmentId: mongoose.Schema.Types.Mixed,
        status: { type: Boolean, default: true },
    },
    { timestamps: true },
);
module.exports =
    mongoose.models.DirectoryUser || mongoose.model("DirectoryUser", schema);
