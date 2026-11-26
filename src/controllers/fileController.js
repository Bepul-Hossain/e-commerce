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
        let page_no = Math.max(parseInt(req.params.page_no) || 1, 1);
        let per_page = Math.max(parseInt(req.params.per_page) || 12, 1);
        let skipRow = (page_no - 1) * per_page;

        // Optional ?keyword= : case-insensitive "contains" search on filename.
        // Regex special characters are escaped so the keyword is matched literally.
        let keyword = (req.query.keyword || "").toString().trim();
        let matchStage = { $match: {} };
        if (keyword) {
            let escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            matchStage = { $match: { filename: { $regex: escaped, $options: "i" } } };
        }

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

        let files = await fileModel.aggregate([matchStage, facetStage]);

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

        if (!filename) {
            return res.status(400).json({
                success: false,
                message: "filename is required.",
            });
        }

        await del(filename);

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