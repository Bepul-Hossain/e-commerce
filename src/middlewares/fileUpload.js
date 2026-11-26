const multer = require('multer');
const { put } = require('@vercel/blob');

// Files are always kept in memory and uploaded to Vercel Blob (never written to disk)

const makeFileName = (originalname) => {
    const d = new Date();
    const formatted = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;

    // Separate the file extension so it stays at the very end
    const lastDotIndex = originalname.lastIndexOf('.');
    const name = lastDotIndex !== -1 ? originalname.substring(0, lastDotIndex) : originalname;
    const ext = lastDotIndex !== -1 ? originalname.substring(lastDotIndex) : '';

    // Sanitize the name and extension
    const sanitizedName = name.replace(/[^a-zA-Z0-9\-_]/g, '');
    const sanitizedExt = ext.replace(/[^a-zA-Z0-9.]/g, '');

    return `${sanitizedName}-${formatted}-${Date.now()}${sanitizedExt}`;
};

//Configure storage engine
const storage = multer.memoryStorage();

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
        if (err) {
            console.error(err);
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

        if (req.file) {
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
