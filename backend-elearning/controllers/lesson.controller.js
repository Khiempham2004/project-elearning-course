const mongoose = require('mongoose');
const Lesson = require('../models/lesson.model.js');
const { courseModel } = require('../models/course.model.js');
const { teacherIdentity } = require('./course.controller.js');
const Section = require('../models/section.model.js');

const getOwnedCourse = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.courseId)) {
        res.status(400).json({ message: 'Mã khóa học không hợp lệ' });
        return null;
    }
    const course = await courseModel.findById(req.params.courseId).lean();
    if (!course) {
        res.status(404).json({ message: 'Không tìm thấy khóa học' });
        return null;
    }
    if (req.user.role === 'teacher') {
        const identity = await teacherIdentity(req.user);
        const teacherId = String(course.teacherId || '');
        const ownsCourse = identity && (
            String(course.teacherProfileId || '') === String(identity.profile._id) ||
            identity.identifiers.includes(teacherId.toLowerCase())
        );
        if (!ownsCourse) {
            res.status(403).json({ message: 'Bạn chỉ được quản lý bài giảng trong khóa học của mình' });
            return null;
        }
    }
    return course;
};

const listLessons = async (req, res) => {
    try {
        const course = await getOwnedCourse(req, res);
        if (!course) return;
        const legacyLessons = await Lesson.find({ courseId: course._id }).select('_id section sectionId').lean();
        const sectionIds = new Map();
        for (const sectionName of [...new Set(legacyLessons.map((lesson) => String(lesson.section || 'Chương 1').trim()))]) {
            const section = await Section.findOneAndUpdate(
                { courseId: course._id, title: sectionName },
                { $setOnInsert: { courseId: course._id, title: sectionName } },
                { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
            );
            sectionIds.set(sectionName, section._id);
        }
        const operations = legacyLessons
            .filter((lesson) => !lesson.sectionId && sectionIds.has(String(lesson.section || 'Chương 1').trim()))
            .map((lesson) => ({ updateOne: { filter: { _id: lesson._id, $or: [{ sectionId: null }, { sectionId: { $exists: false } }] }, update: { $set: { sectionId: sectionIds.get(String(lesson.section || 'Chương 1').trim()) } } } }));
        if (operations.length) await Lesson.bulkWrite(operations, { ordered: false });
        const lessons = await Lesson.find({ courseId: course._id }).populate('sectionId', 'title order').sort({ section: 1, order: 1, createdAt: 1 }).lean();
        return res.json({ data: lessons });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Không tải được danh sách bài giảng' });
    }
};

const saveLesson = async (req, res) => {
    try {
        const course = await getOwnedCourse(req, res);
        if (!course) return;
        const { title, section, contentType, textContent, videoUrl, pdfUrl, order } = req.body || {};
        if (!String(title || '').trim() || !['text', 'video', 'pdf'].includes(contentType)) {
            return res.status(400).json({ message: 'Nhập tiêu đề và chọn loại nội dung hợp lệ' });
        }
        if (contentType === 'video' && !String(videoUrl || '').trim()) return res.status(400).json({ message: 'Nhập URL video' });
        if (contentType === 'pdf' && !String(pdfUrl || '').trim()) return res.status(400).json({ message: 'Nhập URL tài liệu PDF' });
        if (req.params.lessonId && !mongoose.Types.ObjectId.isValid(req.params.lessonId)) return res.status(400).json({ message: 'Mã bài giảng không hợp lệ' });
        const sectionTitle = String(section || 'Chương 1').trim();
        const sectionRecord = await Section.findOneAndUpdate(
            { courseId: course._id, title: sectionTitle },
            { $setOnInsert: { courseId: course._id, title: sectionTitle } },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
        );
        const values = { courseId: course._id, sectionId: sectionRecord._id, title: String(title).trim(), section: sectionTitle, contentType, textContent, videoUrl, pdfUrl, order: Math.max(0, Number(order) || 0) };
        const lesson = req.params.lessonId
            ? await Lesson.findOneAndUpdate({ _id: req.params.lessonId, courseId: course._id }, values, { new: true, runValidators: true })
            : await Lesson.create(values);
        if (!lesson) return res.status(404).json({ message: 'Không tìm thấy bài giảng trong khóa học' });
        return res.status(req.params.lessonId ? 200 : 201).json({ data: lesson, message: req.params.lessonId ? 'Đã cập nhật bài giảng' : 'Đã thêm bài giảng' });
    } catch (error) {
        if (error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ message: 'Thông tin bài giảng không hợp lệ' });
        console.error(error);
        return res.status(500).json({ message: 'Không lưu được bài giảng' });
    }
};

const deleteLesson = async (req, res) => {
    try {
        const course = await getOwnedCourse(req, res);
        if (!course) return;
        if (!mongoose.Types.ObjectId.isValid(req.params.lessonId)) return res.status(400).json({ message: 'Mã bài giảng không hợp lệ' });
        const lesson = await Lesson.findOneAndDelete({ _id: req.params.lessonId, courseId: course._id });
        if (!lesson) return res.status(404).json({ message: 'Không tìm thấy bài giảng trong khóa học' });
        return res.json({ message: 'Đã xóa bài giảng' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Không xóa được bài giảng' });
    }
};

module.exports = { listLessons, saveLesson, deleteLesson };
