const Section = require("../models/section.model.js");
const Lesson = require("../models/lesson.model.js");
const Quiz = require("../models/quiz.model.js");
const Question = require("../models/question.model.js");
const QuizAttempt = require("../models/quizAttempt.model.js");
const Enrollment = require("../models/enrollment.model.js");
const Notification = require("../models/notification.model.js");
const { courseModel } = require("../models/course.model.js");
const { findTeacherProfile } = require("../utils/teacherProfileLookup.js");

const assertCourseAccess = async (courseId, user) => {
  const course = await courseModel
    .findById(courseId)
    .select("_id teacherId teacherProfileId")
    .lean();
  if (!course) {
    const error = new Error("Không tìm thấy khóa học");
    error.statusCode = 404;
    throw error;
  }
  if (user.role === "admin") return course;
  const teacher = await findTeacherProfile(user);
  const identifiers = [
    teacher?.teacherCode,
    String(teacher?._id || ""),
    String(user._id),
    String(user.userName || ""),
  ].map(String);
  if (
    user.role !== "teacher" ||
    !teacher ||
    (String(course.teacherProfileId || "") !== String(teacher._id) &&
      !identifiers.some(
        (value) =>
          value.toLowerCase() === String(course.teacherId || "").toLowerCase(),
      ))
  ) {
    const error = new Error("Bạn không có quyền quản lý nội dung khóa học này");
    error.statusCode = 403;
    throw error;
  }
  return course;
};

const paging = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};
const pageResult = (data, total, page, limit) => ({
  data,
  pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
});

