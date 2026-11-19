const mongoose = require("mongoose");

const districtSchema = new mongoose.Schema(
    {
        districtCode: { type: String, required: true, trim: true, unique: true },
        districtName: { type: String, required: true, trim: true },
        districtType: { type: String, required: true, trim: true },
        // Numeric values match the existing provinceId data; strings are also
        // accepted for legacy records that store a province name.
        provinceId: { type: mongoose.Schema.Types.Mixed, required: true },
        provinceName: { type: String, trim: true, default: "" },
        status: { type: Boolean, default: true },
    },
    { timestamps: true },
);

const districtModel = mongoose.model("District", districtSchema);
module.exports = { districtModel };
