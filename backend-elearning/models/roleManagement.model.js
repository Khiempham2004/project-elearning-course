const mongoose = require("mongoose");
const schema = new mongoose.Schema(
    {
        roleCode: { type: String, required: true, unique: true, trim: true },
        roleName: { type: String, required: true },
        description: String,
        permissionIds: [mongoose.Schema.Types.Mixed],
        status: { type: Boolean, default: true },
    },
    { timestamps: true },
);
module.exports =
    mongoose.models.DirectoryRole || mongoose.model("DirectoryRole", schema);
