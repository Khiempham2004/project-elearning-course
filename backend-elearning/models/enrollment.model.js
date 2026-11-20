const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    completedLessons: { type: Number, min: 0, default: 0 },
    completedLessonIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    lastLessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },
    enrolledAt: { type: Date, default: Date.now },
}, { timestamps: true });

enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ courseId: 1, status: 1, enrolledAt: -1 });
module.exports = mongoose.model('Enrollment', enrollmentSchema);
