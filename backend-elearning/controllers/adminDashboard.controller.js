const Auth = require('../models/auth.model.js');
const StudentModel = require('../models/student.model.js');
const Enrollment = require('../models/enrollment.model.js');
const { courseModel } = require('../models/course.model.js');

const getDashboard = async (_req, res) => {
    try {
        const now = new Date();
        const firstMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const [studentCount, teacherCount, courseCount, enrollmentCount, monthlyStudents, latestCourses, enrollmentStatuses, pendingCourses] = await Promise.all([
            StudentModel.countDocuments(),
            Auth.countDocuments({ role: 'teacher' }),
            courseModel.countDocuments(),
            Enrollment.countDocuments(),
            StudentModel.aggregate([
                { $match: { createdAt: { $gte: firstMonth } } },
                { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
            ]),
            courseModel.find().sort({ createdAt: -1 }).limit(6).select('courseCode courseName teacherName createdAt status approvalStatus').lean(),
            Enrollment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
            courseModel.countDocuments({ approvalStatus: 'pending' }),
        ]);
        const months = [];
        for (let offset = 5; offset >= 0; offset--) {
            const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
            const match = monthlyStudents.find((item) => item._id.year === date.getFullYear() && item._id.month === date.getMonth() + 1);
            months.push({ year: date.getFullYear(), month: date.getMonth() + 1, label: new Intl.DateTimeFormat('vi-VN', { month: 'short' }).format(date), count: match?.count ?? 0 });
        }
        return res.json({ data: {
            totals: { students: studentCount, teachers: teacherCount, courses: courseCount, enrollments: enrollmentCount, pendingCourses },
            studentTrend: months,
            enrollmentStatuses: Object.fromEntries(enrollmentStatuses.map((item) => [item._id, item.count])),
            latestCourses,
            revenue: null,
        } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Không tải được dashboard quản trị' });
    }
};

module.exports = { getDashboard };
