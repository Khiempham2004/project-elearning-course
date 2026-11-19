const express = require('express');
const { getAllTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher } = require('../controllers/teacher.controller');
const routerTeacher = express.Router();

routerTeacher.get('/', getAllTeachers);
routerTeacher.get('/:id', getTeacherById);
routerTeacher.post('/', createTeacher);
routerTeacher.put('/:id', updateTeacher);
routerTeacher.delete('/:id', deleteTeacher);

module.exports = { routerTeacher };