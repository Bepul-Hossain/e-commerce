const express = require('express');

const app = express();
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const dotEnv = require('dotenv');
const router = require('./src/routes/api');

dotEnv.config();

// Connect to MongoDB

mongoose.set('strictQuery', false);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));

// Behind Vercel's proxy: needed so rate limiting sees the real client IP
app.set('trust proxy', 1);

// Global Middlewares
app.use(cookieParser());
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3001"],
    credentials: true,
}));
app.use(helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
        "img-src": ["'self'", "https:", "data:"]
    },
})
);

app.use(hpp());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3000, // Limit each IP to 3000 requests per windowMs
    message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

app.use("/api/v1", router)

// On Vercel, files live in Vercel Blob; locally they are served from disk
if (process.env.BLOB_BASE_URL) {
    app.get("/api/v1/get-file/:filename", (req, res) => {
        res.redirect(301, `${process.env.BLOB_BASE_URL}/${encodeURIComponent(req.params.filename)}`);
    });
} else {
    app.use("/api/v1/get-file", express.static("uploads"));
}

// Add React Front-end static super admin
app.use("/super-admin", express.static(path.join(__dirname, "client", "super-admin", "dist"), {
    index: false,
}));

// Add React Front-end routing super admin
app.get("/super-admin/{*splat}", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "super-admin", "dist", "index.html"));
});

// Add React Front-end static ecommerce
app.use(express.static(path.join(__dirname, "client", "ecommerce", "dist")));

// Add React Front-end routing ecommerce
app.get("/{*splat}", function (req, res) {
    res.sendFile(path.resolve(__dirname, "client", "ecommerce", "dist", "index.html"));
});


// // Serve React Client
// app.use("/super-admin", express.static(path.join(__dirname, "client", "super-admin", "dist"), {
//     index: false,
// }));

// app.get("/super-admin/*", (req, res) => {
//     res.sendFile(path.resolve(__dirname, "client", "super-admin", "dist", "index.html"));
// });

// app.use(express.static(path.join(__dirname, "client", "ecommerce", "dist")));

// app.get("*", function (req, res) {
//     res.sendFile(path.resolve(__dirname, "client", "ecommerce", "dist", "index.html"));
// });

module.exports = app; 