const mongoose = require("mongoose");
const schema = new mongoose.Schema(
    {
        functionCode: { type: String, required: true, unique: true, trim: true },
        functionName: { type: String, required: true },
        directoryId: mongoose.Schema.Types.Mixed,
        functionType: String,
        functionUrl: String,
        description: String,
        sortOrder: { type: Number, default: 0 },
        status: { type: Boolean, default: true },
    },
    { timestamps: true },
);
module.exports =
    mongoose.models.DirectoryFunction ||
    mongoose.model("DirectoryFunction", schema);
