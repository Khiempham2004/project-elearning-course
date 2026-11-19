const mongoose = require('mongoose');
const TeacherModel = require('../models/teacher.model');


const getAllTeachers = async (req, res) => {
    try {
        const keyword = (req.query.q || '').trim();
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
        const skip = (page - 1) * limit;
        let filter = {};
        if (keyword) {
            const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter = {
                $or: ['teacherCode', 'fullName', 'phone', 'email', 'gender', 'dateOfBirth', 'hometown'].map((field) => ({
                    [field]: { $regex: escapedKeyword, $options: 'i' },
                })),
            };
        }
        const [teachers, totalTeachers] = await Promise.all([
            TeacherModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            TeacherModel.countDocuments(filter),
        ]);
        return res.status(200).json({
            data: teachers,
            pagination: {
                page,
                limit,
                totalTeachers,
                totalPages: Math.ceil(totalTeachers / limit),
            },
            message: 'Lấy danh sách giảng viên thành công',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const getTeacherById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID giảng viên không hợp lệ' });
        }
        const teacher = await TeacherModel.findById(req.params.id);
        if (!teacher) return res.status(404).json({ message: 'Không tìm thấy giảng viên' });
        return res.status(200).json({ data: teacher, message: 'Lấy giảng viên thành công' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const createTeacher = async (req, res) => {
    try {
        const { teacherCode, fullName, ...teacherDetails } = req.body || {};
        const normalizedTeacherCode = typeof teacherCode === 'string' ? teacherCode.trim() : '';
        const normalizedFullName = typeof fullName === 'string' ? fullName.trim() : '';

        if (!normalizedTeacherCode || !normalizedFullName) {
            return res.status(400).json({
                message: 'Vui lòng cung cấp teacherCode và fullName',
                required: ['teacherCode', 'fullName'],
            });
        }

        const teacher = await TeacherModel.create({
            ...teacherDetails,
            teacherCode: normalizedTeacherCode,
            fullName: normalizedFullName,
        });
        console.log('teacher : ', teacher);

        return res.status(201).json({ data: teacher, message: 'Tạo giảng viên thành công' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Mã giảng viên đã tồn tại', error: error.message });
        }
        if (error.name === 'ValidationError' || error.name === 'CastError') {
            return res.status(400).json({ message: 'Dữ liệu giảng viên không hợp lệ', error: error.message });
        }
        console.error(error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const updateTeacher = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID giảng viên không hợp lệ' });
        }
        const teacher = await TeacherModel.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!teacher) return res.status(404).json({ message: 'Không tìm thấy giảng viên' });
        return res.status(200).json({ data: teacher, message: 'Cập nhật giảng viên thành công' });
    } catch (error) {
        if (error.code === 11000 || error.name === 'ValidationError' || error.name === 'CastError') {
            return res.status(400).json({ message: 'Dữ liệu cập nhật không hợp lệ hoặc mã giảng viên đã tồn tại', error: error.message });
        }
        console.error(error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const deleteTeacher = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID giảng viên không hợp lệ' });
        }
        const teacher = await TeacherModel.findByIdAndDelete(req.params.id);
        if (!teacher) return res.status(404).json({ message: 'Không tìm thấy giảng viên' });
        return res.status(200).json({ data: teacher, message: 'Xóa giảng viên thành công' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = { getAllTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher }
