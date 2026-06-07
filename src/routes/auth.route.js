const express = require("express");
const router = express.Router();

const { register } = require("../controllers/auth.controller");

/**
 * @route   POST api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post("/register", register);

module.exports = router;