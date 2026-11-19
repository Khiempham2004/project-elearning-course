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
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Auth', authSchema);
