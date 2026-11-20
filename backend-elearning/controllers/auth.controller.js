const Auth = require("../models/auth.model.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
    try {
        const { userName, password, email } =
            req.body && typeof req.body === "object" ? req.body : {};
        // const registerableRoles = ["student", "teacher", "course"];

        if (!userName?.trim() || !password || !email?.trim()) {
            return res.status(400).json({
                message: "Vui lòng nhập tài khoản và mật khẩu , email",
            });
        }
        // if (!registerableRoles.includes(role)) {
        //     return res.status(400).json({
        //         message: "Role đăng ký không hợp lệ. Chọn student, teacher hoặc course.",
        //     });
        // }

        const exittingUser = await Auth.findOne({
            $or: [{ userName: userName.trim() }, { email: email.trim() }],
        });

        if (exittingUser) {
            return res.status(409).json({
                message: "Tài khoản đã tồn tại",
            });
        }
        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);
        // Tạo tài khoản trong MongoDB
        const newUser = await Auth.create({
            userName: userName.trim(),
            password: hashedPassword,
            email: email.trim(),
            // Public registration always creates a student account. Staff roles
            // are assigned by an administrator, never accepted from the browser.
            role: "student",
        });

        // Trả kết quả, không trả mật khẩu
        return res.status(201).json({
            message: "Đăng ký tài khoản thành công",
            user: {
                id: newUser._id,
                userName: newUser.userName,
                email: newUser.email,
                role: newUser.role,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: "Đăng ký tài khoản bị lỗi",
        });
    }
};

const login = async (req, res) => {
    try {
        const { userName, password } =
            req.body && typeof req.body === "object" ? req.body : {};
        const normalizedUserName =
            typeof userName === "string" ? userName.trim() : "";
        if (!normalizedUserName || typeof password !== "string" || !password) {
            return res.status(400).json({
                message: "Vui lòng nhập tài khoản và mật khẩu",
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("Đăng nhập thất bại: thiếu cấu hình JWT_SECRET");
            return res.status(500).json({
                message: "Máy chủ chưa cấu hình JWT_SECRET",
            });
        }

        const user = await Auth.findOne({ userName: normalizedUserName });
        if (!user) {
            return res.status(401).json({
                message: "Tài khoản và mật khẩu không chính xác",
            });
        }

        // Tài khoản cũ hoặc dữ liệu lỗi có thể chưa có mật khẩu dạng bcrypt.
        if (typeof user.password !== "string" || !user.password.startsWith("$2")) {
            console.error(`Tài khoản ${user._id} không có mật khẩu bcrypt hợp lệ`);
            return res
                .status(500)
                .json({ message: "Dữ liệu tài khoản không hợp lệ" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                message: "Tài khoản và mật khẩu không chính xác",
            });
        }

        const token = jwt.sign(
            {
                id: user._id.toString(),
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d",
            },
        );
        res.status(200).json({
            token,
            message: "Đăng nhập thành công",
            user: {
                id: user._id,
                userName: user.userName,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl || '',
            },
        });
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        res.status(500).json({
            message: "Đăng nhập không thành công",
        });
    }
};

const getProfile = async (req, res) => {
    return res.status(200).json({
        user: {
            id: req.user._id,
            userName: req.user.userName,
            email: req.user.email,
            role: req.user.role,
            avatarUrl: req.user.avatarUrl || '',
        },
    });
};

const updateProfile = async (req, res) => {
    try {
        const userName = typeof req.body?.userName === "string" ? req.body.userName.trim() : "";
        const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
        if (!userName || !email) {
            return res.status(400).json({ message: "Tên đăng nhập và email là bắt buộc" });
        }

        const update = { userName, email };
        if (typeof req.body?.avatarUrl === 'string' && req.body.avatarUrl.length <= 6000000) update.avatarUrl = req.body.avatarUrl;
        const { currentPassword, newPassword } = req.body ?? {};
        if (newPassword) {
            if (typeof currentPassword !== "string" || !currentPassword) {
                return res.status(400).json({ message: "Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu" });
            }
            if (typeof newPassword !== "string" || newPassword.length < 8) {
                return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 8 ký tự" });
            }

            const currentUser = await Auth.findById(req.user._id);
            const passwordMatches = await bcrypt.compare(currentPassword, currentUser.password);
            if (!passwordMatches) {
                return res.status(400).json({ message: "Mật khẩu hiện tại không chính xác" });
            }
            update.password = await bcrypt.hash(newPassword, 10);
        }

        const updatedUser = await Auth.findByIdAndUpdate(
            req.user._id,
            update,
            { new: true, runValidators: true, select: "-password" },
        );
        return res.status(200).json({
            message: "Cập nhật thông tin cá nhân thành công",
            user: {
                id: updatedUser._id,
                userName: updatedUser.userName,
                email: updatedUser.email,
                role: updatedUser.role,
                avatarUrl: updatedUser.avatarUrl || '',
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Tên đăng nhập hoặc email đã được sử dụng" });
        }
        console.error("Lỗi cập nhật hồ sơ:", error);
        return res.status(500).json({ message: "Không thể cập nhật thông tin cá nhân" });
    }
};

module.exports = { register, login, getProfile, updateProfile };
