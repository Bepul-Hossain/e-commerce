const { DecodeToken } = require("../utility/tokenHelper");

module.exports = (req, res, next) => {
    const token = req.cookies["u_token"];
    let decoded = DecodeToken(token);

    if (decoded == null) {
        return res.status(401).json({
            status: 401,
            message: "Invalid token.",
        });
    } else {
        let email = decoded.email;
        let id = decoded.id;
        req.headers.email = email;
        req.headers._id = id;
        next();
    }
}