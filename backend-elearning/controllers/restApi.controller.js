const service = require('../services/restApi.service.js');
const success = (res, data, message = 'Thành công', status = 200) => res.status(status).json({ success: true, message, data });

const wrap = (fn) => async (req, res, next) => { try { await fn(req, res, next); } catch (error) { next(error); } };
const listSections = wrap(async (req, res) => success(res, await service.listSections(req.query, req.user)));
const createSection = wrap(async (req, res) => success(res, await service.createSection(req.body, req.user), 'Đã tạo chương', 201));
const updateSection = wrap(async (req, res) => { const data = await service.updateSection(req.params.id, req.body, req.user); return data ? success(res, data) : res.status(404).json({ success: false, message: 'Không tìm thấy chương' }); });
const deleteSection = wrap(async (req, res) => { const data = await service.deleteSection(req.params.id, req.user); return data ? success(res, data, 'Đã xóa chương') : res.status(404).json({ success: false, message: 'Không tìm thấy chương' }); });

const listQuizzes = wrap(async (req, res) => success(res, await service.listQuizzes(req.query, req.user)));
const getQuiz = wrap(async (req, res) => { const data = await service.getQuiz(req.params.id, req.user); return data ? success(res, data) : res.status(404).json({ success: false, message: 'Không tìm thấy bài kiểm tra' }); });
const createQuiz = wrap(async (req, res) => success(res, await service.createQuiz(req.body, req.user), 'Đã tạo bài kiểm tra', 201));
const updateQuiz = wrap(async (req, res) => { const data = await service.updateQuiz(req.params.id, req.body, req.user); return data ? success(res, data) : res.status(404).json({ success: false, message: 'Không tìm thấy bài kiểm tra' }); });
const deleteQuiz = wrap(async (req, res) => { const data = await service.deleteQuiz(req.params.id, req.user); return data ? success(res, data, 'Đã xóa bài kiểm tra') : res.status(404).json({ success: false, message: 'Không tìm thấy bài kiểm tra' }); });

const listQuestions = wrap(async (req, res) => { const quizId = req.params.quizId || req.query.quizId; if (!quizId) return res.status(400).json({ success: false, message: 'Cần cung cấp quizId' }); const data = await service.listQuestions(quizId, req.user); if (data === null) return res.status(404).json({ success: false, message: 'Không tìm thấy bài kiểm tra' }); return success(res, data); });
const createQuestion = wrap(async (req, res) => { const data = await service.createQuestion({ ...req.body, quizId: req.params.quizId || req.body.quizId }, req.user); return data ? success(res, data, 'Đã thêm câu hỏi', 201) : res.status(404).json({ success: false, message: 'Không tìm thấy bài kiểm tra' }); });
const updateQuestion = wrap(async (req, res) => { const data = await service.updateQuestion(req.params.id, req.body, req.user); return data ? success(res, data) : res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi' }); });
const deleteQuestion = wrap(async (req, res) => { const data = await service.deleteQuestion(req.params.id, req.user); return data ? success(res, data, 'Đã xóa câu hỏi') : res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi' }); });

const submitQuiz = wrap(async (req, res) => { const quizId = req.params.quizId || req.body?.quizId; if (!quizId) return res.status(400).json({ success: false, message: 'Cần cung cấp quizId' }); const result = await service.submitQuiz(quizId, req.user._id, req.body?.answers); if (result.error) return res.status(result.status).json({ success: false, message: result.error }); return success(res, { attempt: result.attempt, questions: result.questions.map((question) => ({ _id: question._id, correctAnswerIndex: question.correctAnswerIndex })) }, 'Đã nộp bài và chấm điểm'); });
const listAttempts = wrap(async (req, res) => { const studentId = req.user.role === 'student' ? req.user._id : req.query.studentId; return success(res, await service.listAttempts(studentId, req.query, req.user)); });
const listNotifications = wrap(async (req, res) => success(res, await service.listNotifications(req.user._id, req.query)));
const createNotification = wrap(async (req, res) => success(res, await service.createNotification(req.body, req.user._id), 'Đã tạo thông báo', 201));
const markNotificationRead = wrap(async (req, res) => { const data = await service.markNotificationRead(req.params.id, req.user._id); return data ? success(res, data, 'Đã đánh dấu đã đọc') : res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' }); });

module.exports = { listSections, createSection, updateSection, deleteSection, listQuizzes, createQuiz, getQuiz, updateQuiz, deleteQuiz, listQuestions, createQuestion, updateQuestion, deleteQuestion, submitQuiz, listAttempts, listNotifications, createNotification, markNotificationRead };
