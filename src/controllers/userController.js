const userModel = require("../models/userModel");
const bcript = require("bcrypt");
const { EncodeToken } = require("../utility/tokenHelper");

let options = {
    maxAge: process.env.Cookie_Expire_Time,
    httpOnly: false,
    sameSite: "none",
    secure: true,
}
// Create user
exports.register = async (req, res) => {
    try {
        // find the existing user
        const { email, password } = req.body;
        const ifUser = await userModel.find({ email });
        if (ifUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Email already registered.",
            });
        }
        let user = await userModel.create({ email, password });
        res.status(200).json({
            success: true,
            message: "User registered successfully.",
            user: user,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong.",
        });
    }

}

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.query;
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email",
            });
        }

        // IsMatch password
        const IsMatch = await bcript.compare(password.toString(), user.password);
        if (!IsMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid password",
            });
        }

        let token = EncodeToken(user.email, user._id.toString());
        res.cookie("u_token", token, options);
        res.status(200).json({
            success: true,
            message: "Login successful.",
            user: {
                id: user._id,
                email: user.email,
            },
            token: token,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong.",
        });
    }
}

// Get user data
exports.user = async (req, res) => {
    try {
        let email = req.headers.email;
        let matchStage = {
            $match: {
                email: email,
            }
        }
        let project = {
            $project: {
                password: 0,
            }
        }

        let data = await userModel.aggregate([matchStage, project]);
        res.status(200).json({
            success: true,
            message: "User data retrieved successfully.",
            data: data[0],
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong.",
        });
    }
}

// user verify
exports.userVerify = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: "User verified successfully.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong.",
        });
    }
}

//User logout
exports.logout = async (req, res) => {
    try {
        res.clearCookie("u_token");
        res.status(200).json({
            success: true,
            message: "Logout successful.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong.",
        });
    }
}

// Profile fields a logged-in user may change. Email and password are
// deliberately excluded: the user is already authenticated by the u_token
// cookie (authVerificationUser), so no password is needed to edit the profile.
const PROFILE_FIELDS = [
    "cus_name",
    "cus_add",
    "cus_city",
    "cus_country",
    "cus_fax",
    "cus_phone",
    "cus_postcode",
    "cus_state",

    // Shipping Information
    "ship_name",
    "ship_add",
    "ship_city",
    "ship_country",
    "ship_phone",
    "ship_postcode",
    "ship_state",
];

// User update
exports.update = async (req, res) => {
    try {
        const email = req.headers.email;
        const _id = req.headers._id;

        // Copy only allowed fields that were actually sent
        const updatedData = {};
        for (const field of PROFILE_FIELDS) {
            if (req.body[field] !== undefined) {
                updatedData[field] = req.body[field];
            }
        }

        const updatedUser = await userModel.findOneAndUpdate(
            { _id, email },
            { $set: updatedData },
            { new: true, projection: { password: 0 } }
        );
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        res.status(200).json({
            success: true,
            message: "User updated successfully.",
            user: {
                id: updatedUser._id,
                email: updatedUser.email,
            },
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong.",
        });
    }
}