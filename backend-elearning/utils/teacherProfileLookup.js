const TeacherModel = require('../models/teacher.model.js');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizedExactMatch = (value) => ({
    $regex: `^\\s*${escapeRegex(value.trim())}\\s*$`,
    $options: 'i',
});

const findTeacherProfile = async (user) => {
    const email = String(user?.email || '').trim();
    const username = String(user?.userName || '').trim();
    const accountId = String(user?._id || user?.id || '').trim();

    const identities = [
        ...(email ? [{ email: normalizedExactMatch(email) }] : []),
        ...(username ? [{ teacherCode: normalizedExactMatch(username) }] : []),
        ...(accountId ? [{ teacherCode: normalizedExactMatch(accountId) }] : []),
    ];

    for (const identity of identities) {
        const teacher = await TeacherModel.findOne(identity).lean();
        if (!teacher) continue;
        const accountId = user?._id || user?.id;
        if (accountId && !teacher.userId) {
            try {
                await TeacherModel.updateOne(
                    { _id: teacher._id, $or: [{ userId: { $exists: false } }, { userId: null }] },
                    { $set: { userId: accountId } },
                );
                teacher.userId = accountId;
            } catch (error) {
                if (error.code !== 11000) throw error;
            }
        }
        return teacher;
    }
    return null;
};

module.exports = { findTeacherProfile };
