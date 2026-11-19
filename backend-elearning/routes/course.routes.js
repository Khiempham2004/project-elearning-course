const express = require('express');
const routerCourse = express.Router();
const {
    getAllCourse,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    reviewCourse,
} = require('../controllers/course.controller.js');
const { authorize } = require('../middleware/auth.middleware.js');
const categories = require('../controllers/courseCategory.controller.js');
const lessons = require('../controllers/lesson.controller.js');


routerCourse.get('/', getAllCourse);
routerCourse.get('/categories', categories.listCategories);
routerCourse.get('/:courseId/lessons', authorize('admin', 'teacher'), lessons.listLessons);
routerCourse.post('/:courseId/lessons', authorize('admin', 'teacher'), lessons.saveLesson);
routerCourse.put('/:courseId/lessons/:lessonId', authorize('admin', 'teacher'), lessons.saveLesson);
routerCourse.delete('/:courseId/lessons/:lessonId', authorize('admin', 'teacher'), lessons.deleteLesson);
routerCourse.patch('/:id/review', authorize('admin'), reviewCourse);
routerCourse.get('/:id', getCourseById);
routerCourse.post('/', createCourse);
routerCourse.put('/:id', updateCourse);
routerCourse.delete('/:id', deleteCourse);

module.exports = { routerCourse };
