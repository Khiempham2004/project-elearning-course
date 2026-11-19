const mongoose = require("mongoose");

const provinceSchema = new mongoose.Schema(
    {
        provinceCode: { type: String, required: true, trim: true, unique: true },
        provinceName: { type: String, required: true, trim: true },
        provinceType: { type: String, required: true, trim: true },
        status: { type: Boolean, default: true },
    },
    { timestamps: true },
);

const provinceModel = mongoose.model("Province", provinceSchema);
module.exports = { provinceModel };