const listSections = async ({ courseId, ...query }, user) => {
  const { page, limit, skip } = paging(query);
  const filter = courseId ? { courseId } : {};
  if (user.role === "student") {
    const enrolled = await Enrollment.find({
      studentId: user._id,
      status: { $in: ["active", "completed"] },
    })
      .select("courseId")
      .lean();
    const enrolledIds = enrolled.map((item) => item.courseId);
    filter.courseId = courseId
      ? { $in: enrolledIds.filter((id) => String(id) === String(courseId)) }
      : { $in: enrolledIds };
    filter.status = "published";
  } else if (user.role === "teacher") {
    const teacher = await findTeacherProfile(user);
    if (!teacher) return pageResult([], 0, page, limit);
    const ids = [
      teacher.teacherCode,
      String(teacher._id),
      String(user._id),
      String(user.userName || ""),
    ].filter(Boolean);
    const owned = await courseModel
      .find({
        $or: [{ teacherProfileId: teacher._id }, { teacherId: { $in: ids } }],
      })
      .distinct("_id");
    filter.courseId = courseId
      ? { $in: owned.filter((id) => String(id) === String(courseId)) }
      : { $in: owned };
  }
  const [data, total] = await Promise.all([
    Section.find(filter)
      .sort({ courseId: 1, order: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Section.countDocuments(filter),
  ]);
  return pageResult(data, total, page, limit);
};
const createSection = async (data, user) => {
  await assertCourseAccess(data.courseId, user);
  return Section.create(data);
};
const updateSection = async (id, data, user) => {
  const current = await Section.findById(id);
  if (!current) return null;
  await assertCourseAccess(data.courseId || current.courseId, user);
  return Section.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};
const deleteSection = async (id, user) => {
  const section = await Section.findById(id);
  if (!section) return null;
  await assertCourseAccess(section.courseId, user);
  if (await Lesson.exists({ sectionId: id })) {
    const error = new Error("Chương vẫn còn bài học, không thể xóa");
    error.statusCode = 409;
    throw error;
  }
  await section.deleteOne();
  return section;
};

const listQuizzes = async ({ courseId, status, ...query }, user) => {
  const { page, limit, skip } = paging(query);
  const filter = {};
  const keyword = String(query.q || '').trim();
  if (keyword) filter.title = { $regex: keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  if (courseId) filter.courseId = courseId;
  if (user.role === "student") {
    const enrollments = await Enrollment.find({
      studentId: user._id,
      status: { $in: ["active", "completed"] },
    })
      .select("courseId")
      .lean();
    filter.courseId = { $in: enrollments.map((entry) => entry.courseId) };
    filter.status = "published";
  } else {
    if (status) filter.status = status;
    if (user.role === "teacher") {
      const teacher = await findTeacherProfile(user);
      if (!teacher) return pageResult([], 0, page, limit);
      const ids = [
        teacher.teacherCode,
        String(teacher._id),
        String(user._id),
        String(user.userName || ""),
      ].filter(Boolean);
      const owned = await courseModel
        .find({
          $or: [{ teacherProfileId: teacher._id }, { teacherId: { $in: ids } }],
        })
        .distinct("_id");
      filter.courseId = courseId
        ? { $in: owned.filter((id) => String(id) === String(courseId)) }
        : { $in: owned };
    }
  }
  const [data, total] = await Promise.all([
    Quiz.find(filter)
      .populate("courseId", "courseName courseCode")
      .sort({ startsAt: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Quiz.countDocuments(filter),
  ]);
  return pageResult(data, total, page, limit);
};
const createQuiz = async (data, user) => {
  await assertCourseAccess(data.courseId, user);
  return Quiz.create({ ...data, createdBy: user._id });
};
const getQuiz = async (id, user) => {
  const quiz = await Quiz.findById(id)
    .populate("courseId", "courseName courseCode")
    .lean();
  if (!quiz) return null;
  if (user.role === "student") {
    const enrolled = await Enrollment.exists({
      studentId: user._id,
      courseId: quiz.courseId?._id,
      status: { $in: ["active", "completed"] },
    });
    if (!enrolled || quiz.status !== "published") return null;
  } else await assertCourseAccess(quiz.courseId?._id, user);
  return quiz;
};
const updateQuiz = async (id, data, user) => {
  const current = await Quiz.findById(id);
  if (!current) return null;
  await assertCourseAccess(data.courseId || current.courseId, user);
  return Quiz.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};
const deleteQuiz = async (id, user) => {
  const quiz = await Quiz.findById(id);
  if (!quiz) return null;
  await assertCourseAccess(quiz.courseId, user);
  if (await QuizAttempt.exists({ quizId: id })) {
    const error = new Error("Bài kiểm tra đã có lượt làm, không thể xóa");
    error.statusCode = 409;
    throw error;
  }
  await Question.deleteMany({ quizId: id });
  return Quiz.findByIdAndDelete(id);
};

const listQuestions = async (quizId, user) => {
  const quiz = await Quiz.findById(quizId).select("status courseId").lean();
  if (!quiz) return null;
  if (user.role === "student") {
    const enrolled = await Enrollment.exists({
      studentId: user._id,
      courseId: quiz.courseId,
      status: { $in: ["active", "completed"] },
    });
    if (!enrolled || quiz.status !== "published") return [];
    return Question.find({ quizId })
      .select("-correctAnswerIndex")
      .sort({ order: 1 })
      .lean();
  } else await assertCourseAccess(quiz.courseId, user);
  return Question.find({ quizId }).sort({ order: 1 }).lean();
};
const createQuestion = async (data, user) => {
  const quiz = await Quiz.findById(data.quizId).select("courseId");
  if (!quiz) return null;
  await assertCourseAccess(quiz.courseId, user);
  if (data.order === undefined)
    data.order = await Question.countDocuments({ quizId: data.quizId });
  return Question.create(data);
};
const updateQuestion = async (id, data, user) => {
  const question = await Question.findById(id);
  if (!question) return null;
  const quiz = await Quiz.findById(question.quizId).select("courseId");
  if (!quiz) return null;
  await assertCourseAccess(quiz.courseId, user);
  return Question.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};
const deleteQuestion = async (id, user) => {
  const question = await Question.findById(id);
  if (!question) return null;
  const quiz = await Quiz.findById(question.quizId).select("courseId");
  if (!quiz) return null;
  await assertCourseAccess(quiz.courseId, user);
  return Question.findByIdAndDelete(id);
};

const submitQuiz = async (quizId, studentId, answers) => {
  const quiz = await Quiz.findOne({ _id: quizId, status: "published" }).lean();
  if (!quiz)
    return { error: "Không tìm thấy bài kiểm tra đang mở", status: 404 };
  const now = new Date();
  if (quiz.startsAt && quiz.startsAt > now)
    return { error: "Bài kiểm tra chưa mở", status: 400 };
  if (quiz.dueAt && quiz.dueAt < now)
    return { error: "Bài kiểm tra đã hết hạn", status: 400 };
  const enrolled = await Enrollment.exists({
    studentId,
    courseId: quiz.courseId,
    status: { $in: ["active", "completed"] },
  });
  if (!enrolled) return { error: "Bạn chưa đăng ký khóa học này", status: 403 };
  const questions = await Question.find({ quizId }).sort({ order: 1 }).lean();
  if (!questions.length)
    return { error: "Bài kiểm tra chưa có câu hỏi", status: 400 };
  const answerMap = new Map(
    (Array.isArray(answers) ? answers : []).map((answer) => [
      String(answer.questionId),
      Number(answer.selectedOptionIndex),
    ]),
  );
  for (const question of questions) {
    const selected = answerMap.get(String(question._id));
    if (
      selected !== undefined &&
      (!Number.isInteger(selected) ||
        selected < 0 ||
        selected >= question.options.length)
    )
      return { error: "Đáp án gửi lên không hợp lệ", status: 400 };
  }
  const totalPoints = questions.reduce(
    (total, question) => total + question.points,
    0,
  );
  if (totalPoints <= 0)
    return {
      error: "Bài kiểm tra chưa thiết lập điểm câu hỏi hợp lệ",
      status: 400,
    };
  const score = Math.round(
    (questions.reduce(
      (total, question) =>
        total +
        (answerMap.get(String(question._id)) === question.correctAnswerIndex
          ? question.points
          : 0),
      0,
    ) /
      totalPoints) *
    100,
  );
  const attemptNumber =
    (await QuizAttempt.countDocuments({ quizId, studentId })) + 1;
  const attempt = await QuizAttempt.create({
    quizId,
    studentId,
    courseId: quiz.courseId,
    attemptNumber,
    answers: questions
      .filter((question) => answerMap.has(String(question._id)))
      .map((question) => ({
        questionId: question._id,
        selectedOptionIndex: answerMap.get(String(question._id)),
      })),
    score,
    feedback:
      score >= quiz.passingScore ? "Đạt điểm yêu cầu" : "Chưa đạt điểm yêu cầu",
  });
  return { attempt, questions };
};
const listAttempts = async (studentId, query, user) => {
  const { page, limit, skip } = paging(query);
  const filter = studentId ? { studentId } : {};
  if (query.quizId) filter.quizId = query.quizId;
  if (user.role === "teacher") {
    const teacher = await findTeacherProfile(user);
    if (!teacher) return pageResult([], 0, page, limit);
    const ids = [
      teacher.teacherCode,
      String(teacher._id),
      String(user._id),
      String(user.userName || ""),
    ].filter(Boolean);
    const ownedCourseIds = await courseModel
      .find({
        $or: [{ teacherProfileId: teacher._id }, { teacherId: { $in: ids } }],
      })
      .distinct("_id");
    filter.courseId = { $in: ownedCourseIds };
  }
  const [data, total] = await Promise.all([
    QuizAttempt.find(filter)
      .populate("quizId", "title passingScore")
      .populate("courseId", "courseName courseCode")
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    QuizAttempt.countDocuments(filter),
  ]);
  return pageResult(data, total, page, limit);
};

const listNotifications = async (userId, query) => {
  const { page, limit, skip } = paging(query);
  const filter = { recipientId: userId };
  if (query.unread === "true") filter.readAt = null;
  const [data, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
  ]);
  return pageResult(data, total, page, limit);
};
const markNotificationRead = (id, userId) =>
  Notification.findOneAndUpdate(
    { _id: id, recipientId: userId },
    { $set: { readAt: new Date() } },
    { new: true },
  );
const createNotification = (data, actorId) => Notification.create({ ...data, actorId });

module.exports = {
  listSections,
  createSection,
  updateSection,
  deleteSection,
  listQuizzes,
  createQuiz,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  submitQuiz,
  listAttempts,
  listNotifications,
  createNotification,
  markNotificationRead,
};
