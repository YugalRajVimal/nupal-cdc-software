import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  FiDownload,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
} from "react-icons/fi";
import axios from "axios";
import * as XLSX from "xlsx";
import clsx from "clsx";

import { load } from "@cashfreepayments/cashfree-js";

// Extended PaymentDetail interface to support new fields from backend contract
interface PaymentDiscount {
  _id: string;
  discountEnabled: boolean;
  discount: number; // percentage
  couponCode: string;
  validityDays: number;
  createdAt: string;
}

interface CashfreeInfo {
  cf_order_id?: string;
  order_id?: string; // THE FIELD WE WANT TO DISPLAY
  payment_session_id?: string;
  order_status?: string;
  order_amount?: number;
  order_currency?: string;
  order_note?: string;
  order_expiry_time?: string;
  created_at?: string;
  customer?: {
    customer_id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  order_meta?: {
    return_url?: string;
    notify_url?: string;
  };
}

interface PaymentDetailInfo {
  _id: string;
  paymentId: string;
  totalAmount: number;
  discountInfo: {
    code: string | null;
    percent: number;
    amount: number;
  };
  amount: number;
  amountPaid: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  paymentTime: string;
  cashfree?: CashfreeInfo;
}

interface PaymentDetail {
  InvoiceId: string;
  date: string;
  childrenName: string;
  childrenId?: string;
  amount: number; // original invoice amount
  status: string;
  originalInvoiceAmount?: number;
  invoiceAmount?: number;
  dueAmount?: number; // (deprecated: will now be recalculated in frontend)
  discount?: PaymentDiscount;
  paymentDetail?: PaymentDetailInfo;
}

interface PaymentsResponse {
  success: boolean;
  payments: PaymentDetail[];
  total: number;
  page: number;
  limit: number;
  message?: string;
  error?: string;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

// Updated downloadExcel: Add "Order Id"
function downloadExcel(filename: string, rows: PaymentDetail[]) {
  const worksheetData = [
    [
      "InvoiceId",
      "Order Id",
      "Date",
      "Children Name",
      "Amount",
      "Paid",
      "Due",
      "Discount (%)",
      "Status",
    ],
    ...rows.map((row) => {
      // Use the same functions as table to decide "Paid", "Due", "Discount"
      const amountPaid = getAmountPaid(row);
      const discountPercent = getDiscountPercent(row);
      const due = calculateDueAmount(row);

      // Find Order Id: from paymentDetail.cashfree.order_id, else blank
      const orderId =
        row.paymentDetail?.cashfree?.order_id ||
        row.paymentDetail?.cashfree?.cf_order_id ||
        "-";

      return [
        row.InvoiceId,
        orderId,
        row.date ? new Date(row.date).toLocaleDateString("en-GB") : "",
        row.childrenName,
        row.amount,
        amountPaid ?? "-", // paid from paymentDetail
        typeof due === "number" ? due : "-", // frontend calculated due
        discountPercent ?? "-", // percent discount if any
        row.status,
      ];
    }),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices & Payments");
  XLSX.writeFile(
    workbook,
    filename.endsWith(".xlsx") ? filename : filename + ".xlsx"
  );
}

// Debounce helper
function useDebouncedValue<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// Helper to show percent, fixed 2 decimals if needed
const formatPercent = (percent?: number) =>
  typeof percent === "number"
    ? percent % 1 !== 0
      ? percent.toFixed(2) + "%"
      : percent + "%"
    : "-";

// Helper: Calculate discount percent from payment if present
function getDiscountPercent(payment: PaymentDetail): number {
  if (payment.discount?.discountEnabled) {
    return payment.discount.discount;
  }
  if (
    payment.paymentDetail?.discountInfo &&
    payment.paymentDetail.discountInfo.percent
  ) {
    return payment.paymentDetail.discountInfo.percent;
  }
  return 0;
}

function getAmountPaid(payment: PaymentDetail) {
  if (typeof payment.paymentDetail?.amountPaid === "number")
    return payment.paymentDetail.amountPaid;
  // fallback: no paid? assume 0
  return 0;
}

// CALCULATE DUE AMOUNT LOGIC: do NOT use dueAmount from backend, instead calculate as follows:
function calculateDueAmount(payment: PaymentDetail): number | "-" {
  const amount = typeof payment.amount === "number" ? payment.amount : 0;
  const amountPaid = getAmountPaid(payment);

  // get percent discount
  let percent = getDiscountPercent(payment);

  // Defensive: percent could be null/undefined
  percent = typeof percent === "number" && !isNaN(percent) ? percent : 0;

  let discountAmount = (amount * percent) / 100;

  // Defensive: discountAmount should never exceed amount
  discountAmount = Math.min(discountAmount, amount);

  const due = Math.max(amount - discountAmount - amountPaid, 0);

  // If payment.amount is invalid, return "-"
  if (!amount || typeof due !== "number" || isNaN(due)) return "-";
  return due;
}

export default function InvoiveAndPaymentsPage() {
  // Table state
  const [paymentsData, setPaymentsData] = useState<PaymentsResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cashfree
  const [cashfree, setCashfree] = useState<any>(null);
  const [paymentInProgressId, setPaymentInProgressId] = useState<string | null>(
    null
  );

  // For "Check Status" button loading state
  const [statusCheckInProgressId, setStatusCheckInProgressId] = useState<string | null>(null);

  // Search & Pagination UI state (controlled separately)
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebouncedValue(searchText, 500);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // For preventing state reset when table data refreshes
  const pageSizeRef = useRef(pageSize);

  useEffect(() => {
    const initializeSDK = async () => {
      const sdk = await load({
        mode: "production",
      });
      setCashfree(sdk);
    };
    initializeSDK();
  }, []);

  // Fetch payments data
  useEffect(() => {
    setLoading(true);
    setError(null);
    const baseUrl = import.meta.env.VITE_API_URL || "";
    const token = localStorage.getItem("patient-token");
    const params = new URLSearchParams();
    params.append("page", String(currentPage));
    params.append("limit", String(pageSize));
    if (debouncedSearchText.trim().length > 0) {
      params.append("search", debouncedSearchText.trim());
    }

    axios
      .get(
        `${baseUrl}/api/parent/invoice-and-payment?${params.toString()}`,
        {
          headers: {
            Authorization: token ? token : undefined,
          },
        }
      )
      .then((response) => {
        setPaymentsData(response.data);
        console.log(response.data, "paymentsData");
        setLoading(false);
      })
      .catch((e) => {
        setError(
          e.response?.data?.message ||
            e.message ||
            "Failed to fetch payment details"
        );
        setPaymentsData(null);
        setLoading(false);
      });
  }, [debouncedSearchText, currentPage, pageSize]);

  // Get session ID
  const getSessionId = async (
    paymentId: string,
    name: string,
    email: string,
    phone: string,
    amount: number // add amount to session id
  ) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "";
      const response = await axios.post(
        `${API_URL}/api/cashfree/generate-session-id`,
        { paymentId, name, email, phone, amount },
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.status === 200) {
        const data = response.data;
        const orderInfo = {
          createdAt: data.created_at,
          orderId: data.order_id,
          orderAmount: data.order_amount,
          customerName: data.customer_details?.customer_name,
          customerEmail: data.customer_details?.customer_email,
          customerPhone: data.customer_details?.customer_phone,
        };
        return {
          ...orderInfo,
          sessionId: data.payment_session_id,
        };
      } else {
        console.error("Error generating sessionId");
        return null;
      }
    } catch (error) {
      console.error("Error generating sessionId:", error);
      return null;
    }
  };

