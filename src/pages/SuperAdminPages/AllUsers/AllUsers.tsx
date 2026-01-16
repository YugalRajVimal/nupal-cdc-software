import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { FiUser, FiMail, FiPhone, FiTag, FiHash, FiLogIn } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;

type FlattenedUser = {
  _id: string;
  shortId: string;
  name: string;
  email: string;
  role: string;
  fromCollection: 'therapists' | 'patients' | 'admin' | 'unknown';
  phone?: string;
  [key: string]: any;
};

// For grouping patient family
type FamilyGroupPatient = {
  _id: string; // main userId._id of the family (parent userId)
  shortId: string; // display as string, or "-"
  name: string; // Parent Name (Father + Mother full name, fallback to user name)
  parentEmail: string;
  familyPatients: any[]; // List of all children for that family
  displayNames: string; // joined children names
  role: string;
  fromCollection: 'patients';
  phone?: string;
  userEmail: string;
  fatherFullName?: string;
  motherFullName?: string;
  address?: string;
  areaName?: string;
};

const extractShortId = (user: any, type: string): string => {
  if (type === 'therapists' && user.therapistId) return user.therapistId;
  if (type === 'patients' && user.patientId) return user.patientId;
  if (type === 'admin' && (user.subAdminId || user.adminId)) return user.subAdminId || user.adminId;
  if (user.userId && type !== 'admin') {
    if (type === 'therapists' && user.userId.therapistId) return user.userId.therapistId;
    if (type === 'patients' && user.userId.patientId) return user.userId.patientId;
    if (type === 'admin' && (user.userId.subAdminId || user.userId.adminId)) return user.userId.subAdminId || user.userId.adminId;
  }
  return user._id || '';
};

// New: helper to group patients by parentEmail or userId.email
const groupPatientsByParentEmail = (patients: any[]): FamilyGroupPatient[] => {
  const familyGroups: { [key: string]: FamilyGroupPatient } = {};

  for (const patient of patients) {
    if (!patient.userId) continue;

    // Fallback logic for grouping: first try parentEmail, then userId.email.
    const parentEmail = patient.parentEmail || patient.userId.email;
    const userId = patient.userId._id || patient._id;
    const userEmail = patient.userId.email || patient.parentEmail || '';
    if (!parentEmail) continue;

    if (!familyGroups[parentEmail]) {
      // Parent display name logic
      let displayParentName = 'N/A';
      if (patient.fatherFullName || patient.motherFullName) {
        displayParentName =
          (patient.fatherFullName ?? '') +
          (patient.fatherFullName && patient.motherFullName ? ' / ' : '') +
          (patient.motherFullName ?? '');
      } else if (patient.userId && patient.userId.name) {
        displayParentName = patient.userId.name;
      } else if (patient.name) {
        displayParentName = patient.name;
      }
      familyGroups[parentEmail] = {
        _id: userId,
        shortId: extractShortId(patient, 'patients'),
        name: displayParentName,
        parentEmail: parentEmail,
        displayNames: '', // to fill in below
        familyPatients: [],
        role: patient.userId.role || 'patient',
        fromCollection: 'patients',
        phone: patient.userId.phone || patient.mobile1 || '',
        userEmail: userEmail,
        fatherFullName: patient.fatherFullName,
        motherFullName: patient.motherFullName,
        address: patient.address,
        areaName: patient.areaName,
      };
    }
    familyGroups[parentEmail].familyPatients.push(patient);
  }

  // Populate displayNames for children (comma separated)
  Object.values(familyGroups).forEach(family => {
    family.displayNames = family.familyPatients.map(p => `${p.name} (${p.patientId || '-'})`).join(', ');
  });

  // If shortId not representative, fall back to family
  Object.values(familyGroups).forEach(family => {
    // Compose shortId as comma separated patientIds (first one used as key)
    family.shortId =
      family.familyPatients.map(p => p.patientId || '-').join(', ') ||
      family.familyPatients.map(p => p._id).join(', ') ||
      family._id;
  });

  return Object.values(familyGroups);
};

