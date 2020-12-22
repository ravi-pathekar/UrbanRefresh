const express = require("express");
const router = express.Router();
const { verifyAccessToken } = require("../../shared/Tokens");
const User = require("./user");

// Register handle
router.post("/register", User.register);

// Login handle
router.post("/login", User.login);

// Refresh-token handle
router.post("/refresh-token", User.refreshToken);

// Logout handle
router.delete("/logout", verifyAccessToken, User.logout);

// Reset Password
router.post("/resetPassword", User.resetPassword);

// Update Password
router.post("/updatePassword", User.updatePassword);

module.exports = router;
