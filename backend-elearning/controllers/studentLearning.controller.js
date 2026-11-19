const mongoose = require("mongoose");
const Enrollment = require("../models/enrollment.model.js");
const LearningActivity = require("../models/learningActivity.model.js");
const Lesson = require('../models/lesson.model.js');
const { courseModel } = require("../models/course.model.js");
const { findTeacherProfile } = require("../utils/teacherProfileLookup.js");

const isStudent = (req) => req.user?.role === "student";
const isStaff = (req) => ["admin", "teacher"].includes(req.user?.role);

const getTeacherScope = async (user) => {
    const username = String(user.userName || '').trim();
    const teacher = await findTeacherProfile(user);
    if (!teacher) return { error: 'Tài khoản giảng viên chưa được liên kết hồ sơ giảng viên. Vui lòng nhờ admin tạo hồ sơ với email hoặc mã giảng viên khớp tài khoản.' };
    if (teacher.status === false) return { error: 'Hồ sơ giảng viên của bạn đang bị khóa. Vui lòng liên hệ admin.' };

    const rawIdentifiers = [teacher.teacherCode, String(teacher._id), String(user._id), username].filter(Boolean).map(String);
    const identifiers = [...new Set(rawIdentifiers.flatMap((value) => [value, value.toLowerCase(), value.toUpperCase()]))];
    const courseFilter = { teacherId: { $in: identifiers } };
    const courses = await courseModel.find(courseFilter).select('_id courseName courseCode teacherName teacherId').lean();
    return { teacher, courses, courseIds: courses.map((course) => course._id), courseFilter };
};

const canManageActivity = async (req, activity) => {
    if (req.user?.role === 'admin') return true;
    const scope = await getTeacherScope(req.user);
    return !scope.error && scope.courseIds.some((id) => String(id) === String(activity.courseId));
};

const getActivityDeadline = (activity) => {
    const deadlines = [];
    if (activity.dueAt) deadlines.push(new Date(activity.dueAt));
    if (activity.kind === 'exam' && activity.startsAt && activity.durationMinutes) {
        deadlines.push(new Date(new Date(activity.startsAt).getTime() + activity.durationMinutes * 60 * 1000));
    }
    return deadlines.length ? new Date(Math.min(...deadlines.map((date) => date.getTime()))) : null;
};

const getCatalog = async (req, res) => {
    try {
        const courses = await courseModel
            .find({ status: true, $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }] })
            .sort({ startDate: 1, courseName: 1 })
            .lean();
        const enrollments = await Enrollment.find({
            studentId: req.user._id,
            status: { $ne: "cancelled" },
        })
            .select("courseId status progress")
            .lean();
        const enrolled = new Map(
            enrollments.map((entry) => [String(entry.courseId), entry]),
        );
        return res.json({
            data: courses.map((course) => {
                const enrollment = enrolled.get(String(course._id));
                return {
                    ...course,
                    enrollmentStatus: enrollment?.status || null,
                    progress: enrollment?.progress || 0,
                };
            }),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Không thể tải danh mục khóa học" });
    }
};

const enrollCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(courseId))
            return res.status(400).json({ message: "Mã khóa học không hợp lệ" });
        const course = await courseModel.findOne({ _id: courseId, status: true });
        if (!course)
            return res
                .status(404)
                .json({ message: "Khóa học không tồn tại hoặc đã ngừng tuyển sinh" });
        const current = await Enrollment.findOne({
            studentId: req.user._id,
            courseId,
        });
        if (current?.status === "active" || current?.status === "completed")
            return res.status(409).json({ message: "Bạn đã đăng ký khóa học này" });
        if (course.maxStudents) {
            const count = await Enrollment.countDocuments({
                courseId,
                status: "active",
            });
            if (count >= course.maxStudents)
                return res
                    .status(409)
                    .json({ message: "Khóa học đã đủ số lượng học viên" });
        }
        const enrollment = current
            ? await Enrollment.findByIdAndUpdate(
                current._id,
                { status: "active", enrolledAt: new Date() },
                { new: true },
            )
            : await Enrollment.create({ studentId: req.user._id, courseId });
        return res
            .status(201)
            .json({ data: enrollment, message: "Đăng ký khóa học thành công" });
    } catch (error) {
        if (error.code === 11000)
            return res.status(409).json({ message: "Bạn đã đăng ký khóa học này" });
        console.error(error);
        return res.status(500).json({ message: "Không thể đăng ký khóa học" });
    }
};

