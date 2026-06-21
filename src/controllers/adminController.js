const adminModel = require("../models/adminModel");
const bcript = require("bcrypt");
const { EncodeToken } = require("../utility/tokenHelper");

let options = {
    maxAge: process.env.Cookie_Expire_Time,
    httpOnly: false,
    sameSite: "none",
    secure: true,
}
// Create admin
exports.register = async (req, res) => {
    try {
        const { email, password } = req.body;
        await adminModel.create({ email, password });
        res.status(200).json({
            success: true,
            message: "Admin registered successfully.",
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong.",
        });
    }

}

// Login admin
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await adminModel.findOne({ email: email });
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
        res.cookie("a_token", token, options);
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

// Get admin data
exports.admin = async (req, res) => {
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

        let data = await adminModel.aggregate([matchStage, project]);
        res.status(200).json({
            success: true,
            message: "Admin data retrieved successfully.",
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

// Admin verify
exports.adminVerify = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: "Admin verified successfully.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong.",
        });
    }
}

//Admin logout
exports.logout = async (req, res) => {
    try {
        res.clearCookie("a_token");
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

// Admin update
exports.update = async (req, res) => {
    try {
        const { email, password } = req.body;
        const _id = req.headers._id;

        let updatedData = { email }
        const user = await adminModel.findOne({ _id });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Admin not found.",
            });
        }
        if (password) {
            const hashedPassword = await bcript.hash(password.toString(), 10);
            updatedData.password = hashedPassword;
        }

        const updatedUser = await adminModel.findByIdAndUpdate(_id, updatedData, { new: true });

        let token = EncodeToken(updatedUser.email, updatedUser._id.toString());
        res.cookie("a_token", token, options);
        res.status(200).json({
            success: true,
            message: "Admin updated successfully.",
            user: {
                id: updatedUser._id,
                email: updatedUser.email,
            },
            token: token,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong.",
        });
    }
}