const mongoose = require("mongoose");

const createLocationController = ({ model, fields, label }) => ({
    getAll: async (req, res) => {
        try {
            const keyword = (req.query.q || "").trim();
            const filter = {};
            const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
            const limit = Math.min(
                Math.max(parseInt(req.query.limit, 10) || 10, 1),
                100,
            );
            const skip = (page - 1) * limit;
            if (keyword) {
                const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                filter.$or = fields.map((field) => ({
                    [field]: { $regex: escaped, $options: "i" },
                }));
            }
            if (req.query.status !== undefined)
                filter.status = req.query.status === "true";
            if (req.query.provinceId !== undefined) {
                const provinceId = String(req.query.provinceId);
                filter.provinceId = /^\d+$/.test(provinceId)
                    ? Number(provinceId)
                    : provinceId;
            }
            const [records, totalPagination] = await Promise.all([
                await model
                    .find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                model.countDocuments(filter),
            ]);
            const totalPages = Math.ceil(totalPagination / limit);
            return res.status(200).json({
                data: records,
                message: `Lấy danh sách ${label} thành công`,
                pagination: {
                    page,
                    limit,
                    totalPagination,
                    totalPages,
                },
            });
        } catch (error) {
            console.error(error);
            return res
                .status(500)
                .json({ message: "Lỗi server", error: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({ message: `ID ${label} không hợp lệ` });
            }
            const record = await model.findById(req.params.id);
            if (!record)
                return res.status(404).json({ message: `Không tìm thấy ${label}` });
            return res
                .status(200)
                .json({ data: record, message: `Lấy ${label} thành công` });
        } catch (error) {
            console.error(error);
            return res
                .status(500)
                .json({ message: "Lỗi server", error: error.message });
        }
    },

    create: async (req, res) => {
        try {
            const payload = { ...(req.body || {}) };
            for (const field of fields.slice(0, 3)) {
                if (typeof payload[field] === "string")
                    payload[field] = payload[field].trim();
            }
            for (const field of fields.slice(0, 3)) {
                if (!payload[field])
                    return res.status(400).json({
                        message: `Vui lòng cung cấp ${field}`,
                        required: fields.slice(0, 3),
                    });
            }
            if (payload.status === undefined) payload.status = true;
            const record = await model.create(payload);
            return res
                .status(201)
                .json({ data: record, message: `Tạo ${label} thành công` });
        } catch (error) {
            if (error.code === 11000)
                return res
                    .status(409)
                    .json({ message: `Mã ${label} đã tồn tại`, error: error.message });
            if (error.name === "ValidationError" || error.name === "CastError")
                return res.status(400).json({
                    message: `Dữ liệu ${label} không hợp lệ`,
                    error: error.message,
                });
            console.error(error);
            return res
                .status(500)
                .json({ message: "Lỗi server", error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id))
                return res.status(400).json({ message: `ID ${label} không hợp lệ` });
            const record = await model.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
                runValidators: true,
            });
            if (!record)
                return res.status(404).json({ message: `Không tìm thấy ${label}` });
            return res
                .status(200)
                .json({ data: record, message: `Cập nhật ${label} thành công` });
        } catch (error) {
            if (
                error.code === 11000 ||
                error.name === "ValidationError" ||
                error.name === "CastError"
            )
                return res.status(400).json({
                    message: `Dữ liệu ${label} không hợp lệ hoặc mã đã tồn tại`,
                    error: error.message,
                });
            console.error(error);
            return res
                .status(500)
                .json({ message: "Lỗi server", error: error.message });
        }
    },

    remove: async (req, res) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id))
                return res.status(400).json({ message: `ID ${label} không hợp lệ` });
            const record = await model.findByIdAndDelete(req.params.id);
            if (!record)
                return res.status(404).json({ message: `Không tìm thấy ${label}` });
            return res
                .status(200)
                .json({ data: record, message: `Xóa ${label} thành công` });
        } catch (error) {
            console.error(error);
            return res
                .status(500)
                .json({ message: "Lỗi server", error: error.message });
        }
    },
});

module.exports = { createLocationController };
