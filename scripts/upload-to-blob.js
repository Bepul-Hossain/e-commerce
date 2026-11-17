// One-off: copy every file in ./uploads to Vercel Blob, keeping the same names.
// Usage: BLOB_READ_WRITE_TOKEN=... node scripts/upload-to-blob.js
const fs = require('fs');
const path = require('path');
const { put } = require('@vercel/blob');

const dir = path.join(__dirname, '..', 'uploads');

(async () => {
    for (const name of fs.readdirSync(dir)) {
        const { url } = await put(name, fs.readFileSync(path.join(dir, name)), {
            access: 'public',
            addRandomSuffix: false,
            allowOverwrite: true,
        });
        console.log(url);
    }
})();
