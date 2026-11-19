const mongoose = require('mongoose');

const courseCategorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: '' },
    status: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('CourseCategory', courseCategorySchema);
