const mongoose = require('mongoose');

const courseCategorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: '' },
    status: { type: Boolean, default: true },
}, { timestamps: true });

courseCategorySchema.index({ status: 1, name: 1 });

module.exports = mongoose.model('CourseCategory', courseCategorySchema);
