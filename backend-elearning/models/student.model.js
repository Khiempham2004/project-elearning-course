const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
    {
        studentCode: {
            type: String,
            required: true,
            unique: true,
        },
        studentName: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        gender: {
            type: String,
            required: true,
            enum: ['Nam', 'Nữ'],
        },

        dob: {
            type: Date,
            required: true,
        },
        class: {
            type: String,
            required: true,
        },
        status: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const StudentModel = mongoose.model('Student', studentSchema);

module.exports = StudentModel;