const express = require("express");
const router = express.Router();
const { verifyAccessToken } = require("../../shared/Tokens");
const User = require("./user");

// Register handle
router.post("/v1/register", User.register);

// Login handle
router.post("/v1/login", User.login);

// Refresh-token handle
router.post("/v1/refresh-token", User.refreshToken);

// Logout handle
router.delete("/v1/logout", verifyAccessToken, User.logout);

// Reset Password
router.post("/v1/resetPassword", User.resetPassword);

// Update Password
router.post("/v1/updatePassword", User.updatePassword);

// Update Profile
router.put("/v1/updateProfile", verifyAccessToken, User.updateProfile);

module.exports = router;