const extractUsersFromResponse = (data: any): FlattenedUser[] => {
  const users: FlattenedUser[] = [];

  if (!data) return users;

  // Therapists and admins as before
  if (Array.isArray(data.therapists)) {
    data.therapists.forEach((therapist: any) => {
      if (therapist.userId) {
        users.push({
          _id: therapist.userId._id || therapist._id,
          shortId: extractShortId(therapist, 'therapists'),
          name: therapist.userId.name || 'N/A',
          email: therapist.userId.email || 'N/A',
          role: therapist.userId.role || 'therapist',
          fromCollection: 'therapists',
          phone: therapist.userId.phone || therapist.mobile1 || '',
        });
      }
    });
  }

  // Group patients by parent email for display
  if (Array.isArray(data.patients)) {
    // New: Get all grouped family patients
    const families = groupPatientsByParentEmail(data.patients);
    for (const family of families) {
      users.push({
        _id: family._id,
        shortId: family.shortId, // now a comma-separated patient ids string
        name: family.name, // parent names if present
        email: family.userEmail || family.parentEmail, // main userId email
        parentEmail: family.parentEmail,
        displayNames: family.displayNames, // children names
        role: family.role,
        fromCollection: 'patients',
        phone: family.phone,
        familyPatients: family.familyPatients, // array of all children for that parentEmail
        fatherFullName: family.fatherFullName,
        motherFullName: family.motherFullName,
        address: family.address,
        areaName: family.areaName,
      });
    }
  }

  if (Array.isArray(data.admins)) {
    data.admins.forEach((admin: any) => {
      users.push({
        _id: admin._id,
        shortId: extractShortId(admin, 'admin'),
        name: admin.name || 'N/A',
        email: admin.email || 'N/A',
        role: admin.role || 'admin',
        fromCollection: 'admin',
        phone: admin.phone || '',
      });
    });
  }
  return users;
};

// Add All Users to the tab switches
const ROLE_OPTIONS = [
  { label: "All Users", value: "all" },
  { label: "All Patients", value: "patients" },
  { label: "All Therapist", value: "therapists" },
  { label: "All Admin", value: "admin" },
];

const TableHeadCell = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <th className="py-3 px-4 text-sm font-semibold text-slate-600 bg-slate-100 border-b border-slate-200 whitespace-nowrap">
    {children}
  </th>
);

const TableCell = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <td
    className={
      "py-2.5 px-4 border-b border-slate-100 text-sm " + className
    }
  >
    {children}
  </td>
);

type UserRowProps = {
  user: FlattenedUser;
  onLoginAsUser: (_user: FlattenedUser) => void;
  loggingInUserId?: string | null;
};

