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
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseCategory', default: null },

        description: { type: String, default: '' },
        learningOutcomes: { type: [String], default: [] },
        prerequisites: { type: [String], default: [] },
        level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
        thumbnail: { type: String, default: '' },

        teacherId: {
            type: String,
            required: true,
        },
        teacherProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },

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

courseSchema.index({ categoryId: 1, status: 1, approvalStatus: 1 });
courseSchema.index({ teacherProfileId: 1, status: 1 });
courseSchema.index({ courseName: 'text', courseCode: 'text', category: 'text', teacherName: 'text' });

const courseModel = mongoose.model('Course', courseSchema);

module.exports = { courseModel };
