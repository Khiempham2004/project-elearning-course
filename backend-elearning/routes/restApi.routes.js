const express = require('express');
const { verifyToken, authorize } = require('../middleware/auth.middleware.js');
const { validateObjectId, validateRequired } = require('../middleware/request.middleware.js');
const { validateQuiz, validateQuestion } = require('../validators/learning.validator.js');
const c = require('../controllers/restApi.controller.js');

const router = express.Router();
router.use(verifyToken);
const staff = authorize('admin', 'teacher');
const management = authorize('admin');

router.get('/sections', authorize('admin', 'teacher', 'student'), c.listSections);
router.post('/sections', staff, validateRequired('courseId', 'title'), c.createSection);
router.put('/sections/:id', staff, validateObjectId(), c.updateSection);
router.delete('/sections/:id', staff, validateObjectId(), c.deleteSection);

router.get('/quizzes', authorize('admin', 'teacher', 'student'), c.listQuizzes);
router.post('/quizzes', staff, validateQuiz(), c.createQuiz);
router.get('/quizzes/:id', authorize('admin', 'teacher', 'student'), validateObjectId(), c.getQuiz);
router.put('/quizzes/:id', staff, validateObjectId(), validateQuiz(true), c.updateQuiz);
router.delete('/quizzes/:id', staff, validateObjectId(), c.deleteQuiz);
router.get('/quizzes/:quizId/questions', authorize('admin', 'teacher', 'student'), validateObjectId('quizId'), c.listQuestions);
router.post('/quizzes/:quizId/questions', staff, validateObjectId('quizId'), validateQuestion(), c.createQuestion);
router.get('/questions', authorize('admin', 'teacher', 'student'), c.listQuestions);
router.post('/questions', staff, validateRequired('quizId'), validateQuestion(), c.createQuestion);
router.put('/questions/:id', staff, validateObjectId(), validateQuestion(true), c.updateQuestion);
router.delete('/questions/:id', staff, validateObjectId(), c.deleteQuestion);
router.post('/quizzes/:quizId/attempts', authorize('student'), validateObjectId('quizId'), validateRequired('answers'), c.submitQuiz);
router.get('/quiz-attempts', authorize('admin', 'teacher', 'student'), c.listAttempts);
router.post('/quiz-attempts', authorize('student'), validateRequired('quizId', 'answers'), c.submitQuiz);

router.get('/notifications', authorize('admin', 'teacher', 'student', 'directory'), c.listNotifications);
router.post('/notifications', management, validateRequired('recipientId', 'type', 'title', 'message'), c.createNotification);
router.patch('/notifications/:id/read', authorize('admin', 'teacher', 'student', 'directory'), validateObjectId(), c.markNotificationRead);

module.exports = router;
