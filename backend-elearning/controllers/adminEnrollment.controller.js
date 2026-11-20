const mongoose = require("mongoose");
const Enrollment = require("../models/enrollment.model.js");
const Auth = require("../models/auth.model.js");
const { courseModel } = require("../models/course.model.js");
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const listEnrollments = async (req, res) => {
    try {
        const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(
            Math.max(Number.parseInt(req.query.limit, 10) || 10, 1),
            100,
        );
        const filter = {};
        // Lọc theo trạng thái
        if (["active", "completed", "cancelled"].includes(req.query.status))
            filter.status = req.query.status;
          // Lọc theo khóa học
        if (
            req.query.courseId &&
            mongoose.Types.ObjectId.isValid(req.query.courseId)
        )
            filter.courseId = req.query.courseId;
        const q = String(req.query.q || "").trim();
        if (q) {
            const pattern = new RegExp(escapeRegex(q), "i");
            const [users, courses] = await Promise.all([
                Auth.find({ $or: [{ userName: pattern }, { email: pattern }] })
                    .select("_id")
                    .lean(),
                courseModel
                    .find({ $or: [{ courseName: pattern }, { courseCode: pattern }] })
                    .select("_id")
                    .lean(),
            ]);
            filter.$or = [
                { studentId: { $in: users.map((user) => user._id) } },
                { courseId: { $in: courses.map((course) => course._id) } },
            ];
        }
           // Lấy dữ liệu và tổng số bản ghi
        const [data, total] = await Promise.all([
            Enrollment.find(filter)
                .populate("studentId", "userName email role")
                .populate("courseId", "courseCode courseName teacherName")
                .sort({ enrolledAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Enrollment.countDocuments(filter),
        ]);
          // Tính tổng số trang
        const totalPages = Math.ceil(total / limit);
        return res.json({
            result: {
                data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                },
            },
        });
    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: "Không tải được danh sách đăng ký khóa học" });
    }
};

const updateEnrollment = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ message: "ID đăng ký không hợp lệ" });
        const updates = {};
        if (req.body?.status !== undefined) {
            if (!["active", "completed", "cancelled"].includes(req.body.status))
                return res
                    .status(400)
                    .json({ message: "Trạng thái đăng ký không hợp lệ" });
            updates.status = req.body.status;
        }
        if (req.body?.progress !== undefined) {
            const progress = Number(req.body.progress);
            if (!Number.isFinite(progress) || progress < 0 || progress > 100)
                return res
                    .status(400)
                    .json({ message: "Tiến độ phải nằm trong khoảng 0 đến 100" });
            updates.progress = progress;
        }
        if (req.body?.completedLessons !== undefined) {
            const completedLessons = Number(req.body.completedLessons);
            if (!Number.isInteger(completedLessons) || completedLessons < 0)
                return res
                    .status(400)
                    .json({ message: "Số buổi hoàn thành không hợp lệ" });
            updates.completedLessons = completedLessons;
        }
        if (!Object.keys(updates).length)
            return res
                .status(400)
                .json({ message: "Không có thông tin cần cập nhật" });
        const data = await Enrollment.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        })
            .populate("studentId", "userName email")
            .populate("courseId", "courseCode courseName");
        if (!data)
            return res
                .status(404)
                .json({ message: "Không tìm thấy đăng ký khóa học" });
        return res.json({ data, message: "Đã cập nhật đăng ký khóa học" });
    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: "Không cập nhật được đăng ký khóa học" });
    }
};

module.exports = { listEnrollments, updateEnrollment };
