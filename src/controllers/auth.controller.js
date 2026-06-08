const User = require("../models/user.model");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const config = require("../configs/config");

/**
 * - Register new user
 */
const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({
            $or: [
                { username },
                { email }
            ],
        });

        if (existingUser) {
            return res.status(409).json({ message: "username or email already exists" });
        }

        const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

        const user = new User({
            username,
            email,
            password: hashedPassword,
        });

        await user.save();

        const token = jwt.sign(
            {
                id: user._id,
            },
            config.JWT_SECRET,
            {
                expiresIn: "1d",
            }
        );

        res.status(201).json({ 
            success: true,
            message: "User registered successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
            token
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

module.exports = {
    register,
};