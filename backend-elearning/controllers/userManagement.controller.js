const Model = require("../models/userManagement.model");
const { createCrudController } = require("./directoryCrud.controller");
const controller = createCrudController(Model, [
  "userCode",
  "fullName",
  "email",
  "phone",
  "role",
]);

// Update only editable user fields on the existing document. Loading and
// saving the document gives consistent casting/validation and avoids an
// accidental replacement of fields outside the user form.
controller.update = async (req, res) => {
  try {
    const user = await Model.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const editableFields = [
      "userCode",
      "fullName",
      "email",
      "phone",
      "role",
      "departmentId",
      "status",
    ];

    for (const field of editableFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        user.set(field, req.body[field]);
      }
    }

    await user.save();
    return res.json({ data: user, message: "Cập nhật người dùng thành công" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Mã người dùng đã tồn tại",
        error: error.message,
      });
    }
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        message: "Dữ liệu người dùng không hợp lệ",
        error: error.message,
      });
    }
    return res.status(500).json({
      message: "Không thể cập nhật người dùng",
      error: error.message,
    });
  }
};

module.exports = controller;
