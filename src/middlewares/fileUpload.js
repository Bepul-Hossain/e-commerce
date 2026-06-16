const multer = require('multer');

//Configure storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        
        const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');;
        const fileName = "api-img-" + Date.now() + "-" + sanitizedFilename;
        
        cb(null, fileName)
    }
})

// Set file size limit and file filer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 200 * 1024 // 200KB
    },
    fileFilter: (req, file, cb) => {
        cb(null, true)
    }
})

// Middleware wrapper to handle Multer errors inside this file

const fileUpload = (req, res, next) => {
    upload.single("file")(req, res, (err) => {
        console.log(err?.code);

        if (err) {
            if (err?.code === "LIMIT_UNEXPECTED_FILE") {
                return res.status(400).json({
                    success: false,
                    message: "File too large! Maximum size is 200KB."
                })
            }
            return res.status(400).json({
                success: false,
                message: "File upload failed"
            })
        }
        next();

    })
}
module.exports = fileUpload;