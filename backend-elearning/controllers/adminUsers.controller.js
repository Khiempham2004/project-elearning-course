const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Auth = require('../models/auth.model.js');

const allowedRoles = ['admin', 'teacher', 'student', 'course', 'directory'];
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const listUsers = async (req, res) => {
    try {
        const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100);
        const filter = {};
        const q = String(req.query.q || '').trim();
        if (q) {
            const pattern = new RegExp(escapeRegex(q), 'i');
            filter.$or = [{ userName: pattern }, { email: pattern }];
        }
        if (allowedRoles.includes(req.query.role)) filter.role = req.query.role;
        if (req.query.status === 'true') filter.status = true;
        if (req.query.status === 'false') filter.status = false;
        const [users, total] = await Promise.all([
            Auth.find(filter).select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            Auth.countDocuments(filter),
        ]);
        return res.json({ data: users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Không tải được danh sách tài khoản' });
    }
};

const createUser = async (req, res) => {
    try {
        const userName = String(req.body?.userName || '').trim();
        const email = String(req.body?.email || '').trim().toLowerCase();
        const password = req.body?.password;
        const role = req.body?.role;
        if (!userName || !email || typeof password !== 'string' || password.length < 8 || !allowedRoles.includes(role)) {
            return res.status(400).json({ message: 'Nhập tên đăng nhập, email, mật khẩu tối thiểu 8 ký tự và role hợp lệ' });
        }
        const user = await Auth.create({ userName, email, password: await bcrypt.hash(password, 10), role, status: req.body.status !== false });
        const data = user.toObject(); delete data.password;
        return res.status(201).json({ data, message: 'Đã tạo tài khoản' });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: 'Tên đăng nhập hoặc email đã tồn tại' });
        console.error(error);
        return res.status(500).json({ message: 'Không tạo được tài khoản' });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'ID tài khoản không hợp lệ' });
        const user = await Auth.findById(id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
        if (req.body?.role !== undefined && !allowedRoles.includes(req.body.role)) return res.status(400).json({ message: 'Role không hợp lệ' });
        const disablingAdmin = user.role === 'admin' && (req.body?.status === false || (req.body?.role !== undefined && req.body.role !== 'admin'));
        if (disablingAdmin && await Auth.countDocuments({ role: 'admin', status: true }) <= 1) return res.status(409).json({ message: 'Không thể khóa hoặc hạ quyền admin hoạt động cuối cùng' });
        if (String(user._id) === String(req.user._id) && (req.body?.status === false || (req.body?.role !== undefined && req.body.role !== 'admin'))) return res.status(409).json({ message: 'Không thể tự khóa hoặc tự hạ quyền tài khoản đang đăng nhập' });
        if (req.body?.userName !== undefined) user.userName = String(req.body.userName).trim();
        if (req.body?.email !== undefined) user.email = String(req.body.email).trim().toLowerCase();
        if (req.body?.role !== undefined) user.role = req.body.role;
        if (req.body?.status !== undefined) user.status = Boolean(req.body.status);
        if (req.body?.password) {
            if (typeof req.body.password !== 'string' || req.body.password.length < 8) return res.status(400).json({ message: 'Mật khẩu tối thiểu 8 ký tự' });
            user.password = await bcrypt.hash(req.body.password, 10);
        }
        await user.save();
        const data = user.toObject(); delete data.password;
        return res.json({ data, message: 'Đã cập nhật tài khoản' });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: 'Tên đăng nhập hoặc email đã tồn tại' });
        console.error(error);
        return res.status(500).json({ message: 'Không cập nhật được tài khoản' });
    }
};

const deleteUser = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'ID tài khoản không hợp lệ' });
        if (String(req.user._id) === req.params.id) return res.status(409).json({ message: 'Không thể xóa tài khoản admin đang đăng nhập' });
        const user = await Auth.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
        return res.json({ message: 'Đã xóa tài khoản' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Không xóa được tài khoản' });
    }
};

module.exports = { listUsers, createUser, updateUser, deleteUser };