const UserRow = ({
  user,
  onLoginAsUser,
  loggingInUserId,
}: UserRowProps) => {
  // For "patients" show children under family if applicable
  const showFamilyChildren = user.fromCollection === 'patients' && user.displayNames;
  return (
    <tr
      className="hover:bg-blue-50 transition"
      key={`${user._id}-${user.fromCollection}`}
    >
      <TableCell className="font-mono text-blue-900 font-bold">
        <div className="flex items-center gap-2">
          <FiHash className="text-blue-400" />
          <span>{user.shortId || user._id}</span>
        </div>
      </TableCell>
      <TableCell className="font-semibold text-slate-700">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <FiUser className="text-blue-600" />
            {user.name}
          </div>
          {showFamilyChildren && (
            <div className="text-xs mt-1 text-blue-500 font-mono">
              <span>Children:&nbsp;{user.displayNames}</span>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <FiMail className="text-slate-500" />
            <span className="font-mono text-xs">{user.email}</span>
          </div>
          {user.fromCollection === "patients" && user.parentEmail && (
            <div className="text-xs text-purple-600 mt-0.5">
              Parent Email: {user.parentEmail}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className="
          inline-flex items-center gap-2 
          px-2 rounded-full text-xs font-medium
          " 
          style={{
            background:
              user.role === "admin"
                ? "#f3e8ff"
                : user.role === "therapist"
                ? "#e0f2fe"
                : "#fef9c3",
            color:
              user.role === "admin"
                ? "#7c3aed"
                : user.role === "therapist"
                ? "#0ea5e9"
                : "#eab308",
          }}
        >
          <FiTag />
          {user.role}
        </span>
      </TableCell>
      <TableCell>
        <span
          className={
            "capitalize px-2 py-1 rounded text-xs font-semibold " +
            (user.fromCollection === "therapists"
              ? "bg-blue-100 text-blue-700"
              : user.fromCollection === "patients"
              ? "bg-yellow-100 text-yellow-700"
              : user.fromCollection === "admin"
              ? "bg-purple-100 text-purple-700"
              : "bg-slate-100 text-slate-600")
          }
        >
          {user.fromCollection}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <FiPhone className="text-green-600" />
            <span className="font-mono">{user.phone || '-'}</span>
          </div>
          {user.fromCollection === "patients" && user.address && (
            <div className="text-xs text-slate-500 mt-0.5">
              Address: {user.address}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <button
          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 hover:text-blue-900 text-xs font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={() => onLoginAsUser(user)}
          disabled={loggingInUserId === user._id}
          title="Log In As This User"
          aria-label="Log In As User"
        >
          <FiLogIn className="text-base" />
          {loggingInUserId === user._id ? "Logging in..." : "Log In As"}
        </button>
      </TableCell>
    </tr>
  );
};

type AllUsersProps = {
  navigate?: ReturnType<typeof useNavigate>;
};

// To support being called inside and outside <Router>, AllUsers checks for navigate prop
const AllUsers: React.FC<AllUsersProps> = () => {
  const [users, setUsers] = useState<FlattenedUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<'all' | 'patients' | 'therapists' | 'admin'>('patients');
  const hasFetchedOnce = useRef(false);

  const [loggingInUserId, setLoggingInUserId] = useState<string | null>(null);

  // let _navigate: ReturnType<typeof useNavigate> | undefined;
  // Support for being run both inside and outside of a Router
  // try {
  //   _navigate = props.navigate ?? useNavigate();
  // } catch (e) {
  //   _navigate = undefined;
  // }

  const fetchAllUsers = async (abortSignal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/api/super-admin/users`, {
        signal: abortSignal,
      });
      const { data } = res;
      console.log(data);
      let extractedUsers: FlattenedUser[] = [];
      if (
        typeof data === 'object' &&
        (Array.isArray(data.therapists) ||
          Array.isArray(data.patients) ||
          Array.isArray(data.admins))
      ) {
        extractedUsers = extractUsersFromResponse(data);
      } else if (Array.isArray(data)) {
        extractedUsers = data.map(u => ({
          ...u,
          fromCollection: 'unknown',
          shortId: u._id,
        }));
      } else {
        extractedUsers = [];
      }
      setUsers(extractedUsers);
    } catch (err: unknown) {
      let errMessage = 'Failed to fetch users';
      if (axios.isAxiosError(err)) {
        if (err.response) {
          errMessage =
            (typeof err.response.data === 'string'
              ? err.response.data
              : err.response.data?.message) ||
            `Server responded with status ${err.response.status}`;
        } else if (err.request) {
          errMessage = 'No response received from server. Check your connection.';
        } else if (err.message) {
          errMessage = err.message;
        }
      } else if (err instanceof Error) {
        errMessage = err.message;
      }
      setError(errMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Log In As User Handler
  const handleLoginAsUser = async (user: FlattenedUser) => {
    if (!user || !user._id) return;
    setLoggingInUserId(user._id);
    setError(null);

    try {
      const res = await axios.post(
        `${API_BASE}/api/super-admin/users/login-as-user`,
        { userId: user._id },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const { token, role, user: userData } = res.data;

      console.log(res.data);

      // Set token in localStorage based on the user's role
      if (role === "patient") {
        localStorage.setItem("patient-token", token);
        window.location.href = "/parent";
      } else if (role === "therapist") {
        localStorage.setItem("therapist-token", token);
        window.location.href = "/therapist";
      } else if (role === "admin") {
        localStorage.setItem("admin-token", token);
        window.location.href = "/admin";
      } else {
        localStorage.setItem("authToken", token);
        window.location.href = "/";
      }
      localStorage.setItem("userRole", role);
      localStorage.setItem("userData", JSON.stringify(userData));
    } catch (err: any) {
      let errMessage = "Failed to log in as user.";
      if (axios.isAxiosError(err)) {
        if (err.response?.data?.error) {
          errMessage = err.response.data.error;
        } else if (err.response?.data?.message) {
          errMessage = err.response.data.message;
        } else if (typeof err.response?.data === "string") {
          errMessage = err.response.data;
        }
      } else if (err instanceof Error) {
        errMessage = err.message;
      }
      setError(errMessage);
    } finally {
      setLoggingInUserId(null);
    }
  };

  // Ensure API is hit correctly on first visit/mount
  useEffect(() => {
    if (!hasFetchedOnce.current) {
      hasFetchedOnce.current = true;
      setUsers([]);
      setLoading(true);
      setError(null);
      const controller = new AbortController();
      fetchAllUsers(controller.signal);
      return () => {
        controller.abort();
      };
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (hasFetchedOnce.current) {
      setUsers([]);
      setLoading(true);
      setError(null);
      const controller = new AbortController();
      fetchAllUsers(controller.signal);
      return () => {
        controller.abort();
      };
    }
    // eslint-disable-next-line
  }, [activeRole]);

  // Filtering: for "patients", now users are per family/parentEmail, so no further filtering needed
  let filteredUsers: FlattenedUser[];
  if (activeRole === 'all') {
    filteredUsers = users;
  } else {
    filteredUsers = users.filter(user => user.fromCollection === activeRole);
  }

  return (
    <div className="w-full px-5 py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-blue-900">All Users</h1>
      </div>

      {/* Tab Switches */}
      <div className="flex gap-2 flex-wrap mb-3">
        {ROLE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => {
              setUsers([]);
              setLoading(true);
              setError(null);
              setActiveRole(opt.value as 'all' | 'patients' | 'therapists' | 'admin');
            }}
            className={
              "text-sm font-semibold px-4 py-2 rounded-full transition border border-blue-300" +
              (activeRole === opt.value
                ? " bg-blue-600 text-white border-blue-700 shadow"
                : " bg-white text-blue-700 hover:bg-blue-50")
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
        <table className="min-w-[800px] w-full">
          <thead>
            <tr>
              <TableHeadCell>User ID</TableHeadCell>
              <TableHeadCell>
                {activeRole === 'patients'
                  ? 'Parent / Family Name'
                  : 'Name'
                }
              </TableHeadCell>
              <TableHeadCell>
                {activeRole === 'patients'
                  ? 'Parent/Child Email'
                  : 'Email'
                }
              </TableHeadCell>
              <TableHeadCell>Role</TableHeadCell>
              <TableHeadCell>Type</TableHeadCell>
              <TableHeadCell>Phone</TableHeadCell>
              <TableHeadCell>
                <span className="flex items-center gap-1 justify-center">
                  <FiLogIn className="mb-0.5" />
                  Log In As
                </span>
              </TableHeadCell>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-blue-600 font-medium">
                  Loading users...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-red-600 font-semibold">
                  {error}
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-500">
                  No {activeRole === 'all'
                    ? 'users'
                    : activeRole === 'patients'
                    ? 'families'
                    : activeRole === 'therapists'
                    ? 'therapists'
                    : 'admins'
                  } found.
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <UserRow
                  key={`${user._id}-${user.fromCollection}`}
                  user={user}
                  onLoginAsUser={handleLoginAsUser}
                  loggingInUserId={loggingInUserId}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllUsers;