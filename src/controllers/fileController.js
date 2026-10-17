const fs = require("fs");
const path = require("path");
const { del } = require("@vercel/blob");
const fileModel = require("../models/fileModel");
// File upload
exports.fileUpload = async (req, res) => {
    try {
        const { filename } = req.file;
        let data = await fileModel.create({ filename });
        res.status(200).json({
            success: true,
            message: "File uploaded successfully.",
            data
        })

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong.",
        });
    }
}

// All file
exports.allFile = async (req, res) => {
    try {
        let page_no = parseInt(req.params.page_no);
        let per_page = parseInt(req.params.per_page);
        let skipRow = (page_no - 1) * per_page;

        let sortStage = { createdAt: -1 };
        let facetStage = {
            $facet: {
                totalCount: [{ $count: "count" }],
                files: [
                    { $sort: sortStage },
                    { $skip: skipRow },
                    { $limit: per_page },
                    {
                        $project: {
                            updatedAt: 0
                        }
                    }
                ],
            }
        }

        let files = await fileModel.aggregate([facetStage]);

        res.status(200).json({
            success: true,
            message: "File retrieved successfully.",
            data: files[0]
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong.",
        });
    }
}

// file remove
exports.fileRemove = async (req, res) => {
    try {
        let _id = req.body?._id;
        let filename = req.body?.filename;

        if (process.env.BLOB_READ_WRITE_TOKEN) {
            await del(`${process.env.BLOB_BASE_URL}/${filename}`);
        } else {
            const filePath = path.join(__dirname, `../../uploads/${filename}`);
            fs.unlinkSync(filePath, (err) => {
                if (err) {
                    console.log(err);
                }
            });
        }

        let data = await fileModel.deleteOne({ _id, filename });
        res.status(200).json({
            success: true,
            message: "File removed successfully.",
            data
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong.",
        });
    }
}