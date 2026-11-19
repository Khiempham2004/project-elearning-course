const mongoose = require("mongoose");
const schema = new mongoose.Schema(
    {
        roomCode: { type: String, required: true, unique: true, trim: true },
        roomName: { type: String, required: true },
        roomType: { type: String, default: "Phòng ban" },
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DirectoryRoom",
            default: null,
        },
        status: { type: Boolean, default: true },
    },
    { timestamps: true },
);
module.exports =
    mongoose.models.DirectoryRoom || mongoose.model("DirectoryRoom", schema);
