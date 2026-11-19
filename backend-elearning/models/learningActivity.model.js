const mongoose = require('mongoose');

const learningActivitySchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    kind: { type: String, enum: ['schedule', 'assignment', 'exam'], required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    startsAt: { type: Date },
    dueAt: { type: Date },
    durationMinutes: { type: Number, min: 1 },
    location: { type: String, default: '' },
    meetingUrl: { type: String, default: '' },
    status: { type: String, enum: ['published', 'draft'], default: 'published' },
    submissions: [{
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
        answer: { type: String, required: true, maxlength: 10000 },
        submittedAt: { type: Date, default: Date.now },
        score: { type: Number, min: 0, max: 100 },
        feedback: { type: String, default: '' },
    }],
}, { timestamps: true });

module.exports = mongoose.model('LearningActivity', learningActivitySchema);
