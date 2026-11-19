const Auth = require("../models/auth.model.js");
const jwt = require("jsonwebtoken");

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        // Kiểm tra có token hay không
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Bạn chưa đăng nhập",
            });
        }
        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await Auth.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({
                message: "Tài khoản không tồn tại",
            });
        }

        if (user.status === false) {
            return res.status(403).json({
                message: "Tài khoản đã bị khóa",
            });
        }

        req.user = user;
        return next();
    } catch (error) {
        console.error("Lỗi verifyToken:", error);
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError" ||
            error.name === "NotBeforeError"
        ) {
            return res.status(401).json({
                message: "Token không hợp lệ hoặc đã hết hạn",
            });
        }
        return res.status(500).json({
            message: "Lỗi máy chủ khi xác thực tài khoản",
        });
    }
};

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Bạn chưa đăng nhập",
            });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Bạn không có quyền truy cập chức năng này",
            });
        }
        return next();
    };
};

module.exports = { verifyToken, authorize };
