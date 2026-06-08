const jwt = require('jsonwebtoken');

exports.EncodeToken = (email, id) => {
    let key = process.env.JWT_KEY;
    let expire = process.env.JWT_Expire_Time;

    let payload = {
        email: email,
        id: id
    };

    return jwt.sign(payload, key, { expiresIn: expire });
}

exports.DecodeToken = (token) => {
    try {
        let key = process.env.JWT_KEY;
        let decoded = jwt.decode(token, key);
        return decoded;
    } catch (err) {
        return null;
    }
}