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

export default function SupervisorUploadedAssetsDataTable() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [reports, setReports] = useState<MilkReport[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [filter, setFilter] = useState<string>(""); // Add filter state
  const [selectedHistory, setSelectedHistory] = useState<any[] | null>(null); // modal state

  const hiddenColumns = ["_id", "__v", "createdAt", "updatedAt", "uploadedBy"];

  const fetchReports = async (pageNumber: number) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_URL}/api/supervisor/get-uploaded-assets-report`,
        {
          params: { page: pageNumber, limit },
          headers: { Authorization: localStorage.getItem("supervisor-token") },
        }
      );

      setReports(res.data.data || []);
      setColumns(
        res.data.data.length > 0
          ? Object.keys(res.data.data[0]).filter(
              (col) => !hiddenColumns.includes(col)
            )
          : []
      );
      setTotalPages(res.data.totalPages || 1);
      setPage(res.data.currentPage || 1);
    } catch (err) {
      console.error("Error fetching milk reports:", err);
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
  }, [page]);

  // Filtering logic on the whole row, searching all columns, case-insensitive
  const filterText = filter.trim().toLowerCase();
  const filteredReports = filterText
    ? reports.filter((row) => {
        const rowStr = columns
          .map((col) => {
            if (col === "uploadedOn")
              return formatDate(row[col], true);
            if (col === "docDate")
              return formatDate(row[col]);
            if (Array.isArray(row[col]) && col === "history")
              return "history";
            if (typeof row[col] === "object" && row[col] !== null)
              return Object.values(row[col]).join(", ");
            return row[col] !== undefined && row[col] !== null ? String(row[col]) : "";
          })
          .join(" ")
          .toLowerCase();
        return rowStr.includes(filterText);
      })
    : reports;

  if (loading) return <p className="p-4 text-gray-500">Loading reports...</p>;
  if (!reports || reports.length === 0)
    return <p className="p-4 text-gray-500">No data available</p>;

  return (
    <>
      <div className="mb-2 flex justify-between items-center">
        <div className="relative">
          <input
            type="text"
            className="block w-[250px] px-3 py-2 text-sm rounded border border-gray-200 focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-900 dark:text-white"
            placeholder="Search across all columns..."
            value={filter}
            onChange={e => {
              setFilter(e.target.value);
              // Optionally, could reset to page 1 on filter change if needed
              // setPage(1);
            }}
            aria-label="Search across all fields"
          />
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
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
                    {col.trim()}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400"
                  >
                    No matching data
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columns.map((col) => (
                      <TableCell
                        key={col}
                        className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400"
                      >
                        {col === "uploadedOn" ? (
                          formatDate(row[col], true)
                        ) : col === "docDate" ? (
                          formatDate(row[col])
                        ) : Array.isArray(row[col]) && col === "history" ? (
                          <Button onClick={() => setSelectedHistory(row[col])}>
                            View History ({row[col].length})
                          </Button>
                        ) : typeof row[col] === "object" ? (
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
