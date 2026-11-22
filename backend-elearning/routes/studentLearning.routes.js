const express = require('express');
const { verifyToken, authorize } = require('../middleware/auth.middleware.js');
const { getCatalog, getCourseDetail, enrollCourse, getMyLearning, getManageActivities, submitActivity, createActivity, updateActivity, deleteActivity, gradeSubmission, updateProgress, getCourseLessons, completeLesson, rememberLesson } = require('../controllers/studentLearning.controller.js');

const router = express.Router();
router.use(verifyToken);
router.get('/catalog', authorize('student'), getCatalog);
router.get('/courses/:courseId/detail', authorize('student'), getCourseDetail);
router.post('/enroll/:courseId', authorize('student'), enrollCourse);
router.get('/courses/:courseId/lessons', authorize('student'), getCourseLessons);
router.post('/enrollments/:enrollmentId/lessons/:lessonId/complete', authorize('student'), completeLesson);
router.post('/enrollments/:enrollmentId/lessons/:lessonId/view', authorize('student'), rememberLesson);
router.get('/me', authorize('student'), getMyLearning);
router.get('/activities/manage', authorize('admin', 'teacher'), getManageActivities);
router.post('/activities/:activityId/submit', authorize('student'), submitActivity);
router.post('/activities', authorize('admin', 'teacher'), createActivity);
router.put('/activities/:activityId', authorize('admin', 'teacher'), updateActivity);
router.delete('/activities/:activityId', authorize('admin', 'teacher'), deleteActivity);
router.put('/activities/:activityId/submissions/:studentId/grade', authorize('admin', 'teacher'), gradeSubmission);
router.put('/enrollments/:enrollmentId/progress', authorize('admin', 'teacher'), updateProgress);

module.exports = router;
