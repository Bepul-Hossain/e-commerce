// Vercel Blob helpers. All uploaded files live in Vercel Blob — there is no local disk storage.
// Credentials come from the environment: BLOB_READ_WRITE_TOKEN, or BLOB_STORE_ID + VERCEL_OIDC_TOKEN.

// Public base URL of the store, e.g. https://abc123.public.blob.vercel-storage.com
// Uses BLOB_BASE_URL when set, otherwise derives it from BLOB_STORE_ID ("store_ABC123" -> "abc123").
const getBlobBaseUrl = () => {
    if (process.env.BLOB_BASE_URL) {
        return process.env.BLOB_BASE_URL.replace(/\/+$/, "");
    }
    if (process.env.BLOB_STORE_ID) {
        const id = process.env.BLOB_STORE_ID.replace(/^store_/, "").toLowerCase();
        return `https://${id}.public.blob.vercel-storage.com`;
    }
    throw new Error("Vercel Blob is not configured: set BLOB_BASE_URL or BLOB_STORE_ID.");
};

const getBlobFileUrl = (filename) => `${getBlobBaseUrl()}/${encodeURIComponent(filename)}`;

module.exports = { getBlobBaseUrl, getBlobFileUrl };
