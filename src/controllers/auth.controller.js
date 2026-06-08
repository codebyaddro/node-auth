const User = require("../models/user.model");
const Session = require("../models/session.model");
const OTP = require("../models/otp.model");
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

        const user = await User.create({
            username,
            email,
            password: hashedPassword
        });

        const otp = generateOtp();
        const html = getOtpHtml(otp);

        const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
        await otpModel.create({
            email,
            user: user._id,
            otpHash
        })

        await sendEmail(email, "OTP Verification", `Your OTP code is ${otp}`, html)

        res.status(201).json({
            message: "User registered successfully",
            user: {
                username: user.username,
                email: user.email,
                verified: user.verified
            },
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * - Login user
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            })
        }

        // if (!user.verified) {
        //     return res.status(401).json({
        //         message: "Email not verified"
        //     })
        // }

        const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

        const isPasswordValid = hashedPassword === user.password;

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password"
            })
        }

        const refreshToken = jwt.sign({
            id: user._id
        }, config.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        )

        const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

        const session = await Session.create({
            user: user._id,
            refreshTokenHash,
            ip: req.ip,
            userAgent: req.headers[ "user-agent" ]
        })

        const accessToken = jwt.sign({
            id: user._id,
            sessionId: session._id
        }, config.JWT_SECRET,
            {
                expiresIn: "10m"
            }
        )

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        })

        res.status(200).json({
            message: "Logged in successfully",
            user: {
                username: user.username,
                email: user.email,
            },
            accessToken,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
}

/**
 * - Get current user
 */
const getMe = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[ 1 ];

        if (!token) {
            return res.status(401).json({
                message: "token not found"
            })
        }

        const decoded = jwt.verify(token, config.JWT_SECRET)

        const user = await User.findById(decoded.id)

        res.status(200).json({
            message: "user fetched successfully",
            user: {
                username: user.username,
                email: user.email,
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * - Refresh token
 */
const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                message: "refresh token not found"
            })
        }

        const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

        const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

        const session = await Session.findOne({
            refreshTokenHash,
            revoked: false
        });

        if (!session) {
            return res.status(401).json({
                message: "invalid refresh token"
            })
        };

        const accessToken = jwt.sign(
            {
                id: decoded.id,
            },
            config.JWT_SECRET,
            {
                expiresIn: "15m",
            }
        );

        const newRefreshToken = jwt.sign(
            {
                id: decoded.id,
            },
            config.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

        session.refreshToken = newRefreshTokenHash;
        await session.save();

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            message: "access token refreshed successfully",
            token: accessToken
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * - Logout user
 */
const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(400).json({
                message: "Refresh token not found"
            })
        }

        const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

        const session = await Session.findOne({
            refreshTokenHash,
            revoked: false
        })

        if (!session) {
            return res.status(400).json({
                message: "Invalid refresh token"
            })
        }

        session.revoked = true;
        await session.save();

        res.clearCookie("refreshToken")

        res.status(200).json({
            message: "Logged out successfully"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * - Logout all users
 */
const logoutAll = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(400).json({
                message: "Refresh token not found"
            })
        }

        const decoded = jwt.verify(refreshToken, config.JWT_SECRET)

        await Session.updateMany({
            user: decoded.id,
            revoked: false
        }, {
            revoked: true
        })

        res.clearCookie("refreshToken");

        res.status(200).json({
            message: "Logged out from all devices successfully"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
}

/**
 * - Verify email
 */
const verifyEmail = async (req, res) => {
    try {
        const { otp, email } = req.body

        const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

        const otpDoc = await OTP.findOne({
            email,
            otpHash
        })

        if (!otpDoc) {
            return res.status(400).json({
                message: "Invalid OTP"
            })
        }

        const user = await User.findByIdAndUpdate(otpDoc.user, {
            verified: true
        })

        await OTP.deleteMany({
            user: otpDoc.user
        })

        return res.status(200).json({
            message: "Email verified successfully",
            user: {
                username: user.username,
                email: user.email,
                verified: user.verified
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
}

module.exports = {
    register,
    login,
    getMe,
    refreshToken,
    logout,
    logoutAll,
    verifyEmail
};