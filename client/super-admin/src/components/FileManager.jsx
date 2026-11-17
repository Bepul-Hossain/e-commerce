import { useNavigate, useSearchParams } from "react-router-dom";
import { baseURLFile } from "../helper/config";
import { DeleteAlertFile, ErrorToast, SuccessToast } from "../helper/helper";
import Paginate from "../helper/Paginate";
import { useRef, useState } from "react";
import fileStore from "../store/fileStore";
import { useEffect } from "react";
import Skeleton from "react-loading-skeleton";

// Must match the server limit in src/middlewares/fileUpload.js
const MAX_FILE_SIZE = 200 * 1024; // 200KB

const formatSize = (bytes) =>
  bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;

const FileManager = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  // Natural pixel size of the selected image, read when the preview loads
  const [dimensions, setDimensions] = useState(null);
  const fileInputRef = useRef(null);

  // Build a local preview URL for the selected file; free it when the
  // file changes or the component unmounts
  useEffect(() => {
    setDimensions(null);
    if (!file || !file.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isTooLarge = file && file.size > MAX_FILE_SIZE;

  const {
    fileUploadRequest,
    fileUploadLoading,
    allFile,
    allFileRequest,
    totalFile,
    fileRemoveRequest,
  } = fileStore();

  const per_page = 12;
  const page_no = searchParams.get("page_no") || 1;
  // Search keyword lives in the URL (?keyword=) so it survives refresh/paging
  const keyword = searchParams.get("keyword") || "";
  // What's typed in the box; pushed to the URL after a short pause
  const [searchText, setSearchText] = useState(keyword);

  const goTo = (page, kw) => {
    const params = new URLSearchParams();
    if (kw) params.set("keyword", kw);
    params.set("page_no", page);
    navigate(`/file-manager?${params.toString()}`);
  };

  // Keep the box in sync when the URL keyword changes from outside
  // (browser Back/Forward, clicking the sidebar link)
  useEffect(() => {
    setSearchText((prev) => (prev.trim() === keyword ? prev : keyword));
  }, [keyword]);

  // Debounce: search 400ms after the user stops typing, starting from page 1
  useEffect(() => {
    const kw = searchText.trim();
    if (kw === keyword) return;
    const timer = setTimeout(() => goTo(1, kw), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, keyword]);

  // Fetch whenever page or keyword in the URL changes
  useEffect(() => {
    (async () => {
      await allFileRequest(per_page, page_no, keyword);
    })()
  }, [allFileRequest, page_no, keyword]);

  // pagination function
  const handelPageClick = (event) => {
    goTo(event.selected + 1, keyword);
  };

  const handleUpload = async () => {
    if (!file) {
      ErrorToast("Please select a file");
      return;
    }
    if (isTooLarge) {
      ErrorToast("File too large! Maximum size is 200KB.");
      return;
    }
    const ok = await fileUploadRequest(file);
    if (ok) clearFile();
    await allFileRequest(per_page, page_no, keyword);
  };

  let deleteFile = async (_id, filename)=>{
    let res = await DeleteAlertFile(fileRemoveRequest, _id, filename);
    if(res){
      await allFileRequest(per_page, page_no, keyword);
    }
  }

  return (
    <>
      {/* Cover Photo Start */}
      <div className="cover-photo  overflow-hidden">
        <div className="avatar-upload p-5">
          <h2>Supper Admin</h2>
          <h5>File Manager</h5>
        </div>
      </div>
      {/* Cover Photo End */}
      <div className="dashboard-body__content profile-content-wrapper z-index-1 position-relative mt--150">
        {/* Profile Content Start */}
        <div className="profile">
          <div className="row gy-4">
            <div className="col-12">
              <div className="profile-info">
                <div className="container my-5 p-4 border rounded shadow-sm bg-white">
                  <h4 className="mb-3">Upload Files</h4>

                  {/* lg+: 2 columns (input | preview). Below lg: 1 column, stacked */}
                  <div className="row g-4">
                    {/* Column 1: choose file + file name + upload */}
                    <div className="col-12 col-lg-6">
                      <div className="mb-3">
                        <input
                          ref={fileInputRef}
                          onChange={(e) => setFile(e.target.files[0] || null)}
                          type="file"
                          accept="image/*"
                          className="form-control"
                        />
                      </div>

                      {file && (
                        <div className="mb-3 d-flex align-items-start gap-2 p-2 border rounded">
                          <div className="flex-grow-1 text-break">
                            <p className="mb-1 fw-600">{file.name}</p>
                            <p className={`mb-0 small ${isTooLarge ? "text-danger" : "text-muted"}`}>
                              {formatSize(file.size)}
                              {isTooLarge && " — too large, max 200KB"}
                            </p>
                            {dimensions && (
                              <p className="mb-0 small text-muted">
                                {dimensions.width} × {dimensions.height} px
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={clearFile}
                            disabled={fileUploadLoading}
                            className="btn btn-outline-secondary btn-sm"
                            aria-label="Remove selected file"
                          >
                            &times;
                          </button>
                        </div>
                      )}

                      <button onClick={handleUpload} disabled={fileUploadLoading || !file || isTooLarge} className="btn btn-danger ">
                        {fileUploadLoading ? "Uploading..." : "Upload"}
                      </button>
                    </div>

                    {/* Column 2: preview of the selected file, before upload */}
                    <div className="col-12 col-lg-6">
                      <div
                        className="border rounded d-flex align-items-center justify-content-center overflow-hidden bg-light"
                        style={{ height: 220 }}
                      >
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Preview"
                            onLoad={(e) =>
                              setDimensions({
                                width: e.currentTarget.naturalWidth,
                                height: e.currentTarget.naturalHeight,
                              })
                            }
                            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                          />
                        ) : (
                          <span className="text-muted small">
                            {file ? "No preview available" : "Image preview will appear here"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12">
              <div className="dashboard-card">
                <div className=" p-5">
                  <div className="row g-3 align-items-center mb-4">
                    <div className="col-12 col-md-6">
                      <h4 className="mb-0">Image Gallery</h4>
                    </div>
                    {/* Search by filename */}
                    <div className="col-12 col-md-6">
                      <div className="input-group">
                        <input
                          type="search"
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          onKeyDown={(e) => {
                            // Enter: search immediately, skip the debounce wait
                            if (e.key === "Enter") goTo(1, searchText.trim());
                          }}
                          className="form-control"
                          placeholder="Search by filename..."
                          aria-label="Search files by filename"
                        />
                        {searchText && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchText("");
                              goTo(1, "");
                            }}
                            className="btn btn-outline-secondary"
                            aria-label="Clear search"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {
                    allFile?.length === 0 && (
                      <p className="text-muted text-center">
                        {keyword
                          ? `No files found matching "${keyword}"`
                          : "No Images available"}
                      </p>
                    )
                  }
                  {
                    allFile === null ? (
                      <>
                        {[...Array(6).map(() => (
                          <div className="col-2 mb-5">
                            <div className="Skeleton">
                              <Skeleton count={8} />
                            </div>
                          </div>
                        ))]}
                      </>
                    ) : (
                      <>
                        <div className="row g-3">
                          {allFile?.map((item, index) => (
                            <div key={index} className="col-2 col-xl-3 col-md-4 mb-5">
                              <div className="card img_g shadow-sm position-relative">
                                {/* Delete button */}
                                <button
                                  onClick={() => deleteFile(item?._id, item?.filename)}
                                  className="btn  btn-danger position-absolute top-0 end-0 m-1 rounded-circle"
                                >
                                  &times;
                                </button>

                                {/* Image */}
                                <img
                                  src={`${baseURLFile}/${item?.filename}`}
                                  // src={`https://placehold.co/100x100`}
                                  className="card-img-top"
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />

                                {/* Card body */}
                                <div className="card-body p-2 text-center">
                                  <p
                                    className="small text-truncate mb-0 text-primary"
                                    style={{ cursor: "pointer" }}
                                    title="Click to copy"
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        `${baseURLFile}/${item?.filename}`
                                      );
                                      SuccessToast("Copied: " + item?.filename);
                                    }}
                                  >
                                    {item?.filename}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )
                  }
                  <nav aria-label="Page navigation example">
                    {
                      allFile?.length > 1 && (
                        <Paginate
                          handelPageClick={handelPageClick}
                          page_no={page_no}
                          per_page={per_page}
                          totalCount={totalFile}
                        />
                      )
                    }
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Profile Content End */}
      </div>
    </>
  );
};

export default FileManager;
