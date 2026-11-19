const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
    {
        courseCode: {
            type: String,
            required: true,
            unique: true
        },

        courseName: {
            type: String,
            required: true
        },

        category: {
            type: String
        },

        description: { type: String, default: '' },
        level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
        thumbnail: { type: String, default: '' },

        teacherId: {
            type: String,
            required: true,
        },

        teacherName: {
            type: String
        },

        duration: {
            type: Number
        },

        maxStudents: {
            type: Number
        },

        price: {
            type: Number
        },

        startDate: {
            type: Date
        },

        endDate: {
            type: Date
        },

        status: {
            type: Boolean,
            default: true,
        },
        approvalStatus: {
            type: String,
            enum: ['draft', 'pending', 'approved', 'rejected'],
            default: 'approved',
        }
    },
    {
        timestamps: true
    }
);

const courseModel = mongoose.model('Course', courseSchema);

module.exports = { courseModel };
