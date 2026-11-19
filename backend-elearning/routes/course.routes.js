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


routerCourse.get('/', getAllCourse);
routerCourse.get('/categories', categories.listCategories);
routerCourse.patch('/:id/review', authorize('admin'), reviewCourse);
routerCourse.get('/:id', getCourseById);
routerCourse.post('/', createCourse);
routerCourse.put('/:id', updateCourse);
routerCourse.delete('/:id', deleteCourse);

module.exports = { routerCourse };
