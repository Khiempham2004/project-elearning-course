const express = require('express');
const { getAllStudents, getStudentById, createStudent, updateStudent, deleteStudent } = require('../controllers/student.controller.js');
const routerStudent = express.Router();

routerStudent.get('/', getAllStudents);
routerStudent.get('/:id', getStudentById);
routerStudent.post('/', createStudent);
routerStudent.put('/:id', updateStudent);
routerStudent.delete('/:id', deleteStudent);

module.exports = { routerStudent };