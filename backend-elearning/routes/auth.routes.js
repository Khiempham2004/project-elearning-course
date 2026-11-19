const express = require("express");
const { register, login, getProfile, updateProfile } = require("../controllers/auth.controller");
const { verifyToken, authorize } = require("../middleware/auth.middleware");
const routes = express.Router();

routes.post("/register", register);
routes.post("/login", login);
routes.get("/me", verifyToken, getProfile);
routes.put("/me", verifyToken, updateProfile);

module.exports = { routes };
