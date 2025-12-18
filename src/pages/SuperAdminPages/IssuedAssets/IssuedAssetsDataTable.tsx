import { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import Button from "../../../components/ui/button/Button";

// Modal Component (basic)
function Modal({ isOpen, onClose, children }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed w-full h-full inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-[90vw] max-h-[80vh] overflow-y-auto">
        {children}
        <div className="mt-4 text-right">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

interface MilkReport {
  [key: string]: any;
}

export default function UploadedAdminAssetsDataTable() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [reports, setReports] = useState<MilkReport[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedHistory, setSelectedHistory] = useState<any[] | null>(null); // modal state
  const [filter, setFilter] = useState(""); // new filter state

  const hiddenColumns = ["_id", "__v", "createdAt", "updatedAt", "uploadedBy"];

  const fetchReports = async (pageNumber: number) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_URL}/api/admin/get-all-issued-assets-report`,
        {
          params: { page: pageNumber, limit },
          headers: { Authorization: localStorage.getItem("admin-token") },
        }
      );

      const reports = res.data.data || [];

      setReports(reports);
      setColumns(
        reports.length > 0
          ? Object.keys(reports[0]).filter(
              (col) => !hiddenColumns.includes(col)
            )
          : []
      );
      setTotalPages(res.data.totalPages || 1);
      setPage(res.data.currentPage || 1);
    } catch (err) {
      console.error("Error fetching issued assets reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value: string | Date | null, withTime = false) => {
    if (!value) return "";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...(withTime && { hour: "2-digit", minute: "2-digit" }),
    }).format(date);
  };

  useEffect(() => {
    fetchReports(page);
    // filter should not clear data on page change
    // eslint-disable-next-line
  }, [page]);

  // Filter reports according to row content
  const filteredReports = !filter
    ? reports
    : reports.filter((row) =>
        columns.some((col) => {
          const val = row[col];
          let str = "";

          if (col === "uploadedOn") {
            str = formatDate(val, true);
          } else if (col === "docDate") {
            str = formatDate(val);
          } else if (Array.isArray(val) && col === "history") {
            str = `history: ${val.length}`;
          } else if (typeof val === "object" && val !== null) {
            str = Object.values(val).join(", ");
          } else {
            str = String(val ?? "");
          }

          return str.toLowerCase().includes(filter.trim().toLowerCase());
        })
      );

  if (loading) return <p className="p-4 text-gray-500">Loading reports...</p>;
  if (!reports || reports.length === 0)
    return <p className="p-4 text-gray-500">No data available</p>;

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="p-4 flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            type="text"
            placeholder="Filter..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:border-blue-400 dark:bg-gray-800 dark:text-white w-full sm:w-72"
            spellCheck={false}
            aria-label="Filter assets"
          />
        </div>
        <div className="max-w-full overflow-x-auto">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col}
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    {col.trim() === "subAdminId" ? "Sub Admin Details" : col.trim()}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell  className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    No matching records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columns.map((col) => (
                      <TableCell
                        key={col}
                        className="px-4 py-3 text-gray-500 whitespace-nowrap text-start text-theme-sm dark:text-gray-400"
                      >
                        {col === "uploadedOn" ? (
                          formatDate(row[col], true)
                        ) : col === "docDate" ? (
                          formatDate(row[col])
                        ) : Array.isArray(row[col]) && col === "history" ? (
                          <Button onClick={() => setSelectedHistory(row[col])}>
                            View History ({row[col].length})
                          </Button>
                        ) : col === "subAdminId" && typeof row[col] === "object" && row[col] !== null ? (
                          // Print all key-value pairs of subAdminId, separated by comma, but each pair on a different line
                          <div>
                            {Object.entries(row[col]).map(([k, v], idx) => (
                              <div key={idx}>
                                {`${k}: ${v}`}
                                {idx !== Object.entries(row[col]).length - 1 && ","}
                              </div>
                            ))}
                          </div>
                        ) : typeof row[col] === "object" && row[col] !== null ? (
                          Object.values(row[col]).join(", ")
                        ) : (
                          row[col] ?? ""
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center p-4">
          <Button
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          >
            Previous
          </Button>
          <p className="text-gray-500">
            Page {page} of {totalPages}
          </p>
          <Button
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          >
            Next
          </Button>
        </div>
        
      </div>

      {/* History Modal */}
      <Modal
        isOpen={!!selectedHistory}
        onClose={() => setSelectedHistory(null)}
      >
        <h2 className="text-lg font-semibold mb-4">Asset History</h2>
        {selectedHistory && selectedHistory.length > 0 ? (
          <div className="max-w-full overflow-x-auto">
            
            <Table>
              {/* Table Header */}
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  {Object.keys(selectedHistory[0]).map((col) => (
                    <TableCell
                      key={col}
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>

              {/* Table Body */}
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {selectedHistory.map((h, idx) => (
                  <TableRow key={idx}>
                    {Object.keys(h).map((col) => (
                      <TableCell
                        key={col}
                        className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400"
                      >
                        {col === "changedOn"
                          ? formatDate(h[col], true)
                          : typeof h[col] === "object"
                          ? JSON.stringify(h[col])
                          : String(h[col] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-gray-500">No history available</p>
        )}
      </Modal>
    </>
  );
}