const getMyLearning = async (req, res) => {
    try {
        const enrollments = await Enrollment.find({
            studentId: req.user._id,
            status: { $in: ["active", "completed"] },
        })
            .populate("courseId")
            .sort({ enrolledAt: -1 })
            .lean();
        const courseIds = enrollments
            .map((entry) => entry.courseId?._id)
            .filter(Boolean);
        const activities = await LearningActivity.find({
            courseId: { $in: courseIds },
            status: "published",
        })
            .populate("courseId", "courseName courseCode teacherName")
            .lean();
        const studentId = String(req.user._id);
        const resultActivities = activities.map(
            ({ submissions = [], questions = [], ...activity }) => {
                const mine = submissions.find(
                    (submission) => String(submission.studentId) === studentId,
                );
                return { ...activity, questions: questions.map(({ prompt, options }) => ({ prompt, options })), submission: mine || null };
            },
        );
        return res.json({
            data: {
                student: {
                    id: req.user._id,
                    userName: req.user.userName,
                    email: req.user.email,
                },
                enrollments: enrollments.filter((entry) => entry.courseId),
                activities: resultActivities,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Không thể tải dữ liệu học tập" });
    }
};

const getManageActivities = async (req, res) => {
    try {
        let courseFilter = {};
        let teacher = null;
        if (req.user.role === 'teacher') {
            const scope = await getTeacherScope(req.user);
            if (scope.error) return res.status(403).json({ message: scope.error });
            courseFilter = scope.courseFilter;
            teacher = { teacherCode: scope.teacher.teacherCode, fullName: scope.teacher.fullName };
        }
        const courses = await courseModel.find(courseFilter).select('courseName courseCode teacherName teacherId').sort({ courseName: 1 }).lean();
        const courseIds = courses.map((course) => course._id);
        const [activities, enrollmentCounts, enrollments, lessonCount] = await Promise.all([
            LearningActivity.find({ courseId: { $in: courseIds } }).populate('courseId', 'courseName courseCode').populate('submissions.studentId', 'userName email').sort({ startsAt: 1, dueAt: 1, createdAt: -1 }).lean(),
            Enrollment.aggregate([{ $match: { courseId: { $in: courseIds }, status: { $in: ['active', 'completed'] } } }, { $group: { _id: '$courseId', count: { $sum: 1 } } }]),
            Enrollment.find({ courseId: { $in: courseIds }, status: { $in: ['active', 'completed'] } }).populate('studentId', 'userName email').populate('courseId', 'courseName courseCode').sort({ enrolledAt: -1 }).lean(),
            Lesson.countDocuments({ courseId: { $in: courseIds } }),
        ]);
        const counts = new Map(enrollmentCounts.map((entry) => [String(entry._id), entry.count]));
        const students = new Set(enrollments.map((entry) => String(entry.studentId?._id ?? entry.studentId)).filter(Boolean));
        const stats = {
            courseCount: courses.length,
            approvedCourseCount: courses.filter((course) => course.approvalStatus === 'approved' || (!course.approvalStatus && course.status === true)).length,
            studentCount: students.size,
            lessonCount,
            scheduleCount: activities.filter((item) => item.kind === 'schedule').length,
            assignmentCount: activities.filter((item) => item.kind === 'assignment').length,
            quizCount: activities.filter((item) => item.kind === 'exam').length,
        };
        return res.json({ data: { teacher, stats, activities, enrollments, courses: courses.map((course) => ({ ...course, enrolledCount: counts.get(String(course._id)) ?? 0 })) } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Không thể tải danh sách hoạt động' });
    }
};

const updateActivity = async (req, res) => {
    try {
        const { activityId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(activityId)) return res.status(400).json({ message: 'Mã hoạt động không hợp lệ' });
        const activity = await LearningActivity.findById(activityId);
        if (!activity) return res.status(404).json({ message: 'Không tìm thấy hoạt động học tập' });
        if (!(await canManageActivity(req, activity))) return res.status(403).json({ message: 'Bạn chỉ được quản lý hoạt động thuộc khóa học của mình' });
        const allowed = ['courseId', 'kind', 'title', 'description', 'startsAt', 'dueAt', 'durationMinutes', 'passingScore', 'questions', 'location', 'meetingUrl', 'status'];
        for (const key of allowed) if (req.body?.[key] !== undefined) activity[key] = req.body[key];
        if (!(await canManageActivity(req, activity))) return res.status(403).json({ message: 'Bạn chỉ được chuyển hoạt động vào khóa học của mình' });
        if (typeof activity.title !== 'string' || !activity.title.trim() || !['schedule', 'assignment', 'exam'].includes(activity.kind)) return res.status(400).json({ message: 'Tiêu đề hoặc loại hoạt động không hợp lệ' });
        if (!(await courseModel.exists({ _id: activity.courseId }))) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
        if (activity.kind === 'schedule' && !String(activity.location || '').trim() && !String(activity.meetingUrl || '').trim()) return res.status(400).json({ message: 'Lịch học cần có phòng học hoặc liên kết lớp để học viên tham gia' });
        if (activity.kind === 'exam' && (!activity.startsAt || (!activity.dueAt && !activity.durationMinutes) || (!activity.questions?.length && !String(activity.location || '').trim() && !String(activity.meetingUrl || '').trim()))) return res.status(400).json({ message: 'Bài kiểm tra cần giờ bắt đầu, thời lượng hoặc hạn kết thúc; bài thi tự luận cần phòng thi hoặc liên kết trực tuyến' });
        if (activity.kind === 'exam' && activity.questions?.length && activity.questions.some((question) => !String(question.prompt || '').trim() || !Array.isArray(question.options) || question.options.length < 2 || question.options.some((option) => !String(option).trim()) || !Number.isInteger(Number(question.correctAnswer)) || Number(question.correctAnswer) < 0 || Number(question.correctAnswer) >= question.options.length)) return res.status(400).json({ message: 'Mỗi câu trắc nghiệm cần nội dung, ít nhất 2 đáp án và đáp án đúng hợp lệ' });
        if (activity.startsAt && activity.dueAt && new Date(activity.dueAt) < new Date(activity.startsAt)) return res.status(400).json({ message: 'Hạn hoàn thành không được trước thời gian bắt đầu' });
        await activity.save();
        return res.json({ data: activity, message: 'Đã cập nhật hoạt động học tập' });
    } catch (error) {
        if (error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ message: 'Thông tin hoạt động không hợp lệ' });
        console.error(error);
        return res.status(500).json({ message: 'Không thể cập nhật hoạt động học tập' });
    }
};

const deleteActivity = async (req, res) => {
    try {
        const { activityId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(activityId)) return res.status(400).json({ message: 'Mã hoạt động không hợp lệ' });
        const activity = await LearningActivity.findById(activityId);
        if (!activity) return res.status(404).json({ message: 'Không tìm thấy hoạt động học tập' });
        if (!(await canManageActivity(req, activity))) return res.status(403).json({ message: 'Bạn chỉ được quản lý hoạt động thuộc khóa học của mình' });
        if (activity.submissions.length) return res.status(409).json({ message: 'Không thể xóa hoạt động đã có bài nộp' });
        await activity.deleteOne();
        return res.json({ message: 'Đã xóa hoạt động học tập' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Không thể xóa hoạt động học tập' });
    }
};

const submitActivity = async (req, res) => {
    try {
        const { activityId } = req.params;
        const answer =
            typeof req.body?.answer === "string" ? req.body.answer.trim() : "";
        if (!mongoose.Types.ObjectId.isValid(activityId))
            return res.status(400).json({ message: "Mã hoạt động không hợp lệ" });
        if (!answer)
            return res
                .status(400)
                .json({ message: "Vui lòng nhập câu trả lời hoặc đường dẫn bài làm" });
        const activity = await LearningActivity.findOne({
            _id: activityId,
            kind: { $in: ["assignment", "exam"] },
            status: "published",
        });
        if (!activity)
            return res
                .status(404)
                .json({ message: "Không tìm thấy bài tập hoặc bài kiểm tra" });
        const enrollment = await Enrollment.findOne({
            studentId: req.user._id,
            courseId: activity.courseId,
            status: "active",
        });
        if (!enrollment)
            return res
                .status(403)
                .json({ message: "Bạn chưa đăng ký khóa học chứa hoạt động này" });
        const now = new Date();
        if (
            activity.kind === "exam" &&
            activity.startsAt &&
            new Date(activity.startsAt) > now
        )
            return res.status(400).json({ message: "Bài kiểm tra chưa đến giờ mở" });
        const effectiveDeadline = getActivityDeadline(activity);
        if (effectiveDeadline && effectiveDeadline < now)
            return res
                .status(400)
                .json({
                    message:
                        activity.kind === "exam"
                            ? "Đã hết thời gian làm bài kiểm tra"
                            : "Đã quá hạn nộp bài",
                });
        let autoGrade = null;
        if (activity.kind === 'exam' && activity.questions?.length) {
            let selected;
            try { selected = JSON.parse(answer); } catch { return res.status(400).json({ message: 'Đáp án bài trắc nghiệm không hợp lệ' }); }
            if (!selected || typeof selected !== 'object' || Array.isArray(selected)) return res.status(400).json({ message: 'Đáp án bài trắc nghiệm không hợp lệ' });
            const correct = activity.questions.reduce((count, question, index) => count + (Number(selected[index]) === question.correctAnswer ? 1 : 0), 0);
            const score = Math.round(correct / activity.questions.length * 100);
            autoGrade = { score, feedback: score >= activity.passingScore ? 'Đạt điểm yêu cầu' : 'Chưa đạt điểm yêu cầu' };
        }
        const submission = activity.submissions.find(
            (item) => String(item.studentId) === String(req.user._id),
        );
        if (submission) {
            if (submission.score !== undefined && submission.score !== null) return res.status(409).json({ message: 'Bài nộp đã được chấm điểm và không thể chỉnh sửa' });
            submission.answer = answer;
            submission.submittedAt = new Date();
            if (autoGrade) { submission.score = autoGrade.score; submission.feedback = autoGrade.feedback; }
        } else {
            activity.submissions.push({
                studentId: req.user._id,
                answer,
                submittedAt: new Date(),
                ...(autoGrade || {}),
            });
        }
        await activity.save();
        const saved = activity.submissions.find(
            (item) => String(item.studentId) === String(req.user._id),
        );
        return res.json({
            data: { submittedAt: saved.submittedAt },
            message: "Nộp bài thành công",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Không thể nộp bài lúc này" });
    }
};

const createActivity = async (req, res) => {
    try {
        const {
            courseId,
            kind,
            title,
            description,
            startsAt,
            dueAt,
            durationMinutes,
            passingScore,
            questions,
            location,
            meetingUrl,
            status,
        } = req.body || {};
        if (
            !mongoose.Types.ObjectId.isValid(courseId) ||
            !["schedule", "assignment", "exam"].includes(kind) ||
            typeof title !== 'string' ||
            !title.trim()
        ) {
            return res
                .status(400)
                .json({ message: "Cần mã khóa học, loại hoạt động hợp lệ và tiêu đề" });
        }
        const course = await courseModel.findById(courseId).select('_id').lean();
        if (!course)
            return res.status(404).json({ message: "Không tìm thấy khóa học" });
        if (req.user.role === 'teacher') {
            const scope = await getTeacherScope(req.user);
            if (scope.error) return res.status(403).json({ message: scope.error });
            if (!scope.courseIds.some((id) => String(id) === String(courseId))) return res.status(403).json({ message: 'Bạn chỉ được tạo hoạt động cho khóa học được phân công' });
        }
        if (kind === 'schedule' && !String(location || '').trim() && !String(meetingUrl || '').trim()) return res.status(400).json({ message: 'Lịch học cần có phòng học hoặc liên kết lớp để học viên tham gia' });
        if (kind === 'exam' && (!startsAt || (!dueAt && !durationMinutes) || (!questions?.length && !String(location || '').trim() && !String(meetingUrl || '').trim()))) return res.status(400).json({ message: 'Bài kiểm tra cần giờ bắt đầu, thời lượng hoặc hạn kết thúc; bài thi tự luận cần phòng thi hoặc liên kết trực tuyến' });
        if (kind === 'exam' && questions?.length && questions.some((question) => !String(question.prompt || '').trim() || !Array.isArray(question.options) || question.options.length < 2 || question.options.some((option) => !String(option).trim()) || !Number.isInteger(Number(question.correctAnswer)) || Number(question.correctAnswer) < 0 || Number(question.correctAnswer) >= question.options.length)) return res.status(400).json({ message: 'Mỗi câu trắc nghiệm cần nội dung, ít nhất 2 đáp án và đáp án đúng hợp lệ' });
        if (startsAt && dueAt && new Date(dueAt) < new Date(startsAt)) return res.status(400).json({ message: 'Hạn hoàn thành không được trước thời gian bắt đầu' });
        const activity = await LearningActivity.create({
            courseId,
            kind,
            title: title.trim(),
            description,
            startsAt,
            dueAt,
            durationMinutes,
            passingScore: Number(passingScore ?? 60),
            questions: kind === 'exam' ? questions ?? [] : [],
            location,
            meetingUrl,
            status,
        });
        return res
            .status(201)
            .json({ data: activity, message: "Đã tạo hoạt động học tập" });
    } catch (error) {
        if (error.name === "ValidationError" || error.name === "CastError")
            return res
                .status(400)
                .json({
                    message: "Thông tin hoạt động không hợp lệ",
                    error: error.message,
                });
        console.error(error);
        return res.status(500).json({ message: "Không thể tạo hoạt động học tập" });
    }
};

const gradeSubmission = async (req, res) => {
    try {
        const { activityId, studentId } = req.params;
        const { score, feedback = "" } = req.body || {};
        if (
            !mongoose.Types.ObjectId.isValid(activityId) ||
            !mongoose.Types.ObjectId.isValid(studentId)
        )
            return res
                .status(400)
                .json({ message: "Mã hoạt động hoặc học viên không hợp lệ" });
        const numericScore = Number(score);
        if (
            !Number.isFinite(numericScore) ||
            numericScore < 0 ||
            numericScore > 100
        )
            return res
                .status(400)
                .json({ message: "Điểm phải nằm trong khoảng 0 đến 100" });
        const activity = await LearningActivity.findById(activityId);
        if (!activity)
            return res
                .status(404)
                .json({ message: "Không tìm thấy hoạt động học tập" });
        if (!(await canManageActivity(req, activity))) return res.status(403).json({ message: 'Bạn chỉ được chấm bài thuộc khóa học của mình' });
        const submission = activity.submissions.find(
            (item) => String(item.studentId) === studentId,
        );
        if (!submission)
            return res.status(404).json({ message: "Học viên chưa nộp bài" });
        submission.score = numericScore;
        submission.feedback = String(feedback).trim();
        await activity.save();
        return res.json({
            message: "Đã lưu điểm và nhận xét",
            data: {
                activityId,
                studentId,
                score: numericScore,
                feedback: submission.feedback,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Không thể lưu kết quả chấm điểm" });
    }
};

const updateProgress = async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        const progress = Number(req.body?.progress);
        const completedLessons =
            req.body?.completedLessons === undefined
                ? undefined
                : Number(req.body.completedLessons);
        if (!mongoose.Types.ObjectId.isValid(enrollmentId))
            return res
                .status(400)
                .json({ message: "Mã đăng ký khóa học không hợp lệ" });
        if (!Number.isFinite(progress) || progress < 0 || progress > 100)
            return res
                .status(400)
                .json({ message: "Tiến độ phải nằm trong khoảng 0 đến 100" });
        if (
            completedLessons !== undefined &&
            (!Number.isInteger(completedLessons) || completedLessons < 0)
        )
            return res
                .status(400)
                .json({ message: "Số bài học hoàn thành không hợp lệ" });
        const updates = {
            progress,
            status: progress === 100 ? "completed" : "active",
        };
        if (completedLessons !== undefined)
            updates.completedLessons = completedLessons;
        let enrollmentFilter = { _id: enrollmentId };
        if (req.user.role === 'teacher') {
            const scope = await getTeacherScope(req.user);
            if (scope.error) return res.status(403).json({ message: scope.error });
            enrollmentFilter.courseId = { $in: scope.courseIds };
        }
        const enrollment = await Enrollment.findOneAndUpdate(
            enrollmentFilter,
            updates,
            { new: true, runValidators: true },
        );
        if (!enrollment)
            return res
                .status(404)
                .json({ message: "Không tìm thấy đăng ký khóa học" });
        return res.json({
            data: enrollment,
            message: "Đã cập nhật tiến độ học tập",
        });
    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: "Không thể cập nhật tiến độ học tập" });
    }
};

module.exports = {
    isStudent,
    isStaff,
    getCatalog,
    enrollCourse,
    getMyLearning,
    getManageActivities,
    submitActivity,
    createActivity,
    updateActivity,
    deleteActivity,
    gradeSubmission,
    updateProgress,
};
