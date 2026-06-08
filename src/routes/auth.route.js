const express = require("express");
const router = express.Router();

const { 
    register, 
    login, 
    getMe, 
    refreshToken, 
    logout, 
    logoutAll, 
    verifyEmail 
} = require("../controllers/auth.controller");

/**
 * @route   POST api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post("/register", register);

/**
 * @route   POST api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", login);

/**
 * @route   GET api/auth/get-me
 * @desc    Get current user
 * @access  Private
 */
router.get("/get-me", getMe);

/**
 * @route   GET api/auth/refresh-token
 * @desc    Refresh token
 * @access  Public
 */
router.get("/refresh", refreshToken);

/**
 * @route   GET api/auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.get("/logout", logout);

/**
 * @route   GET api/auth/logout-all
 * @desc    Logout all users
 * @access  Public
 */
router.get("/logout-all", logoutAll);

/**
 * @route   POST api/auth/verify-email
 * @desc    Verify email
 * @access  Public
 */
router.post("/verify-email", verifyEmail);

module.exports = router;