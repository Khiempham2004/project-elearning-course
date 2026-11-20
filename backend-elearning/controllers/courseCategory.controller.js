const mongoose = require("mongoose");
const Category = require("../models/courseCategory.model.js");
const { courseModel } = require("../models/course.model.js");
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const listCategories = async (req, res) => {
    try {
        // 1. Lấy danh sách category cũ từ Course
        const legacyNames = (
            await courseModel.distinct("category", { category: { $nin: [null, ""] } })
        )
            .map((name) => String(name).trim())
            .filter(Boolean);
        // 2. Đồng bộ category cũ sang bảng Category
        if (legacyNames.length)
            await Category.bulkWrite(
                legacyNames.map((name) => ({
                    updateOne: {
                        filter: { name },
                        update: { $setOnInsert: { name, status: true } },
                        upsert: true,
                    },
                })),
                { ordered: false },
            );
        if (legacyNames.length) {
            const categories = await Category.find({ name: { $in: legacyNames } }).select('_id name').lean();
            await courseModel.bulkWrite(categories.map((category) => ({
                updateMany: {
                    filter: { category: category.name, $or: [{ categoryId: null }, { categoryId: { $exists: false } }] },
                    update: { $set: { categoryId: category._id } },
                },
            })), { ordered: false });
        }
        const q = String(req.query.q || "").trim();
        // 4. Kiểm tra có sử dụng phân trang không
        const usePagination =
            req.query.page !== undefined || req.query.limit !== undefined;
        const requestedPage = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(
            Math.max(Number.parseInt(req.query.limit, 10) || 10, 1),
            100,
        );
        const filter = {};
        if (q) filter.name = { $regex: escapeRegex(q), $options: "i" };
        if (req.query.activeOnly === "true") filter.status = true;
        if (req.query.status === "true") filter.status = true;
        if (req.query.status === "false") filter.status = false;
        if (!usePagination)
            return res.json({
                data: await Category.find(filter).sort({ name: 1 }).lean(),
            });
        const total = await Category.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);
        const page = totalPages ? Math.min(requestedPage, totalPages) : 1;
        const data = await Category.find(filter)
            .sort({ name: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        return res.json({
            result: {
                data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            }
        });
    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: "Không tải được danh mục khóa học" });
    }
};

const createCategory = async (req, res) => {
    try {
        const name = String(req.body?.name || "").trim();
        if (!name)
            return res
                .status(400)
                .json({ message: "Tên danh mục không được để trống" });
        const data = await Category.create({
            name,
            description: String(req.body?.description || "").trim(),
            status: req.body?.status !== false,
        });
        return res.status(201).json({ data, message: "Đã tạo danh mục" });
    } catch (error) {
        if (error.code === 11000)
            return res.status(409).json({ message: "Danh mục đã tồn tại" });
        return res.status(500).json({ message: "Không tạo được danh mục" });
    }
};

const updateCategory = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            return res.status(400).json({ message: "ID danh mục không hợp lệ" });
        const updates = {};
        if (req.body?.name !== undefined)
            updates.name = String(req.body.name).trim();
        if (req.body?.description !== undefined)
            updates.description = String(req.body.description).trim();
        if (req.body?.status !== undefined)
            updates.status = Boolean(req.body.status);
        const current = await Category.findById(req.params.id);
        if (!current)
            return res.status(404).json({ message: "Không tìm thấy danh mục" });
        const oldName = current.name;
        Object.assign(current, updates);
        await current.save();
        if (updates.name && updates.name !== oldName)
            await courseModel.updateMany(
                { $or: [{ category: oldName }, { categoryId: current._id }] },
                { $set: { category: updates.name, categoryId: current._id } },
            );
        const data = current;
        return res.json({ data, message: "Đã cập nhật danh mục" });
    } catch (error) {
        if (error.code === 11000)
            return res.status(409).json({ message: "Tên danh mục đã tồn tại" });
        return res.status(400).json({ message: "Dữ liệu danh mục không hợp lệ" });
    }
};

const deleteCategory = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            return res.status(400).json({ message: "ID danh mục không hợp lệ" });
        const category = await Category.findById(req.params.id);
        if (!category)
            return res.status(404).json({ message: "Không tìm thấy danh mục" });
        if (await courseModel.exists({ $or: [{ category: category.name }, { categoryId: category._id }] }))
            return res
                .status(409)
                .json({
                    message:
                        "Danh mục đang được khóa học sử dụng. Hãy tắt trạng thái thay vì xóa.",
                });
        await category.deleteOne();
        return res.json({ message: "Đã xóa danh mục" });
    } catch (error) {
        return res.status(500).json({ message: "Không xóa được danh mục" });
    }
};

module.exports = {
    listCategories,
    createCategory,
    updateCategory,
    deleteCategory,
};
