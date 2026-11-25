const express = require("express");
const { verifyToken, authorize } = require("../middleware/auth.middleware.js");
const courses = require("../controllers/course.controller.js");
const users = require("../controllers/adminUsers.controller.js");
const categories = require("../controllers/courseCategory.controller.js");
const enrollments = require("../controllers/adminEnrollment.controller.js");
const learning = require("../controllers/studentLearning.controller.js");
const lessons = require("../controllers/lesson.controller.js");
const { courseModel } = require("../models/course.model.js");

const routes = express.Router();
routes.use(verifyToken);

const courseRoutes = express.Router();
courseRoutes.get(
  "/",
  authorize("admin", "course", "teacher", "student"),
  (req, res, next) =>
    req.user.role === "student"
      ? learning.getCatalog(req, res, next)
      : courses.getAllCourse(req, res, next),
);
courseRoutes.get("/:courseId/lessons", authorize("admin", "teacher"), lessons.listLessons);
courseRoutes.post("/:courseId/lessons", authorize("admin", "teacher"), lessons.saveLesson);
courseRoutes.put("/:courseId/lessons/:lessonId", authorize("admin", "teacher"), lessons.saveLesson);
courseRoutes.delete("/:courseId/lessons/:lessonId", authorize("admin", "teacher"), lessons.deleteLesson);
courseRoutes.patch("/:id/review", authorize("admin"), courses.reviewCourse);
courseRoutes.get(
  "/:id",
  authorize("admin", "course", "teacher", "student"),
  async (req, res, next) => {
    if (req.user.role !== "student")
      return courses.getCourseById(req, res, next);
    try {
      const course = await courseModel
        .findOne({
          _id: req.params.id,
          status: true,
          $or: [
            { approvalStatus: "approved" },
            { approvalStatus: { $exists: false } },
          ],
        })
        .populate("categoryId", "name")
        .populate("teacherProfileId", "teacherCode fullName")
        .lean();
      if (!course)
        return res.status(404).json({ message: "Không tìm thấy khóa học" });
      return res.json({ data: course, message: "Lấy khóa học thành công" });
    } catch (error) {
      return next(error);
    }
  },
);
courseRoutes.post("/", authorize("admin", "teacher"), courses.createCourse);
courseRoutes.put("/:id", authorize("admin", "teacher"), courses.updateCourse);
courseRoutes.delete("/:id", authorize("admin", "teacher"), courses.deleteCourse);
routes.use("/courses", courseRoutes);

const userRoutes = express.Router();
userRoutes.use(authorize("admin"));
userRoutes.get("/", users.listUsers);
userRoutes.post("/", users.createUser);
userRoutes.put("/:id", users.updateUser);
userRoutes.patch("/:id", users.updateUser);
userRoutes.delete("/:id", users.deleteUser);
routes.use("/users", userRoutes);

const categoryRoutes = express.Router();
categoryRoutes.get("/", authorize("admin", "course", "teacher", "student"), categories.listCategories);
categoryRoutes.post("/", authorize("admin"), categories.createCategory);
categoryRoutes.put("/:id", authorize("admin"), categories.updateCategory);
categoryRoutes.delete("/:id", authorize("admin"), categories.deleteCategory);
routes.use("/categories", categoryRoutes);

const enrollmentRoutes = express.Router();
enrollmentRoutes.get("/", authorize("admin"), enrollments.listEnrollments);
enrollmentRoutes.post("/", authorize("student"), learning.enrollCourse);
enrollmentRoutes.get("/my-courses", authorize("student"), learning.getMyCourses);
enrollmentRoutes.get("/:courseId", authorize("student"), learning.getEnrollmentByCourse,);
enrollmentRoutes.patch("/:id", authorize("admin"), enrollments.updateEnrollment);
enrollmentRoutes.post("/:courseId", authorize("student"), learning.enrollCourse);
enrollmentRoutes.get("/me", authorize("student"), learning.getMyLearning);
routes.use("/enrollments", enrollmentRoutes);

const lessonRoutes = express.Router();
lessonRoutes.get(
  "/:courseId",
  authorize("admin", "teacher", "student"),
  (req, res, next) =>
    req.user.role === "student"
      ? learning.getCourseLessons(req, res, next)
      : lessons.listLessons(req, res, next),
);
lessonRoutes.post("/:courseId",authorize("admin", "teacher"),lessons.saveLesson);
lessonRoutes.put("/:courseId/:lessonId",authorize("admin", "teacher"),lessons.saveLesson);
lessonRoutes.delete("/:courseId/:lessonId",authorize("admin", "teacher"),lessons.deleteLesson);
routes.use("/lessons", lessonRoutes);

const progressRoutes = express.Router();
progressRoutes.get("/courses/:courseId",authorize("student"),learning.getCourseLessons);
progressRoutes.post("/enrollments/:enrollmentId/lessons/:lessonId/complete",authorize("student"),learning.completeLesson);
progressRoutes.post("/enrollments/:enrollmentId/lessons/:lessonId/view",authorize("student"),learning.rememberLesson);
progressRoutes.put("/enrollments/:enrollmentId",authorize("admin", "teacher"),learning.updateProgress);
routes.use("/progress", progressRoutes);

module.exports = routes;
