const TeacherModel = require('../models/teacher.model.js');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizedExactMatch = (value) => ({
    $regex: `^\\s*${escapeRegex(value.trim())}\\s*$`,
    $options: 'i',
});

const findTeacherProfile = async (user) => {
    const email = String(user?.email || '').trim();
    const username = String(user?.userName || '').trim();

    let teacher = email
        ? await TeacherModel.findOne({ email: normalizedExactMatch(email) }).lean()
        : null;
    if (!teacher && username) {
        teacher = await TeacherModel.findOne({ teacherCode: normalizedExactMatch(username) }).lean();
    }
    return teacher;
};

module.exports = { findTeacherProfile };
