const mongoose = require('mongoose');
const { courseModel } = require('../models/course.model.js');
const TeacherModel = require('../models/teacher.model.js');

const teacherIdentity = async (user) => {
    const email = String(user.email || '').trim();
    const username = String(user.userName || '').trim();
    const alternatives = [];
    if (email) alternatives.push({ email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
    if (username) alternatives.push({ teacherCode: username });
    const profile = alternatives.length ? await TeacherModel.findOne({ $or: alternatives }).lean() : null;
    if (!profile || profile.status === false) return null;
    const ids = [profile.teacherCode, String(profile._id), String(user._id), username].filter(Boolean).map(String);
    return { profile, identifiers: [...new Set(ids.flatMap((id) => [id, id.toLowerCase(), id.toUpperCase()]))] };
};

const getAllCourse = async (req, res) => {
    try {
        const keyword = (req.query.q || '').trim();
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
        const skip = (page - 1) * limit;
        const filter = {};
        if (keyword) {
            const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.$or = ['courseCode', 'courseName', 'category', 'teacherName'].map((field) => ({
                    [field]: { $regex: escapedKeyword, $options: 'i' },
                }));
        }
        if (req.user.role === 'teacher') {
            const identity = await teacherIdentity(req.user);
            if (!identity) return res.status(403).json({ message: 'Tài khoản chưa được liên kết hồ sơ giảng viên đang hoạt động' });
            filter.teacherId = { $in: identity.identifiers };
        }
        const [courses, totalCourses] = await Promise.all([
            courseModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            courseModel.countDocuments(filter),
        ]);
        return res.status(200).json({
            data: courses,
            pagination: {
                page,
                limit,
                totalCourses,
                totalPages: Math.ceil(totalCourses / limit),
            },
            message: 'Lấy danh sách khóa học thành công',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const getCourseById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
        }
        const course = await courseModel.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
        if (req.user.role === 'teacher') {
            const identity = await teacherIdentity(req.user);
            if (!identity || !identity.identifiers.includes(String(course.teacherId)) && !identity.identifiers.includes(String(course.teacherId).toLowerCase()) && !identity.identifiers.includes(String(course.teacherId).toUpperCase())) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
        }
        return res.status(200).json({ data: course, message: 'Lấy khóa học thành công' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const createCourse = async (req, res) => {
    try {
        const { courseCode, courseName, ...courseDetails } = req.body || {};
        const normalizedCourseCode = typeof courseCode === 'string' ? courseCode.trim() : '';
        const normalizedCourseName = typeof courseName === 'string' ? courseName.trim() : '';

        if (!normalizedCourseCode || !normalizedCourseName || !String(courseDetails.teacherId || '').trim()) {
            return res.status(400).json({
                message: 'Vui lòng cung cấp courseCode, courseName và mã giảng viên phụ trách',
                required: ['courseCode', 'courseName', 'teacherId'],
            });
        }

        let approvalStatus = req.user.role === 'admin' ? (courseDetails.approvalStatus || 'approved') : 'pending';
        if (req.user.role === 'teacher') {
            const identity = await teacherIdentity(req.user);
            if (!identity) return res.status(403).json({ message: 'Tài khoản teacher chưa được liên kết hồ sơ giảng viên đang hoạt động' });
            courseDetails.teacherId = identity.profile.teacherCode;
            courseDetails.teacherName = identity.profile.fullName;
            courseDetails.status = false;
            approvalStatus = 'pending';
        }
        const course = await courseModel.create({
            ...courseDetails,
            courseCode: normalizedCourseCode,
            courseName: normalizedCourseName,
            approvalStatus,
        });
        console.log('course : ', course);

        return res.status(201).json({ data: course, message: 'Tạo khóa học thành công' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Mã khóa học đã tồn tại', error: error.message });
        }
        if (error.name === 'ValidationError' || error.name === 'CastError') {
            return res.status(400).json({ message: 'Dữ liệu khóa học không hợp lệ', error: error.message });
        }
        console.error(error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const updateCourse = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
        }
        const current = await courseModel.findById(req.params.id);
        if (!current) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
        const updates = { ...(req.body || {}) };
        if (req.user.role === 'teacher') {
            const identity = await teacherIdentity(req.user);
            if (!identity || !identity.identifiers.includes(String(current.teacherId)) && !identity.identifiers.includes(String(current.teacherId).toLowerCase()) && !identity.identifiers.includes(String(current.teacherId).toUpperCase())) return res.status(403).json({ message: 'Bạn chỉ được chỉnh sửa khóa học của mình' });
            delete updates.teacherId; delete updates.teacherName; delete updates.approvalStatus; delete updates.status;
        }
        const course = await courseModel.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        });
        if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
        return res.status(200).json({ data: course, message: 'Cập nhật khóa học thành công' });
    } catch (error) {
        if (error.code === 11000 || error.name === 'ValidationError' || error.name === 'CastError') {
            return res.status(400).json({ message: 'Dữ liệu cập nhật không hợp lệ hoặc mã khóa học đã tồn tại', error: error.message });
        }
        console.error(error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const deleteCourse = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
        }
        const current = await courseModel.findById(req.params.id);
        if (!current) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
        if (req.user.role === 'teacher') {
            const identity = await teacherIdentity(req.user);
            if (!identity || !identity.identifiers.includes(String(current.teacherId)) && !identity.identifiers.includes(String(current.teacherId).toLowerCase()) && !identity.identifiers.includes(String(current.teacherId).toUpperCase())) return res.status(403).json({ message: 'Bạn chỉ được xóa khóa học của mình' });
            if (current.approvalStatus === 'approved') return res.status(403).json({ message: 'Khóa học đã được duyệt; liên hệ admin để xóa' });
        }
        const course = await courseModel.findByIdAndDelete(req.params.id);
        if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
        return res.status(200).json({ data: course, message: 'Xóa khóa học thành công' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const reviewCourse = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
        const approvalStatus = req.body?.approvalStatus;
        if (!['approved', 'rejected'].includes(approvalStatus)) return res.status(400).json({ message: 'Chọn duyệt hoặc từ chối khóa học' });
        const updates = { approvalStatus, status: approvalStatus === 'approved' };
        const course = await courseModel.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
        return res.json({ data: course, message: approvalStatus === 'approved' ? 'Đã duyệt khóa học' : 'Đã từ chối khóa học' });
    } catch (error) {
        return res.status(500).json({ message: 'Không cập nhật được trạng thái duyệt khóa học' });
    }
};

module.exports = { getAllCourse, getCourseById, createCourse, updateCourse, deleteCourse, reviewCourse }
