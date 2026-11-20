const mongoose = require('mongoose');

const authSchema = new mongoose.Schema(
    {
        userName: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        role: {
            type: String,
            enum: ['admin', 'teacher', 'student', 'course', 'directory'],
            default: 'student'
        },
        status: {
            type: Boolean,
            default: true,
        },
        avatarUrl: { type: String, default: '' },
    },
    {
        timestamps: true
    }
);

authSchema.index({ role: 1, status: 1 });
authSchema.index({ userName: 'text', email: 'text' });

module.exports = mongoose.model('Auth', authSchema);
