const multer = require('multer');
const { put } = require('@vercel/blob');

// Vercel's filesystem is read-only, so when a Blob token is present
// files are kept in memory and uploaded to Vercel Blob instead of disk
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

const makeFileName = (originalname) => {
    const sanitizedFilename = originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
    return "api-img-" + Date.now() + "-" + sanitizedFilename;
}

//Configure storage engine
const storage = useBlob ? multer.memoryStorage() : multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, makeFileName(file.originalname))
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
    upload.single("file")(req, res, async (err) => {
        console.log(err?.code);

        if (err) {
            if (err?.code === "LIMIT_FILE_SIZE") {
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

        if (useBlob && req.file) {
            try {
                const fileName = makeFileName(req.file.originalname);
                await put(fileName, req.file.buffer, {
                    access: 'public',
                    addRandomSuffix: false,
                    contentType: req.file.mimetype,
                });
                req.file.filename = fileName;
            } catch (error) {
                console.error(error);
                return res.status(500).json({
                    success: false,
                    message: "File upload failed"
                })
            }
        }
        next();

    })
}
module.exports = fileUpload;
