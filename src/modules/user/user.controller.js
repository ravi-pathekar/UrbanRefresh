const express = require("express");
const router = express.Router();
const { verifyAccessToken } = require("../../shared/generateToken");
const UserController = require("./user");
// Register handle
router.post("/register", UserController.register);

// Login handle
router.post("/login", UserController.login);

// Refresh-token handle
router.post("/refresh-token", UserController.refreshToken);

// Logout handle
router.delete("/logout", UserController.logout);

// Reset Password
router.post("/resetPassword", UserController.resetPassword);

// Update Password
router.post("/updatePassword", UserController.updatePassword);

module.exports = router;
