const mongoose = require('mongoose');

const DataSchema = new mongoose.Schema(
    {
        filename: { type: String, required: true },
    },
    {
        timestamps: true,
        versionKey: false
    }
);


const fileModel = mongoose.model('files', DataSchema);
module.exports = fileModel;