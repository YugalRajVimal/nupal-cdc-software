import { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { UserCircleIcon, ChevronDownIcon, ChevronUpIcon } from "../../../icons";
import Button from "../../../components/ui/button/Button";

interface SubAdmins {
  _id: string;
  name: string;
  email: string;
  phoneNo: string;
  nickName: string;
  address: {
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
  };
  zone: string;
}

interface Supervisor {
  _id: string;
  name: string;
  supervisorId: string;
  email: string;
  phoneNo: string;
  address: {
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
  };
  // route should be array of number type
  supervisorRoutes: number[];
  onboardedBy: string;
}

interface Vendor {
  _id: string;
  name: string;
  vendorId: string;
  email: string;
  phoneNo: string;
  address: {
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
  };
  route: string | number;
}



// Modal component for unassigned vendors (sorted by route number + show routes on top)
const Modal: React.FC<{
  show: boolean;
  onClose: () => void;
  vendors: Vendor[];
}> = ({ show, onClose, vendors }) => {
  // Categorize by route numbers, sorting route numbers in ascending order (with "Unassigned" last if present)
  const vendorsByRoute: { [key: string]: Vendor[] } = {};
  vendors.forEach((vendor) => {
    const route =
      vendor.route !== undefined && vendor.route !== null
        ? String(vendor.route)
        : "Unassigned";
    if (!vendorsByRoute[route]) {
      vendorsByRoute[route] = [];
    }
    vendorsByRoute[route].push(vendor);
  });

  // Sorted route keys: numerics ascending, "Unassigned" last
  const sortedRouteKeys = Object.keys(vendorsByRoute).sort((a, b) => {
    // If either is "Unassigned", always sort to end
    if (a === "Unassigned") return 1;
    if (b === "Unassigned") return -1;
    const na = Number(a),
      nb = Number(b);
    // If both are numbers, sort numerically
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    // Otherwise, lex sort
    return a.localeCompare(b);
  });

  // Top bar: Show all unassigned routes (numeric, ascending)
  const numericRoutes = sortedRouteKeys
    .filter((r) => !isNaN(Number(r)) && r !== "Unassigned")
    .map((r) => Number(r));
  // Remove duplicates and sort again (in case of accidental duplicates - should be safe).
  const uniqueSortedRoutes = Array.from(new Set(numericRoutes)).sort(
    (a, b) => a - b
  );

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30"
      style={{ backdropFilter: "blur(4px)" }}
    >
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-7xl max-h-[90vh] overflow-y-auto border border-gray-300 relative">
        <h2 className="text-lg font-bold mb-2">
          Vendors Not Assigned to Any Supervisor
        </h2>
        <button
          onClick={onClose}
          className="absolute top-2 right-4 rounded-full text-lg px-2 py-1 text-gray-600 hover:bg-gray-200"
          title="Close"
        >
          &times;
        </button>

        {/* ROUTES LISTED ON TOP HERE */}
        {uniqueSortedRoutes.length > 0 && (
          <div className="mb-2">
            <span className="font-medium text-gray-700">
              Unassigned Route Numbers:&nbsp;
            </span>
            {uniqueSortedRoutes.map((routeNo) => (
              <span
                key={routeNo}
                className="inline-block mx-1 mb-1 text-blue-800 bg-blue-100 px-3 py-1 rounded text-sm font-bold"
              >
                {routeNo}
              </span>
            ))}
          </div>
        )}

        {sortedRouteKeys.map((route) => (
          <div key={route}>
            <div className="mt-4 mb-2 font-bold text-blue-700">
              Route:{" "}
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {route}
              </span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Name</TableCell>
                  <TableCell isHeader>Vendor ID</TableCell>
                  <TableCell isHeader>Email</TableCell>
                  <TableCell isHeader>Phone No.</TableCell>
                  <TableCell isHeader>Address</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendorsByRoute[route].map((vendor) => (
                  <TableRow key={vendor._id}>
                    <TableCell className="flex items-center gap-3">
                      <UserCircleIcon width={20} height={20} /> {vendor.name}
                    </TableCell>
                    <TableCell>{vendor.vendorId}</TableCell>
                    <TableCell>
                      <a
                        href={`mailto:${vendor.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {vendor.email}
                      </a>
                    </TableCell>
                    <TableCell>{vendor.phoneNo}</TableCell>
                    <TableCell>
                      {vendor.address?.addressLine}, {vendor.address?.city},{" "}
                      {vendor.address?.state}, {vendor.address?.pincode}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
        {vendors.length === 0 && (
          <div className="mt-4 text-center text-gray-500">
            All vendors are assigned to a supervisor.
          </div>
        )}
      </div>
    </div>
  );
};

const AdminTreeFormation = () => {
  const [subadmins, setSubAdmins] = useState<SubAdmins[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [expandedSubAdmins, setExpandedSubAdmins] = useState<string[]>([]);
  const [expandedSupervisors, setExpandedSupervisors] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filter, setFilter] = useState<string>("");

  // Modal for unassigned vendors
  const [showModal, setShowModal] = useState(false);

  // Fetch SubAdmins
  useEffect(() => {
    const fetchSubAdmins = async () => {
      try {
        const token = localStorage.getItem("admin-token");
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/get-all-sub-admins`,
          { headers: { Authorization: `${token}` } }
        );
        setSubAdmins(res.data.subadmins || []);
      } catch (err: any) {
        console.error("Error fetching subadmins:", err);
        setError(
          err.response?.data?.message ||
            "Failed to fetch subadmins. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSubAdmins();
  }, []);

  // Fetch Supervisors & Vendors
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("admin-token");
        const [supervisorRes, vendorRes] = await Promise.all([
          axios.get(
            `${import.meta.env.VITE_API_URL}/api/admin/get-all-supervisors`,
            { headers: { Authorization: `${token}` } }
          ),
          axios.get(
            `${import.meta.env.VITE_API_URL}/api/admin/get-all-vendors`,
            { headers: { Authorization: `${token}` } }
          ),
        ]);
        // Expecting .supervisors in the API now for consistency
        setSupervisors(
          supervisorRes.data.supervisors || supervisorRes.data.vendors || []
        );
        setVendors(vendorRes.data.vendors || []);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.message || "Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleSubAdminExpand = (id: string) => {
    setExpandedSubAdmins((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const toggleSupervisorExpand = (id: string) => {
    setExpandedSupervisors((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  // Filtering logic
  // Filter on: name, email, phoneNo, nickName, _id , vendorId, supervisorId, route (anywhere in subadmin, supervisor or vendor)
  const filterText = filter.trim().toLowerCase();

  // Set of all route numbers assigned to supervisors
  const allAssignedRoutes = new Set<string>();
  supervisors.forEach((sup) => {
    if (Array.isArray(sup.supervisorRoutes)) {
      sup.supervisorRoutes.forEach((r) => {
        if (typeof r !== "undefined") allAssignedRoutes.add(String(r));
      });
    }
  });
  // Unassigned vendors: vendors whose route doesn't exist in any supervisor.supervisorRoutes
  const unassignedVendors: Vendor[] = vendors.filter((vendor) => {
    return (
      !allAssignedRoutes.has(String(vendor.route)) &&
      typeof vendor.route !== "undefined" &&
      vendor.route !== null
    );
  });

  const filteredSubAdmins = filterText
    ? subadmins.filter((subadmin) => {
        // Check subadmin fields
        const matchSubadmin =
          (subadmin.name && subadmin.name.toLowerCase().includes(filterText)) ||
          (subadmin.email &&
            subadmin.email.toLowerCase().includes(filterText)) ||
          (subadmin.phoneNo &&
            subadmin.phoneNo.toLowerCase().includes(filterText)) ||
          (subadmin.nickName &&
            subadmin.nickName.toLowerCase().includes(filterText)) ||
          (subadmin._id && subadmin._id.toLowerCase().includes(filterText));
        if (matchSubadmin) return true;

        // Check related supervisors fields
        const supervisorsForSub = supervisors.filter(
          (s) => s.onboardedBy === subadmin._id
        );
        for (const sup of supervisorsForSub) {
          const matchSupervisor =
            (sup.name && sup.name.toLowerCase().includes(filterText)) ||
            (sup.supervisorId &&
              sup.supervisorId.toLowerCase().includes(filterText)) ||
            (sup.email && sup.email.toLowerCase().includes(filterText)) ||
            (sup.phoneNo && sup.phoneNo.toLowerCase().includes(filterText)) ||
            (Array.isArray(sup.supervisorRoutes) &&
              sup.supervisorRoutes.some((r) =>
                String(r).toLowerCase().includes(filterText)
              )) ||
            (sup._id && sup._id.toLowerCase().includes(filterText));
          if (matchSupervisor) return true;

          // Check related vendor fields for this supervisor (by route mapping)
          let relatedVendors: Vendor[] = [];
          if (Array.isArray(sup.supervisorRoutes)) {
            relatedVendors = vendors.filter(
              (v) =>
                typeof v.route !== "undefined" &&
                sup.supervisorRoutes.some((r) => String(r) === String(v.route))
            );
          }
          for (const ven of relatedVendors) {
            const matchVendor =
              (ven.name && ven.name.toLowerCase().includes(filterText)) ||
              (ven.email && ven.email.toLowerCase().includes(filterText)) ||
              (ven.phoneNo && ven.phoneNo.toLowerCase().includes(filterText)) ||
              (ven.vendorId &&
                ven.vendorId.toLowerCase().includes(filterText)) ||
              (ven.route &&
                String(ven.route).toLowerCase().includes(filterText)) ||
              (ven._id && ven._id.toLowerCase().includes(filterText));
            if (matchVendor) return true;
          }
        }
        return false;
      })
    : subadmins;

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-10 h-10 border-4 border-t-brand-500 border-gray-200 rounded-full animate-spin"></div>
      </div>
    );

  if (error)
    return (
      <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded-md">
        {error}
      </div>
    );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Show button to open modal for unassigned vendors */}
      <div className="flex items-center gap-4 p-4">
        <Button
          onClick={() => setShowModal(true)}
          disabled={unassignedVendors.length === 0}
        >
          View Unassigned Vendors{" "}
          {unassignedVendors.length > 0
            ? `(${unassignedVendors.length})`
            : ""}
        </Button>
        {unassignedVendors.length === 0 && (
          <span className="text-xs text-green-600">
            All vendors are assigned to supervisor routes
          </span>
        )}
      </div>

      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        vendors={unassignedVendors}
      />

      <div className="max-w-full overflow-x-auto">
        {/* Filter Input */}
        <div className="p-4">
          <input
            type="text"
            className="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Search by Name, Email, Phone No, Nick Name, ID, Vendor ID, Supervisor ID or Route..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <Table>
          {/* Header */}
          <TableHeader className="border-b border-gray-100">
            <TableRow>
              <TableCell isHeader>Sub Admin Id</TableCell>
              <TableCell isHeader>Name & Nick Name</TableCell>
              <TableCell isHeader>Zone / Routes</TableCell>
              <TableCell isHeader>Email & Phone No.</TableCell>
              <TableCell isHeader>
                Address Line, City, State, Pin Code
              </TableCell>
              {/* <TableCell isHeader>Action</TableCell> */}
            </TableRow>
          </TableHeader>

          {/* Body */}
          <TableBody className="divide-y divide-gray-100">
            {filteredSubAdmins.map((subadmin) => {
              const relatedSupervisors = supervisors.filter(
                (s) => s.onboardedBy === subadmin._id
              );
              const isSubAdminExpanded = expandedSubAdmins.includes(
                subadmin._id
              );

              // Instead of fragments, return an array of table rows and section
              let result: React.ReactNode[] = [];

              // SubAdmin Row
              result.push(
                <TableRow
                  key={subadmin._id}
                  className="cursor-pointer hover:bg-gray-50  text-center"
                >
                  <TableCell className="px-4 py-6 flex items-center gap-2">
                    {isSubAdminExpanded ? (
                      <ChevronDownIcon
                        onClick={() => toggleSubAdminExpand(subadmin._id)}
                        className="w-5 h-5 text-gray-600"
                      />
                    ) : (
                      <ChevronUpIcon
                        onClick={() => toggleSubAdminExpand(subadmin._id)}
                        className="w-5 h-5 text-gray-600"
                      />
                    )}
                    {subadmin._id}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3 text-left">
                      <UserCircleIcon width={28} height={28} />
                      <span className="font-medium text-gray-800">
                        {subadmin.name} <br /> {subadmin.nickName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{subadmin.zone}</TableCell>
                  <TableCell className="text-left px-2">
                    <a href={`mailto:${subadmin.email}`}>{subadmin.email}</a>
                    <br />
                    {subadmin.phoneNo}
                  </TableCell>
                  <TableCell>
                    {subadmin.address?.addressLine}, {subadmin.address?.city},{" "}
                    {subadmin.address?.state}, {subadmin.address?.pincode}
                  </TableCell>
                </TableRow>
              );

              // Supervisors (Expandable section)
              if (isSubAdminExpanded) {
                relatedSupervisors.forEach((supervisor) => {
                  const isSupervisorExpanded = expandedSupervisors.includes(
                    supervisor._id
                  );
                  const { supervisorRoutes } = supervisor;

                  // Supervisor Row
                  result.push(
                    <TableRow
                      key={supervisor._id}
                      className="cursor-pointer ml-4 hover:bg-violet-300 bg-violet-200"
                    >
                      <TableCell className="px-10 py-4 flex items-center gap-2">
                        {isSupervisorExpanded ? (
                          <ChevronDownIcon
                            onClick={() =>
                              toggleSupervisorExpand(supervisor._id)
                            }
                            className="w-5 h-5 text-gray-500"
                          />
                        ) : (
                          <ChevronUpIcon
                            onClick={() =>
                              toggleSupervisorExpand(supervisor._id)
                            }
                            className="w-5 h-5 text-gray-500"
                          />
                        )}
                        <UserCircleIcon width={24} height={24} />
                        <span className="font-semibold text-gray-800">
                          {supervisor.name} (Supervisor)
                        </span>
                      </TableCell>
                      <TableCell>{supervisor.supervisorId}</TableCell>
                      <TableCell>
                        {Array.isArray(supervisorRoutes)
                          ? supervisorRoutes.join(", ")
                          : ""}
                      </TableCell>
                      <TableCell>
                        <a
                          href={`mailto:${supervisor.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {supervisor.email}
                        </a>
                        <br />
                        {supervisor.phoneNo}
                      </TableCell>
                      <TableCell>
                        {supervisor.address?.addressLine},{" "}
                        {supervisor.address?.city}, {supervisor.address?.state},{" "}
                        {supervisor.address?.pincode}
                      </TableCell>
                    </TableRow>
                  );

                  // Vendors for each supervisor route as groups
                  if (isSupervisorExpanded && Array.isArray(supervisorRoutes)) {
                    supervisorRoutes.forEach((routeNo) => {
                      const vendorsForRoute = vendors.filter((v) => {
                        if (typeof v.route === "number") {
                          return v.route === routeNo;
                        }
                        return String(v.route) === String(routeNo);
                      });
                      if (vendorsForRoute.length === 0) return;
                      // Route label row
                      result.push(
                        <TableRow
                          key={`route-label-${supervisor._id}-${routeNo}`}
                          className="ml-8 bg-blue-100"
                        >
                          <TableCell className="pl-16 font-bold text-blue-700">
                            Route No: {routeNo}
                          </TableCell>
                        </TableRow>
                      );
                      // Vendor rows for this route
                      vendorsForRoute.forEach((vendor) => {
                        result.push(
                          <TableRow
                            key={vendor._id}
                            className="border-l-4 ml-12 border-blue-400 hover:bg-blue-300 bg-blue-200"
                          >
                            <TableCell className="px-14 py-3 flex items-center gap-3">
                              <UserCircleIcon width={20} height={20} />
                              <span>{vendor.name} (Vendor)</span>
                            </TableCell>
                            <TableCell>{vendor.vendorId}</TableCell>
                            <TableCell>{vendor.route}</TableCell>
                            <TableCell>
                              <a
                                href={`mailto:${vendor.email}`}
                                className="text-blue-600 hover:underline"
                              >
                                {vendor.email}
                              </a>
                              <br />
                              {vendor.phoneNo}
                            </TableCell>
                            <TableCell>
                              {vendor.address?.addressLine},{" "}
                              {vendor.address?.city}, {vendor.address?.state},{" "}
                              {vendor.address?.pincode}
                            </TableCell>
                            {/* <TableCell /> */}
                          </TableRow>
                        );
                      });
                    });
                  }
                });
              }

              return result;
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminTreeFormation;
