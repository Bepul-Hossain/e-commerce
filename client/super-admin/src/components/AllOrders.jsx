import { useCallback, useEffect, useRef, useState } from "react";
import { baseURL } from "../helper/config";
import { ToWords } from "to-words"
import { ErrorToast, formatDate } from "../helper/helper";
import Paginate from "../helper/Paginate";
import { useNavigate, useSearchParams } from "react-router-dom";
import invoiceStore from "../store/invoiceStore";
import { useReactToPrint } from "react-to-print"

const AllOrders = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const per_page = 6;
  const page_no = searchParams.get("page_no") || 1;
  let [fromDate, setFromDate] = useState("");
  let [toDate, setToDate] = useState("");

  let {
    allOrderListRequest,
    allOrderList,
    totalAllOrderList,
    readSingleInvoiceSingleUser,
    singleInvoiceSingleUserRequest,
  } = invoiceStore();

  useEffect(() => {
    (async () => {
      await allOrderListRequest(per_page, page_no, fromDate, toDate);
    })()
  }, [allOrderListRequest, per_page, page_no, fromDate, toDate]);
  //Pagination function
  const handelPageClick = async (event) => {
    let page_no = event.selected + 1;
    await allOrderListRequest(per_page, page_no, fromDate, toDate);
    navigate(`/all-orders?page_no=${page_no}`);
  }
  // const handelPageClick = () => {
  //   let page_no = event.selected + 1;
  //   allOrderRequest(per_page, page_no);
  //   navigate(`/all-orders?page_no=${page_no}`);
  // };

  const handlDownload = () => {
    try {
      let url = baseURL + "/export-csv";
      if (fromDate && toDate) {
        url = url + `?from=${fromDate}&to=${toDate}`
      }
      window.open(url, "_blank");
    } catch (error) {
      console.log(error);
      ErrorToast("Something went wrong.");
    }
  }

  let viewOrder = (id) => {
    singleInvoiceSingleUserRequest(id);
  }
  const toWords = new ToWords({
    localeCode: "en-US",
    converterOptions: {
      currency: true,
      currencyOptions: {
        name: "Taka",
        plural: "Taka",
        symbol: "Tk",
        fractionalUnit: {
          name: "Paisa",
          plural: "Paisa",
          symbol: "",
        },
      },
    },
  });

  const componentRef = useRef(null);
  const printfn = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "Invoice",

  })
  const handlePrint = () => {
    if (!componentRef.current) {
      console.error("componentRef is null");
      return;
    }
    printfn();
  };
  return (
    <div className="dashboard-body__content">
      {/* ========================= Statement section start =========================== */}
      <div className="card shadow-sm p-3 mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label className="form-label fw-semibold">From Date</label>
            <input
              type="date"
              className="form-control"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label fw-semibold">To Date</label>
            <input
              type="date"
              className="form-control"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className="col-md-3 text-center">
            <button onClick={handlDownload} className="btn d-block btn-primary px-4 mt-2">
              Download CSV
            </button>
          </div>
        </div>
      </div>
      <div className="row gy-4">
        <div className="col-12">
          <div className="card common-card border border-gray-five">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table text-body mt--24">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Customer name</th>
                      <th>Order ID</th>
                      <th>Payment status</th>
                      <th>Deliver status</th>
                      <th>Deliver Action</th>
                      <th>Total Payable</th>
                      <th>Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allOrderList && allOrderList?.map((item, index) => (
                      <tr key={index}>
                        <td>December 1, 2025</td>
                        <td>Alex Johnson</td>

                        <td>
                          <span>1</span>
                        </td>
                        <td>
                          <span
                            className={`badge text-capitalize rounded-pill bg-success`}
                          >
                            success
                          </span>{" "}
                        </td>
                        <td>
                          <span
                            className={`badge text-capitalize rounded-pill bg-warning`}
                          >
                            Pending
                          </span>
                        </td>
                        <td>
                          <button>
                            <select
                              // disabled={item?.deliver_status === "cancel"}
                              className=" common-input border custom"
                              defaultValue={"pending"}
                            >
                              <option value={"pending"}>Pending</option>
                              <option value={"delivered"}>Delivered</option>
                              <option value={"cancel"}>Cancel</option>
                            </select>
                          </button>
                        </td>

                        <td>
                          <p> 1000</p>
                        </td>
                        <td>
                          <button
                            className="btn btn-success"
                            data-bs-toggle="modal"
                            data-bs-target={`#exampleModal_1`}
                            onClick={() => viewOrder(item?._id)}
                          >
                            View
                          </button>
                        </td>
                      </tr>

                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flx-between justify-content-end gap-2">
                <nav aria-label="Page navigation example">
                  <div>
                    <Paginate page_no={1} per_page={5} totalCount={10} />
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ========================= Statement section End =========================== */}

      {/*  */}
      <>
        <div
          className="modal fade order_item"
          id={`exampleModal_1`}
          tabIndex={-1}
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fs-5" id="exampleModalLabel">
                  Super Admin Invoice View
                </h6>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <div className="profile">
                  <div className="row gy-4">
                    <div className="col-12">
                      <div className="container my-5">
                        {/* Invoice Content */}
                        <div className="p-5 bg-white" ref={componentRef}>
                          {/* Header */}
                          <div className="row mb-4 border-bottom pb-3">
                            <div className="col-sm-6">
                              <h2 className="fw-bold">INVOICE</h2>
                              <p className="mb-0">#INV no: {readSingleInvoiceSingleUser?._id}</p>
                              <p className="mb-0">
                                #TRA no: {readSingleInvoiceSingleUser?.tran_id}
                              </p>
                              <small>Date: {formatDate(readSingleInvoiceSingleUser?.createdAt)}</small>
                            </div>
                            <div className="col-sm-6 text-end">
                              <h5 className="fw-bold">PixBO</h5>
                              <p className="mb-0">123 Street, Chittagong</p>
                              <p className="mb-0">support@pixbo.com</p>
                              <p className="mb-0">+880 1234 567 890</p>
                            </div>
                          </div>

                          {/* Billing Details */}
                          <div className="row mb-4">
                            <div className="col-sm-6">
                              <h6 className="fw-bold">Bill To:</h6>
                              <p className="mb-0">{readSingleInvoiceSingleUser?.cus_details?.[0].Name}</p>

                              <p className="mb-0">{readSingleInvoiceSingleUser?.cus_details?.[0].Email}</p>
                              <p className="mb-0">{readSingleInvoiceSingleUser?.cus_details?.[0].Phone}</p>
                              <p className="mb-0">
                                {readSingleInvoiceSingleUser?.cus_details?.[0].Address}
                              </p>
                            </div>
                            <div className="col-sm-6 text-end">
                              <h6 className="fw-bold">Payment information: </h6>
                              <p className="mb-1">
                                Payment Status:{" "}
                                <span
                                  className={`fw-bold  text-capitalize ${readSingleInvoiceSingleUser?.payment_status ===
                                    "success"
                                    ? "text-success"
                                    : readSingleInvoiceSingleUser?.payment_status ===
                                      "cancel" ? "text-danger" : "text-warning"
                                    }`}
                                >
                                  {readSingleInvoiceSingleUser?.payment_status}
                                </span>
                              </p>
                              <p className="mb-1">
                                Deliver Status:{" "}
                                <span
                                  className={`fw-bold text-capitalize ${readSingleInvoiceSingleUser?.deliver_status ===
                                    "delivered" ? "text-success"
                                    : readSingleInvoiceSingleUser?.deliver_status ===
                                      "pending" ? "text-warning" : "text-danger"
                                    }`}
                                >
                                  {readSingleInvoiceSingleUser?.delivery_status}
                                </span>
                              </p>
                              <p className="mb-0">
                                Total payable:{" "}
                                <span className="fw-bold text-uppercase">
                                  {readSingleInvoiceSingleUser?.payable} tk.
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Table */}
                          <div className="table-responsive invoice mb-4">
                            <table className="table  align-middle">
                              <thead className="table-light">
                                <tr>
                                  <th>Product</th>
                                  <th className="text-center">Color</th>
                                  <th className="text-center">Size</th>
                                  <th className="text-center">Quantity</th>
                                  <th className="text-center">Price</th>
                                  <th className="text-end">Total</th>
                                </tr>
                              </thead>
                              <tbody className="text-dark">
                                {
                                  readSingleInvoiceSingleUser && readSingleInvoiceSingleUser?.invoicesproducts?.map((item, index) => (
                                    <tr key={index}>
                                      <td className="text-start">{item?.product_name}</td>
                                      <td>{item?.color}</td>
                                      <td>{item?.size}</td>
                                      <td>{item?.qty}</td>
                                      <td>{item?.price} Tk.</td>
                                      <td className="text-end">{item?.price * item?.qty} Tk.</td>
                                    </tr>
                                  ))
                                }
                              </tbody>
                            </table>
                          </div>

                          {/* Summary */}
                          <div className="row justify-content-end">
                            <div className="col-8">
                              <p className="text-danger small fst-italic">
                                {readSingleInvoiceSingleUser &&
                                  toWords.convert(readSingleInvoiceSingleUser?.total)
                                }
                              </p>
                            </div>
                            <div className="col-4">
                              <ul className="list-unstyled">
                                <li className="d-flex justify-content-between mb-2">
                                  <span>Subtotal:</span> <span>{readSingleInvoiceSingleUser?.total} Tk.</span>
                                </li>
                                <li className="d-flex justify-content-between mb-2">
                                  <span>Vat (15%):</span>{" "}
                                  <span>{readSingleInvoiceSingleUser?.vat} Tk.</span>
                                </li>
                                <li className="d-flex justify-content-between mb-2">
                                  <span>Shipping cost:</span>{" "}
                                  <span>75 Tk.</span>
                                </li>
                                <li className="d-flex justify-content-between border-top pt-2 fw-bold">
                                  <span>Total:</span> <span>{readSingleInvoiceSingleUser?.payable} Tk.</span>
                                </li>
                              </ul>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="text-center mt-5 text-muted small">
                            <p className="mb-1">Thank you for your purchase!</p>
                            <p>
                              This invoice was generated electronically and is
                              valid without a signature.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                >
                  Close
                </button>
                <button onClick={handlePrint} type="button" className="btn btn-primary">
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    </div>
  );
};

export default AllOrders;