  // Function for Check Payment Status button: redirect to payment-confirmation page
  const handleCheckStatus = (orderId: string) => {
    if (!orderId || orderId === "-") {
      alert("Order Id is not available for this payment.");
      return;
    }
    window.location.href = `${window.location.origin}/parent/payment-confirmation?orderId=${orderId}`;
  };

  // --- Pagination controls ---
  const totalCount = paymentsData?.total || 0;
  const numPages =
    paymentsData && paymentsData.limit > 0
      ? Math.ceil(totalCount / paymentsData.limit)
      : 1;

  const goToPage = (page: number) => {
    if (page < 1 || (numPages && page > numPages)) return;
    setCurrentPage(page);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    pageSizeRef.current = newSize;
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // --- Search bar controls ---
  const handleSearchInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearchText(e.target.value);
    setCurrentPage(1);
  };

  // For excel, gather all rows on screen only.
  const displayedRows = paymentsData?.payments || [];

  // Handle Payment via Cashfree for a given payment row
  const handlePayment = async (payment: PaymentDetail) => {
    setPaymentInProgressId(payment.InvoiceId);
    try {
      // Get children details from the row
      const { childrenName, InvoiceId } = payment;
      const email = "parent@email.com";
      const phone = "9999999999";
      // Calculate paid + due + discount info (frontend calculation)
      let amountToPay = calculateDueAmount(payment);

      if (typeof amountToPay !== "number" || amountToPay < 1) {
        setPaymentInProgressId(null);
        alert("Nothing due for this invoice.");
        return;
      }
      // Pass frontend calculated due as 'amount'
      const sessionData = await getSessionId(InvoiceId, childrenName, email, phone, amountToPay);
      if (!cashfree) {
        setPaymentInProgressId(null);
        console.error("Cashfree SDK not initialized.");
        return;
      }
      if (!sessionData?.sessionId) {
        setPaymentInProgressId(null);
        console.error("Session Id not found.");
        return;
      }
      let checkoutOptions = {
        paymentSessionId: sessionData.sessionId,
        returnUrl: `${window.location.origin}/parent/payment-confirmation?orderId=${sessionData.orderId}`,
        notifyUrl: `${import.meta.env.VITE_API_URL}/cashfreeWebhook`,
      };
      await cashfree
        .checkout(checkoutOptions)
        .then(function (data: any) {
          // Payment initiate
          console.log(data, "Payment Initiate");
        })
        .catch(function (error: any) {
          console.error(error);
        });
    } catch (error) {
      console.log(error);
    }
    setPaymentInProgressId(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Invoices & Payments
        </h1>
        {!loading && !error && paymentsData?.payments?.length ? (
          <button
            onClick={() =>
              downloadExcel("invoices-payments", paymentsData.payments)
            }
            className="flex items-center gap-2 px-3 py-2 border rounded text-sm text-slate-700 hover:bg-slate-100 transition"
          >
            <FiDownload /> Download Excel
          </button>
        ) : null}
      </div>

      {/* --- SEARCH + PAGE SIZE + PAGINATION above table --- */}
      <div className="flex flex-col md:flex-row md:items-center md:gap-8 gap-3 mb-4">
        {/* SEARCH */}
        <div className="flex-1 flex items-center gap-2 bg-white border rounded px-2 py-1">
          <FiSearch className="text-slate-400" />
          <input
            type="text"
            placeholder="Search by children name or Invoice ID"
            value={searchText}
            onChange={handleSearchInputChange}
            className="outline-none flex-1 px-1 py-2 bg-transparent text-slate-800 placeholder:text-slate-400"
          />
        </div>
        {/* PAGE SIZE */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Rows per page</span>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={pageSize}
            onChange={handlePageSizeChange}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        {/* PAGINATION */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            className={clsx(
              "px-1 py-1",
              currentPage <= 1 && "opacity-50 pointer-events-none"
            )}
            onClick={() => goToPage(1)}
            aria-label="First page"
          >
            <FiChevronsLeft size={18} />
          </button>
          <button
            className={clsx(
              "px-1 py-1",
              currentPage <= 1 && "opacity-50 pointer-events-none"
            )}
            onClick={() => goToPage(currentPage - 1)}
            aria-label="Previous page"
          >
            <FiChevronLeft size={18} />
          </button>
          <span className="px-2 text-slate-700 text-sm font-semibold select-none">
            Page {paymentsData?.page ?? currentPage} / {numPages || 1}
          </span>
          <button
            className={clsx(
              "px-1 py-1",
              currentPage >= numPages && "opacity-50 pointer-events-none"
            )}
            onClick={() => goToPage(currentPage + 1)}
            aria-label="Next page"
          >
            <FiChevronRight size={18} />
          </button>
          <button
            className={clsx(
              "px-1 py-1",
              currentPage >= numPages && "opacity-50 pointer-events-none"
            )}
            onClick={() => goToPage(numPages)}
            aria-label="Last page"
          >
            <FiChevronsRight size={18} />
          </button>
        </div>
      </div>
      {/* --- end search/paging bar --- */}

      {loading && (
        <div className="text-slate-600">Loading payment details...</div>
      )}
      {error && (
        <div className="text-red-500 mb-4">Error: {error}</div>
      )}

      {!loading && !error && paymentsData && (
        <div className="bg-white border rounded-lg overflow-hidden">
          {/* Make the table horizontally scrollable if its width exceeds the container,
              and give the table body a max height and make it vertically scrollable */}
          <div className="w-full overflow-x-auto">
            <div style={{ maxHeight: 420, overflowY: "auto" }}>
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left">Invoice ID</th>
                    <th className="px-4 py-3 text-left">Order Id</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Children Name</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-right">Due</th>
                    <th className="px-4 py-3 text-center">Discount (%)</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                    <th className="px-4 py-3 text-center">Check Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows && displayedRows.length > 0 ? (
                    displayedRows.map((payment, idx) => {
                      const amountPaid = getAmountPaid(payment);
                      const amountDue = calculateDueAmount(payment);
                      const discountPercent = getDiscountPercent(payment);
                      // Get Order Id from payment.paymentDetail.cashfree.order_id (preferred),
                      // fallback to cf_order_id, else blank
                      const orderIdVal =
                        payment.paymentDetail?.cashfree?.order_id ||
                        payment.paymentDetail?.cashfree?.cf_order_id ||
                        "-";
                      return (
                        <tr key={idx} className="border-t">
                          <td className="px-4 py-3 font-mono">{payment.InvoiceId}</td>
                          <td className="px-4 py-3 font-mono">
                            {orderIdVal}
                          </td>
                          <td className="px-4 py-3">
                            {payment.date
                              ? new Date(payment.date).toLocaleDateString("en-GB")
                              : "-"}
                          </td>
                          <td className="px-4 py-3">{payment.childrenName}</td>
                          <td className="px-4 py-3 text-right">
                            ₹{Number(payment.amount).toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 text-right">
                            ₹{amountPaid ? Number(amountPaid).toLocaleString("en-IN") : 0}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {typeof amountDue === "number"
                              ? `₹${Number(amountDue).toLocaleString("en-IN")}`
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {formatPercent(discountPercent)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={
                                payment.status === "paid"
                                  ? "text-green-600 font-semibold"
                                  : payment.status === "pending"
                                  ? "text-yellow-600 font-semibold"
                                  : payment.status === "partiallypaid"
                                  ? "text-orange-600 font-semibold"
                                  : "text-slate-800"
                              }
                            >
                              {payment.status
                                ? payment.status.charAt(0).toUpperCase() +
                                  payment.status.slice(1)
                                : ""}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {(payment.status === "pending" ||
                              payment.status === "partiallypaid") &&
                            typeof amountDue === "number" &&
                            amountDue > 0 ? (
                              <button
                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition text-sm disabled:opacity-50"
                                disabled={paymentInProgressId === payment.InvoiceId}
                                onClick={() => handlePayment(payment)}
                              >
                                {paymentInProgressId === payment.InvoiceId
                                  ? "Processing..."
                                  : "Pay Now"}
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {orderIdVal && orderIdVal !== "-" ? (
                              <button
                                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition text-sm disabled:opacity-50"
                                disabled={statusCheckInProgressId === orderIdVal}
                                onClick={() => handleCheckStatus(orderIdVal)}
                              >
                                Check Status
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-4 py-6 text-center text-slate-400"
                      >
                        No payment records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Display total summary/pagination below table if desired */}
      <div className="flex flex-row flex-wrap items-center justify-between gap-2 mt-4">
        <div className="text-sm text-slate-500">
          {/* Show the correct record indices and correct page */}
          {(() => {
            if (!paymentsData || paymentsData.total === 0) return "Showing 0 of 0 records";
            const startIdx =
              ((paymentsData.page ?? 1) - 1) * (paymentsData.limit ?? 10) + 1;
            const endIdx =
              ((paymentsData.page ?? 1) - 1) * (paymentsData.limit ?? 10) +
              (paymentsData.payments?.length || 0);
            return `Showing ${startIdx}-${endIdx} of ${paymentsData.total} record${
              paymentsData.total !== 1 ? "s" : ""
            }`;
          })()}
        </div>
        <div>{/* Duplicate pagination controls below if desired */}</div>
      </div>
      {/* Optionally, your PaymentConfirmation modal/dialog here if you want */}
      {/* <PaymentConfirmation orderDetails={orderDetails} /> */}
    </motion.div>
  );
}
