const mongoose = require("mongoose");

// Dùng chung CRUD để controller của từng danh mục chỉ cần khai báo model.
function createCrudController(Model, searchableFields = []) {
  return {
    getAll: async (req, res) => {
      try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 100);
        const keyword = String(req.query.q || "")
          .trim()
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const filter = keyword
          ? {
            $or: searchableFields.map((field) => ({
              [field]: { $regex: keyword, $options: "i" },
            })),
          }
          : {};
        const [data, total] = await Promise.all([
          Model.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
          Model.countDocuments(filter),
        ]);
        return res.json({
          data,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      } catch (error) {
        return res
          .status(500)
          .json({ message: "Lỗi server", error: error.message });
      }
    },
    getById: async (req, res) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
          return res.status(400).json({ message: "ID không hợp lệ" });
        }
        const data = await Model.findById(req.params.id);
        return data
          ? res.json({ data })
          : res.status(404).json({ message: "Không tìm thấy dữ liệu" });
      } catch (error) {
        return res
          .status(500)
          .json({ message: "Lỗi server", error: error.message });
      }
    },
    create: async (req, res) => {
      try {
        const directory = await Model.create(req.body);
        return res
          .status(201)
          .json({
            data: directory,
            message: "Tạo thành công",
          });
      } catch (error) {
        return res
          .status(
            error.code === 11000
              ? 409
              : error.name === "ValidationError" || error.name === "CastError"
                ? 400
                : 500,
          )
          .json({ message: "Không thể tạo dữ liệu", error: error.message });
      }
    },
    update: async (req, res) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
          return res.status(400).json({ message: "ID không hợp lệ" });
        };

        const data = await Model.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
          runValidators: true,
        });
        return data
          ? res.json({ data, message: "Cập nhật thành công" })
          : res.status(404).json({ message: "Không tìm thấy dữ liệu" });
      } catch (error) {
        return res
          .status(
            error.code === 11000 ||
              error.name === "ValidationError" ||
              error.name === "CastError"
              ? 400
              : 500,
          )
          .json({ message: "Không thể cập nhật", error: error.message });
      }
    },
    remove: async (req, res) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
          return res.status(400).json({ message: "ID không hợp lệ" });
        }
        const data = await Model.findByIdAndDelete(req.params.id);
        if (!data) {
          return res.status(404).json({
            message: "Không tìm thấy dữ liệu"
          })
        };
        res.json({ data, message: "Xóa thành công" })
      } catch (error) {
        return res
          .status(500)
          .json({ message: "Lỗi server", error: error.message });
      }
    },
  };
}

module.exports = { createCrudController };
