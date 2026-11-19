const mongoose = require("mongoose");
const schema = new mongoose.Schema(
    {
        groupCode: { type: String, required: true, unique: true, trim: true },
        groupName: { type: String, required: true },
        description: String,
        status: { type: Boolean, default: true },
        userIds: [mongoose.Schema.Types.Mixed],
        permissionIds: [mongoose.Schema.Types.Mixed],
        permissionName: String,
    },
    { timestamps: true },
);
module.exports =
    mongoose.models.DirectoryUserGroup ||
    mongoose.model("DirectoryUserGroup", schema);
