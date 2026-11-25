const mongoose = require('mongoose');
const StudentModel = require('../models/student.model.js');

const getAllStudents = async (req, res) => {
    try {
        const keyword = (req.query.q || '').trim();
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
        const skip = (page - 1) * limit;
        let filter = {};
        if (keyword) {
            const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter = {
                $or: ['studentCode', 'studentName', 'phone', 'email', 'gender', 'dob', 'class'].map((field) => ({
                    [field]: { $regex: escapedKeyword, $options: 'i' },
                })),
            };
        }
        const [students, totalStudents] = await Promise.all([
            StudentModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            StudentModel.countDocuments(filter),
        ]);
        return res.status(200).json({
            result : {
                data: students,
                pagination: {
                    page,
                    limit,
                    totalStudents,
                    totalPages: Math.ceil(totalStudents / limit),
                },
                message: 'Lấy danh sách học sinh thành công',
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const getStudentById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID học sinh không hợp lệ' });
        }
        const student = await StudentModel.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Không tìm thấy học sinh' });
        return res.status(200).json({ data: student, message: 'Lấy học sinh thành công' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const createStudent = async (req, res) => {
    try {
        const { studentCode, studentName, ...studentDetails } = req.body || {};
        const normalizedStudentCode = typeof studentCode === 'string' ? studentCode.trim() : '';
        const normalizedStudentName = typeof studentName === 'string' ? studentName.trim() : '';

        if (!normalizedStudentCode || !normalizedStudentName) {
            return res.status(400).json({
                message: 'Vui lòng cung cấp studentCode và studentName',
                required: ['studentCode', 'studentName'],
            });
        }

        const student = await StudentModel.create({
            ...studentDetails,
            studentCode: normalizedStudentCode,
            studentName: normalizedStudentName,
        });
        console.log('student : ', student);

        return res.status(201).json({ data: student, message: 'Tạo học sinh thành công' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Mã học sinh đã tồn tại', error: error.message });
        }
        if (error.name === 'ValidationError' || error.name === 'CastError') {
            return res.status(400).json({ message: 'Dữ liệu học sinh không hợp lệ', error: error.message });
        }
        console.error(error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const updateStudent = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID học sinh không hợp lệ' });
        }
        const student = await StudentModel.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!student) return res.status(404).json({ message: 'Không tìm thấy học sinh' });
        return res.status(200).json({ data: student, message: 'Cập nhật học sinh thành công' });
    } catch (error) {
        if (error.code === 11000 || error.name === 'ValidationError' || error.name === 'CastError') {
            return res.status(400).json({ message: 'Dữ liệu cập nhật không hợp lệ hoặc mã học sinh đã tồn tại', error: error.message });
        }
        console.error(error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const deleteStudent = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID học sinh không hợp lệ' });
        }
        const student = await StudentModel.findByIdAndDelete(req.params.id);
        if (!student) return res.status(404).json({ message: 'Không tìm thấy học sinh' });
        return res.status(200).json({ data: student, message: 'Xóa học sinh thành công' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = { getAllStudents, getStudentById, createStudent, updateStudent, deleteStudent }
