const mongoose = require("mongoose");

const reject = (res, message) =>
  res.status(400).json({ success: false, message });

const validateQuiz =
  (partial = false) =>
    (req, res, next) => {
      const body = req.body || {};
      if (!partial && !mongoose.Types.ObjectId.isValid(body.courseId))
        return reject(res, "courseId không hợp lệ");
      if (!partial && !String(body.title || "").trim())
        return reject(res, "Cần nhập tiêu đề bài kiểm tra");
      if (
        body.passingScore !== undefined &&
        (!Number.isFinite(Number(body.passingScore)) ||
          Number(body.passingScore) < 0 ||
          Number(body.passingScore) > 100)
      )
        return reject(res, "passingScore phải nằm trong khoảng 0 đến 100");
      if (
        body.durationMinutes !== undefined &&
        body.durationMinutes !== null &&
        (!Number.isInteger(Number(body.durationMinutes)) ||
          Number(body.durationMinutes) < 1)
      )
        return reject(res, "durationMinutes phải là số nguyên dương");
      if (
        body.startsAt &&
        body.dueAt &&
        new Date(body.dueAt) < new Date(body.startsAt)
      )
        return reject(res, "dueAt không được trước startsAt");
      next();
    };

const validateQuestion =
  (partial = false) =>
    (req, res, next) => {
      const body = req.body || {};
      if (!partial && !String(body.prompt || "").trim())
        return reject(res, "Cần nhập nội dung câu hỏi");
      if (
        body.options !== undefined &&
        (!Array.isArray(body.options) ||
          body.options.length < 2 ||
          body.options.some((option) => !String(option).trim()))
      )
        return reject(res, "Câu hỏi cần ít nhất hai phương án trả lời hợp lệ");
      if (!partial && body.options === undefined)
        return reject(res, "Cần cung cấp danh sách phương án");
      if (body.correctAnswerIndex !== undefined) {
        const index = Number(body.correctAnswerIndex);
        const options = body.options;
        if (
          !Number.isInteger(index) ||
          index < 0 ||
          (Array.isArray(options) && index >= options.length)
        )
          return reject(res, "Đáp án đúng không nằm trong danh sách phương án");
      } else if (!partial) return reject(res, "Cần cung cấp chỉ số đáp án đúng");
      next();
    };

module.exports = { validateQuiz, validateQuestion };
