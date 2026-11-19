const express = require('express');
const { verifyToken, authorize } = require('../middleware/auth.middleware.js');
const { getCatalog, enrollCourse, getMyLearning, getManageActivities, submitActivity, createActivity, updateActivity, deleteActivity, gradeSubmission, updateProgress } = require('../controllers/studentLearning.controller.js');

const router = express.Router();
router.use(verifyToken);
router.get('/catalog', authorize('student'), getCatalog);
router.post('/enroll/:courseId', authorize('student'), enrollCourse);
router.get('/me', authorize('student'), getMyLearning);
router.get('/activities/manage', authorize('admin', 'teacher'), getManageActivities);
router.post('/activities/:activityId/submit', authorize('student'), submitActivity);
router.post('/activities', authorize('admin', 'teacher'), createActivity);
router.put('/activities/:activityId', authorize('admin', 'teacher'), updateActivity);
router.delete('/activities/:activityId', authorize('admin', 'teacher'), deleteActivity);
router.put('/activities/:activityId/submissions/:studentId/grade', authorize('admin', 'teacher'), gradeSubmission);
router.put('/enrollments/:enrollmentId/progress', authorize('admin', 'teacher'), updateProgress);

module.exports = router;
