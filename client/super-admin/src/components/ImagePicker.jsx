import { useEffect, useState } from "react";
import axios from "axios";
import { baseURL, baseURLFile } from "../helper/config";

const PER_PAGE = 12;

/**
 * Pick images from the uploaded files (searchable by filename).
 *
 * Props:
 *  - value:    array of selected filenames, e.g. ["api-img-1-a.png"]
 *  - onChange: called with the new array when the selection changes
 *  - multiple: true (default) = pick many; false = pick one (clicking another
 *              image replaces it, value is [] or [filename])
 *
 * Uses its own local state (not fileStore) so it doesn't disturb
 * the File Manager page's list.
 */
const ImagePicker = ({ value = [], onChange, multiple = true }) => {
  const [searchText, setSearchText] = useState("");
  const [keyword, setKeyword] = useState("");
  const [files, setFiles] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // New keyword always starts from page 1 (both set together = one fetch)
  const applyKeyword = (kw) => {
    setKeyword(kw);
    setPage(1);
  };

  // Debounce typing: apply the keyword 400ms after the user stops
  useEffect(() => {
    const kw = searchText.trim();
    if (kw === keyword) return;
    const timer = setTimeout(() => applyKeyword(kw), 400);
    return () => clearTimeout(timer);
  }, [searchText, keyword]);

  // Fetch the current page; page 1 replaces the list, later pages append
  useEffect(() => {
    let ignore = false; // drop responses from outdated requests
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await axios.get(`${baseURL}/all-file/${PER_PAGE}/${page}`, {
          params: keyword ? { keyword } : {},
          withCredentials: true,
        });
        if (ignore) return;
        const data = res?.data?.data;
        const newFiles = data?.files || [];
        setFiles((prev) => (page === 1 ? newFiles : [...prev, ...newFiles]));
        setTotal(data?.totalCount?.[0]?.count || 0);
      } catch (err) {
        console.log(err);
        if (!ignore) setError(true);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [keyword, page]);

  const isSelected = (filename) => value.includes(filename);

  const toggle = (filename) => {
    if (isSelected(filename)) {
      onChange(value.filter((f) => f !== filename));
    } else {
      onChange(multiple ? [...value, filename] : [filename]);
    }
  };

  const remove = (filename) => onChange(value.filter((f) => f !== filename));

  const hasMore = files.length < total;

  return (
    <div className="border rounded p-3">
      {/* Selected images (in the order they were picked; first = main image) */}
      <div className="mb-3">
        <p className="mb-2 small fw-600">
          {multiple ? `Selected: ${value.length}` : "Selected image"}
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="btn btn-link btn-sm text-danger p-0 ms-2 align-baseline"
            >
              {multiple ? "Clear all" : "Clear"}
            </button>
          )}
        </p>
        {value.length === 0 ? (
          <p className="text-muted small mb-0">
            {multiple
              ? "No images selected. Click images below to select them."
              : "No image selected. Click an image below to select it."}
          </p>
        ) : (
          <div className="d-flex flex-wrap gap-2">
            {value.map((filename, index) => (
              <div
                key={filename}
                className="position-relative border rounded overflow-hidden"
                style={{ width: 80, height: 80 }}
                title={filename}
              >
                <img
                  src={`${baseURLFile}/${filename}`}
                  alt={filename}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                {multiple && index === 0 && (
                  <span className="badge bg-primary position-absolute bottom-0 start-0 m-1">
                    Main
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(filename)}
                  className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1 rounded-circle lh-1 px-2 py-1"
                  aria-label={`Remove ${filename}`}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="input-group mb-3">
        <input
          type="search"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => {
            // Enter: search now, skip the debounce; don't submit any form
            if (e.key === "Enter") {
              e.preventDefault();
              applyKeyword(searchText.trim());
            }
          }}
          className="form-control"
          placeholder="Search images by filename..."
          aria-label="Search images by filename"
        />
        {searchText && (
          <button
            type="button"
            onClick={() => {
              setSearchText("");
              applyKeyword("");
            }}
            className="btn btn-outline-secondary"
            aria-label="Clear search"
          >
            &times;
          </button>
        )}
      </div>

      {/* Results */}
      {error ? (
        <p className="text-danger small text-center mb-0">
          Could not load images. Please try again.
        </p>
      ) : !loading && files.length === 0 ? (
        <p className="text-muted small text-center mb-0">
          {keyword ? `No images found matching "${keyword}"` : "No images uploaded yet"}
        </p>
      ) : (
        <div
          className="row g-2 overflow-auto"
          style={{ maxHeight: 360 }}
        >
          {files.map((item) => {
            const selected = isSelected(item.filename);
            return (
              <div key={item._id} className="col-4 col-md-3 col-lg-2">
                <button
                  type="button"
                  onClick={() => toggle(item.filename)}
                  aria-pressed={selected}
                  title={item.filename}
                  className={`w-100 p-0 bg-transparent rounded overflow-hidden position-relative ${
                    selected ? "border border-3 border-primary" : "border"
                  }`}
                >
                  <img
                    src={`${baseURLFile}/${item.filename}`}
                    alt={item.filename}
                    loading="lazy"
                    style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }}
                  />
                  {selected && (
                    <span className="badge bg-primary position-absolute top-0 end-0 m-1">
                      {multiple ? value.indexOf(item.filename) + 1 : "✓"}
                    </span>
                  )}
                  <span className="d-block small text-truncate px-1">
                    {item.filename}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {loading && <p className="text-muted small text-center mt-2 mb-0">Loading...</p>}

      {hasMore && !loading && !error && (
        <div className="text-center mt-2">
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            className="btn btn-outline-primary btn-sm"
          >
            Load more ({files.length} of {total})
          </button>
        </div>
      )}
    </div>
  );
};

export default ImagePicker;
