import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiTag,
  FiHash,
  FiLogIn,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

// === Design tokens ===
const COLORS = {
  bgCard: "bg-white",
  bgTable: "bg-slate-50",
  border: "border-gray-200",
  accent: "text-blue-700",
  accentBg: "bg-blue-100",
  shadow: "shadow-md",
  textLabel: "text-slate-600",
  textValue: "text-slate-800",
  error: "text-red-600",
  info: "text-blue-600",
  success: "text-green-600",
}

// API base
const API_BASE = import.meta.env.VITE_API_URL;

// === Data Types ===
type FlattenedUser = {
  _id: string;
  shortId: string;
  name: string;
  email: string;
  role: string;
  fromCollection: 'therapists' | 'children' | 'admin' | 'unknown';
  phone?: string;
  [key: string]: any;
};

type FamilyGroupChildren = {
  _id: string;
  shortId: string;
  name: string;
  motherPhoneNumber: string;
  familyChildren: any[];
  displayNames: string;
  role: string;
  fromCollection: 'children';
  phone?: string;
  userEmail: string;
  fatherFullName?: string;
  motherFullName?: string;
  motherOccupation?: string;
  address?: string;
  areaName?: string;
};

// === Formatting Helpers ===
function formatTherapistId(id: string | undefined): string {
  if (!id) return '';
  // Remove leading zeroes, then pad with zeros to 3 digits
  const numPart = String(id).replace(/[^\d]/g, '');
  if(!numPart) return id;
  return 'NPL' + numPart.padStart(3, '0');
}

function formatPatientId(id: string | undefined): string {
  if (!id) return '';
  const numPart = String(id).replace(/[^\d]/g, '');
  if(!numPart) return id;
  return 'P' + numPart.padStart(4, '0');
}

function getSortableIdNum(id: string, type: string) {
  let match;
  if (type === 'therapists') {
    // assume therapistId like NPLnnn or just nnn
    match = id.match(/\d+/);
  } else if (type === 'children') {
    // assume patientId like Pnnnn or just nnnn
    match = id.match(/\d+/);
  } else {
    return 0;
  }
  return match ? parseInt(match[0], 10) : 0;
}

// === Helpers ===
const extractShortId = (user: any, type: string): string => {
  // Return the id only, do not format here (format in render/sort)
  if (type === 'therapists' && user.therapistId) return user.therapistId;
  if (type === 'children' && user.patientId) return user.patientId;
  if (type === 'admin' && (user.subAdminId || user.adminId)) return user.subAdminId || user.adminId;
  if (user.userId && type !== 'admin') {
    if (type === 'therapists' && user.userId.therapistId) return user.userId.therapistId;
    if (type === 'children' && user.userId.patientId) return user.userId.patientId;
    if (type === 'admin' && (user.userId.subAdminId || user.userId.adminId)) return user.userId.subAdminId || user.userId.adminId;
  }
  return user._id || '';
};

const groupChildrenByMotherPhone = (childrenArr: any[]): FamilyGroupChildren[] => {
  const familyGroups: { [motherPhone: string]: FamilyGroupChildren } = {};

  for (const child of childrenArr) {
    if (!child.userId) continue;

    let motherPhoneNumber =
      child.mobile1 ||
      (child.userId ? child.userId.mobile1 : undefined) ||
      '';
    motherPhoneNumber = motherPhoneNumber ? String(motherPhoneNumber).trim() : '';

    if (!motherPhoneNumber) continue;

    const userId = child.userId._id || child._id;
    const userEmail = child.userId.email || child.parentEmail || '';
    if (!familyGroups[motherPhoneNumber]) {
      let displayParentName = 'N/A';
      if (child.fatherFullName || child.motherFullName) {
        displayParentName =
          (child.fatherFullName ?? '') +
          (child.fatherFullName && child.motherFullName ? ' / ' : '') +
          (child.motherFullName ?? '');
      } else if (child.userId && child.userId.name) {
        displayParentName = child.userId.name;
      } else if (child.name) {
        displayParentName = child.name;
      }
      familyGroups[motherPhoneNumber] = {
        _id: userId,
        shortId: extractShortId(child, 'children'),
        name: displayParentName,
        motherPhoneNumber: motherPhoneNumber,
        displayNames: '',
        familyChildren: [],
        role: child.userId.role || 'child',
        fromCollection: 'children',
        phone: child.userId.phone || child.mobile1 || '',
        userEmail: userEmail,
        fatherFullName: child.fatherFullName,
        motherFullName: child.motherFullName,
        motherOccupation: child.motherOccupation,
        address: child.address,
        areaName: child.areaName,
      };
    }
    familyGroups[motherPhoneNumber].familyChildren.push(child);
  }

  Object.values(familyGroups).forEach(family => {
    family.displayNames = family.familyChildren.map(p => {
      const name = p.name || '-';
      const pid = p.patientId || '-';
      return (
        `<a href="/super-admin/children?patientId=${encodeURIComponent(pid)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800">${name} (${pid})</a>`
      );
    }).join(', ');
  });
  Object.values(familyGroups).forEach(family => {
    family.shortId =
      family.familyChildren.map(p => p.patientId || '-').join(', ') ||
      family.familyChildren.map(p => p._id).join(', ') ||
      family._id;
  });

  return Object.values(familyGroups);
};

const extractUsersFromResponse = (data: any): FlattenedUser[] => {
  const users: FlattenedUser[] = [];

  if (!data) return users;

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
          therapistRaw: therapist,
        });
      }
    });
  }

  if (Array.isArray(data.patients)) {
    const families = groupChildrenByMotherPhone(data.patients);
    for (const family of families) {
      users.push({
        _id: family._id,
        shortId: family.shortId,
        name: family.name,
        email: family.userEmail || family.motherPhoneNumber,
        parentEmail: family.motherPhoneNumber,
        motherPhoneNumber: family.motherPhoneNumber,
        displayNames: family.displayNames,
        role: family.role,
        fromCollection: 'children',
        phone: family.phone,
        familyChildren: family.familyChildren,
        fatherFullName: family.fatherFullName,
        motherFullName: family.motherFullName,
        motherOccupation: family.motherOccupation,
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

const ROLE_OPTIONS = [
  { label: "All Users", value: "all", apiRole: "all" },
  { label: "Children", value: "children", apiRole: "children" },
  { label: "Therapists", value: "therapists", apiRole: "therapists" },
  { label: "Admins", value: "admin", apiRole: "admin" },
];

const roleTypeColor = (role: string) => 
  role === "admin" ? "bg-purple-50 text-purple-700"
  : role === "therapist" ? "bg-blue-50 text-blue-700"
  : "bg-yellow-50 text-yellow-700";

const typeColor = (type: string) => 
  type === "therapists" ? "bg-blue-50 text-blue-700"
  : type === "children" ? "bg-amber-50 text-yellow-700"
  : type === "admin" ? "bg-purple-50 text-purple-700"
  : "bg-slate-100 text-slate-600";

const TableHeadCell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th className="py-3 px-4 text-xs uppercase tracking-wide font-bold text-slate-500 bg-slate-100 border-b border-slate-200 whitespace-nowrap">
    {children}
  </th>
);

const TableCell: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <td className={"py-2.5 px-4 border-b border-slate-100 text-sm align-top " + className}>
    {children}
  </td>
);

type UserRowProps = {
  user: FlattenedUser;
  onLoginAsUser: (_user: FlattenedUser) => void;
  loggingInUserId?: string | null;
};

const ChildrenList: React.FC<{ familyChildren: any[] }> = ({ familyChildren }) => {
  if (!Array.isArray(familyChildren) || familyChildren.length === 0) return null;

  // Make latest (highest id) children appear at top, by numeric part of patientId
  const sortedChildren = [...familyChildren].sort((a, b) => {
    const nA = getSortableIdNum(a.patientId || '', 'children');
    const nB = getSortableIdNum(b.patientId || '', 'children');
    // Descending: latest on top
    return nB - nA;
  });

  const getMotherMobile = (child: any) => child.mobile1 || (child.userId && child.userId.mobile1) || "";
  const getFatherMobile = (child: any) => child.mobile2 || (child.userId && child.userId.mobile2) || "";

  return (
    <div className="space-y-1">
      <span className="block font-semibold text-blue-700 mb-1">Children</span>
      <div className="flex flex-wrap gap-2">
        {sortedChildren.map((child, idx) => (
          <span key={child.patientId || idx} className="flex flex-col gap-1 border border-blue-100 px-2 py-0.5 bg-blue-50 rounded-md shadow-sm">
            <div className="flex items-center gap-1">
              <a
                href={`/super-admin/children?patientId=${encodeURIComponent(child.patientId || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-bold text-blue-700 hover:text-blue-900"
                title="View child profile"
              >
                {child.name || <span className="italic text-slate-600">Unknown</span>}
              </a>
              {child.patientId && (
                <span className="font-mono text-base text-blue-900 ml-1 font-extrabold">
                  ({formatPatientId(child.patientId)})
                </span>
              )}
              {child.userId?.email && (
                <span className="ml-2 text-xs text-slate-700">{child.userId.email}</span>
              )}
              {/* Mother Occupation, if present */}
              {child.motherOccupation && (
                <span className="ml-2 text-xs text-slate-700 italic">
                  (Mother Occupation: {child.motherOccupation})
                </span>
              )}
            </div>
            <div className="flex gap-4 pl-5 text-xs text-slate-600">
              {getMotherMobile(child) && (
                <span>
                  <span className="font-semibold">Mother Mobile Number:</span>{" "}
                  <span className="font-mono">{getMotherMobile(child)}</span>
                </span>
              )}
              {getFatherMobile(child) && (
                <span>
                  <span className="font-semibold">Father Mobile Number:</span>{" "}
                  <span className="font-mono">{getFatherMobile(child)}</span>
                </span>
              )}
            </div>
          </span>
        ))}
      </div>
    </div>
  );
};

const UserRow = ({ user, onLoginAsUser, loggingInUserId }: UserRowProps) => {
  const isChildrenFamily = user.fromCollection === 'children';
  const renderTherapistName = (name: string, user: FlattenedUser) => {
    const therapistRaw = user.therapistRaw || {};
    const therapistObjId = therapistRaw._id || user._id || '';
    if (therapistObjId) {
      return (
        <a
          href={`/super-admin/therapists?therapist=${encodeURIComponent(therapistObjId)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-900 text-blue-700"
        >
          {name}
        </a>
      );
    }
    return name;
  };

  const renderTherapistShortId = (shortId: string, user: FlattenedUser) => {
    const therapistRaw = user.therapistRaw || {};
    const therapistObjId = therapistRaw._id || user._id || '';
    if (therapistObjId && shortId) {
      // Format therapistId as NPLnnn, bigger on top
      return (
        <a
          href={`/super-admin/therapists?therapist=${encodeURIComponent(therapistObjId)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-900 text-blue-700 text-lg font-bold"
        >
          {formatTherapistId(shortId)}
        </a>
      );
    }
    return <span className="text-lg font-bold">{formatTherapistId(shortId)}</span>;
  };

  const renderChildrenShortIds = (user: FlattenedUser) => {
    if (!user.shortId) return null;
    if (user.fromCollection !== "children") {
      // Not family - don't format, just show as is
      return <span className="text-lg font-bold">{user.shortId}</span>;
    }
    const familyChildren = Array.isArray(user.familyChildren) ? user.familyChildren : [];
    if (familyChildren.length === 0) {
      return <span className="text-lg font-bold">{user.shortId || user._id}</span>;
    }

    // Sort children by latest id on top
    const sorted = [...familyChildren].sort((a: any, b: any) =>
      getSortableIdNum(b.patientId || '', 'children') - getSortableIdNum(a.patientId || '', 'children')
    );

    return (
      <div className="flex flex-wrap gap-1">
        {sorted.map((child: any, idx: number) => {
          const pid = child.patientId || "-";
          return pid === "-" ? (
            <span key={pid + idx} className="bg-gray-200 text-gray-600 rounded px-2 py-0.5 text-lg font-bold font-mono">
              -
            </span>
          ) : (
            <a
              key={pid + idx}
              href={`/super-admin/children?patientId=${encodeURIComponent(pid)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-50 border border-blue-200 rounded px-2 py-0.5 text-lg font-bold text-blue-700 hover:text-blue-900 font-mono underline"
              title="View child profile"
            >
              {formatPatientId(pid)}
            </a>
          );
        })}
      </div>
    );
  };

  const getFamilyMotherMobile = (user: FlattenedUser) => {
    if (!user.familyChildren || !Array.isArray(user.familyChildren)) return null;
    for (const child of user.familyChildren) {
      if (child.mobile1) return child.mobile1;
      if (child.userId && child.userId.mobile1) return child.userId.mobile1;
    }
    return null;
  };
  const getFamilyFatherMobile = (user: FlattenedUser) => {
    if (!user.familyChildren || !Array.isArray(user.familyChildren)) return null;
    for (const child of user.familyChildren) {
      if (child.mobile2) return child.mobile2;
      if (child.userId && child.userId.mobile2) return child.userId.mobile2;
    }
    return null;
  };

  return (
    <tr className="group hover:bg-blue-50 transition">
      <TableCell className="font-mono text-blue-900 font-extrabold min-w-[100px] text-xl">
        <div className="flex items-center gap-2">
          <FiHash className="text-blue-400 text-lg" />
          {isChildrenFamily
            ? renderChildrenShortIds(user)
            : user.fromCollection === "therapists"
            ? renderTherapistShortId(user.shortId, user)
            : <span className="text-lg font-bold">{user.shortId || user._id}</span>}
        </div>
      </TableCell>
      <TableCell className="font-semibold text-slate-800 w-[240px] min-w-[180px]">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <FiUser className="text-blue-600" />
            {user.fromCollection === "therapists"
              ? renderTherapistName(user.name, user)
              : <span>{user.name}</span>}
          </div>
          {isChildrenFamily && Array.isArray(user.familyChildren) && user.familyChildren.length > 0 && (
            <div className="mt-1">
              <ChildrenList familyChildren={user.familyChildren} />
            </div>
          )}
          {isChildrenFamily && user.motherOccupation && (
            <div className="text-xs text-amber-700 italic">
              Mother Occupation: {user.motherOccupation}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <FiMail className="text-slate-500" />
            <span className="font-mono text-xs">{user.email}</span>
          </div>
          {user.fromCollection === "children" && user.motherPhoneNumber && (
            <div className="text-xs text-purple-700">
              Mother Phone: <span className="font-mono">{user.motherPhoneNumber}</span>
            </div>
          )}
          {user.fromCollection === "children" && (
            <div className="flex flex-col gap-1">
              {getFamilyMotherMobile(user) && (
                <div className="flex items-center gap-2">
                  <FiPhone className="text-green-600" />
                  <span className="font-medium text-xs">Mother Mobile Number:</span>
                  <span className="font-mono text-xs">{getFamilyMotherMobile(user)}</span>
                </div>
              )}
              {getFamilyFatherMobile(user) && (
                <div className="flex items-center gap-2">
                  <FiPhone className="text-green-600" />
                  <span className="font-medium text-xs">Father Mobile Number:</span>
                  <span className="font-mono text-xs">{getFamilyFatherMobile(user)}</span>
                </div>
              )}
              {!getFamilyMotherMobile(user) && !getFamilyFatherMobile(user) && (
                <div className="flex items-center gap-2">
                  <FiPhone className="text-green-600" />
                  <span className="font-mono text-xs">-</span>
                </div>
              )}
            </div>
          )}
          {user.fromCollection !== "children" && (
            <div className="flex items-center gap-2">
              <FiPhone className="text-green-600" />
              <span className="font-mono text-xs">{user.phone || '-'}</span>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className={
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border " + roleTypeColor(user.role)
          }
        >
          <FiTag /> {user.role}
        </span>
      </TableCell>
      <TableCell>
        <span
          className={
            "capitalize px-2 py-0.5 rounded text-xs font-bold border " +
            typeColor(user.fromCollection)
          }
        >
          {user.fromCollection}
        </span>
      </TableCell>
      <TableCell>
        <button
          className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold transition border border-blue-200 bg-blue-50 hover:bg-blue-200 hover:text-blue-900 text-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
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

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const AllUsers: React.FC = () => {
  const [users, setUsers] = useState<FlattenedUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<'all' | 'children' | 'therapists' | 'admin'>('all');
  const [loggingInUserId, setLoggingInUserId] = useState<string | null>(null);

  // Pagination & search states
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [total, setTotal] = useState<number>(0);
  const [serverTotalRaw, setServerTotalRaw] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const searchTimeout = useRef<any>(null);

  useEffect(() => {
    let controller = new AbortController();
    setLoading(true);
    setError(null);

    async function fetchUsers() {
      try {
        const params: any = {};
        params.role = activeRole === "children" ? "patients" : activeRole;
        if (activeRole === "children") {
          params.page = 1;
          params.limit = 10000;
        } else {
          params.page = page;
          params.limit = pageSize;
        }
        if (search) params.search = search;

        const res = await axios.get(`${API_BASE}/api/super-admin/users`, {
          params,
          signal: controller.signal,
        });

        const { data } = res;
        let extractedUsers: FlattenedUser[] = [];
        let totalUsers: number = 0;

        if (
          typeof data === 'object' &&
          (Array.isArray(data.therapists) ||
            Array.isArray(data.patients) ||
            Array.isArray(data.admins))
        ) {
          if (activeRole === "children" && Array.isArray(data.patients)) {
            // Sort families by latest (highest patientId in any family) on top
            let families = groupChildrenByMotherPhone(data.patients);
            families = families
              .slice()
              .sort((a, b) => {
                // Sort according to the largest patientId in the family
                const maxA = Math.max(
                  ...(a.familyChildren || []).map((c: any) => getSortableIdNum(c.patientId || '', 'children'))
                );
                const maxB = Math.max(
                  ...(b.familyChildren || []).map((c: any) => getSortableIdNum(c.patientId || '', 'children'))
                );
                return maxB - maxA;
              });
            totalUsers = families.length;
            setServerTotalRaw(families.length);
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            extractedUsers = families.slice(startIndex, endIndex).map(family => ({
              _id: family._id,
              shortId: family.shortId,
              name: family.name,
              email: family.userEmail || family.motherPhoneNumber,
              parentEmail: family.motherPhoneNumber,
              motherPhoneNumber: family.motherPhoneNumber,
              displayNames: family.displayNames,
              role: family.role,
              fromCollection: 'children',
              phone: family.phone,
              familyChildren: family.familyChildren,
              fatherFullName: family.fatherFullName,
              motherFullName: family.motherFullName,
              motherOccupation: family.motherOccupation,
              address: family.address,
              areaName: family.areaName,
            }));
          } else if (activeRole === "therapists" && Array.isArray(data.therapists)) {
            // Sort therapists by id desc (latest on top). Use therapistId if present
            let therapistUsers = extractUsersFromResponse(data).filter(u => u.fromCollection === "therapists");
            therapistUsers = therapistUsers.slice()
              .sort((a, b) =>
                getSortableIdNum(b.shortId, 'therapists') - getSortableIdNum(a.shortId, 'therapists')
              );
            extractedUsers = therapistUsers;
            totalUsers = typeof data.therapistsTotal === "number" ? data.therapistsTotal : therapistUsers.length;
            setServerTotalRaw(totalUsers);
          } else {
            // All or admin mode (all/unknown), show admins/unknowns as is, but therapists/children sorted
            let usersRaw = extractUsersFromResponse(data);

            // For each role, sort as required
            if (activeRole === "admin") {
              // no special sort needed, backend order or sort by name
            } else if (activeRole === "all") {
              // For role ALL: therapists and children on top by id descending, then others
              usersRaw = usersRaw.slice().sort((a, b) => {
                const isA = a.fromCollection, isB = b.fromCollection;
                if (isA === "therapists" && isB !== "therapists") return -1;
                if (isA === "children" && isB !== "children") return -1;
                if (isA !== "therapists" && isB === "therapists") return 1;
                if (isA !== "children" && isB === "children") return 1;
                // Same type? Sort by id
                if (isA === "therapists" && isB === "therapists") {
                  return getSortableIdNum(b.shortId, 'therapists') - getSortableIdNum(a.shortId, 'therapists');
                }
                if (isA === "children" && isB === "children") {
                  return getSortableIdNum(b.shortId, 'children') - getSortableIdNum(a.shortId, 'children');
                }
                return 0;
              });
            }
            extractedUsers = usersRaw;
            if (Array.isArray(data.therapists) && activeRole === "therapists") {
              totalUsers = typeof data.therapistsTotal === "number" ? data.therapistsTotal : data.therapists.length;
              setServerTotalRaw(totalUsers);
            } else if (Array.isArray(data.admins) && activeRole === "admin") {
              totalUsers = typeof data.adminsTotal === "number" ? data.adminsTotal : data.admins.length;
              setServerTotalRaw(totalUsers);
            } else if (activeRole === "all" && typeof data.total === "number") {
              totalUsers = data.total;
              setServerTotalRaw(totalUsers);
            } else {
              totalUsers = extractedUsers.length;
              setServerTotalRaw(totalUsers);
            }
          }
        } else if (Array.isArray(data.users)) {
          extractedUsers = data.users.map((u: any) => ({
            ...u,
            fromCollection: u.fromCollection || 'unknown',
            shortId: u.shortId || u._id,
          }));
          // Try to sort by bigger id on top if role matches
          if (activeRole === "therapists") {
            extractedUsers = extractedUsers.slice().sort(
              (a, b) => getSortableIdNum(b.shortId, 'therapists') - getSortableIdNum(a.shortId, 'therapists')
            );
          } else if (activeRole === "children") {
            extractedUsers = extractedUsers.slice().sort(
              (a, b) => getSortableIdNum(b.shortId, 'children') - getSortableIdNum(a.shortId, 'children')
            );
          }
          totalUsers = Array.isArray(data.users) ? data.users.length : 0;
          setServerTotalRaw(totalUsers);
        } else if (Array.isArray(data)) {
          extractedUsers = data.map(u => ({
            ...u,
            fromCollection: 'unknown',
            shortId: u._id,
          }));
          totalUsers = data.length;
          setServerTotalRaw(totalUsers);
        }
        setUsers(extractedUsers);
        setTotal(totalUsers);
      } catch (err: unknown) {
        let errMessage = 'Failed to fetch users';
        if (axios.isAxiosError(err)) {
          if (err.code === "ERR_CANCELED") {
            return;
          }
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
        setTotal(0);
        setServerTotalRaw(0);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
    return () => controller.abort();
    // eslint-disable-next-line
  }, [activeRole, page, pageSize, search]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
    // eslint-disable-next-line
  }, [searchInput]);

  const handleLoginAsUser = async (user: FlattenedUser) => {
    if (!user || !user._id) return;
    setLoggingInUserId(user._id);
    setError(null);
    try {
      const superAdminToken = localStorage.getItem('super-admin-token');
      const res = await axios.post(
        `${API_BASE}/api/super-admin/users/login-as-user`,
        { userId: user._id },
        {
          headers: { 
            "Content-Type": "application/json",
            ...(superAdminToken ? { "Authorization": `${superAdminToken}` } : {})
          },
        }
      );
      const { token, role, user: userData } = res.data;
      localStorage.setItem("isLogInViaSuperAdmin", "true");
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

  const currentTotal = activeRole === "children" ? serverTotalRaw : total;
  const totalPages = Math.max(1, Math.ceil(currentTotal / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(1);
    // eslint-disable-next-line
  }, [totalPages]);

  useEffect(() => {
    setPage(1);
  }, [activeRole, pageSize, search]);

  return (
    <div className={`w-full max-w-7xl mx-auto px-4 md:px-8 py-8 ${COLORS.bgCard} ${COLORS.shadow} ${COLORS.border} rounded-xl`}>
      {/* Header actions */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-2">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-blue-900 mb-2 md:mb-0">
          All Users
        </h1>
        <form
          onSubmit={e => {
            e.preventDefault();
            setSearch(searchInput.trim());
            setPage(1);
          }}
          className="flex items-center gap-2"
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400">
              <FiSearch />
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by name, email, phone, ID"
              className="pl-9 pr-3 py-2 text-sm w-60 rounded-md border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none transition"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          {search && (
            <button
              type="button"
              title="Clear search"
              className="ml-1 px-2 h-9 rounded bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setPage(1);
              }}
            >
              ×
            </button>
          )}
        </form>
      </div>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2 overflow-x-auto">
        {ROLE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => {
              setActiveRole(opt.apiRole as 'all' | 'children' | 'therapists' | 'admin');
              setPage(1);
            }}
            className={
              "px-4 py-2 text-sm font-bold rounded-t-lg border-b-2 transition-all " +
              (activeRole === opt.apiRole
                ? "text-blue-800 bg-slate-100 border-blue-700 border-b-4"
                : "text-slate-500 border-transparent hover:text-blue-700 hover:bg-slate-50")
            }
            style={{
              minWidth: 120,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {/* Table */}
      <div className={`overflow-x-auto ${COLORS.bgTable} rounded-xl border border-slate-200`}>
        <table className="w-full min-w-[820px]">
          <thead>
            <tr>
              <TableHeadCell>User ID</TableHeadCell>
              <TableHeadCell>
                {activeRole === 'children'
                  ? 'Parent / Family Name'
                  : 'Name'}
              </TableHeadCell>
              <TableHeadCell>
                {activeRole === 'children'
                  ? (
                      <>
                        Parent/Child Email
                        <br/>
                        Mother Phone & Father Mobile Number
                      </>
                    )
                  : 'Email & Phone'}
              </TableHeadCell>
              <TableHeadCell>Role</TableHeadCell>
              <TableHeadCell>Type</TableHeadCell>
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
                <td colSpan={6} className="py-10 text-center text-blue-500 font-medium bg-slate-50">
                  <span className="inline-flex gap-2 items-center animate-pulse">
                    <FiUser className="animate-spin text-blue-400" />
                    Loading users...
                  </span>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="py-10 text-center font-bold text-rose-700 bg-rose-50 rounded">{error}</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500 bg-slate-50 font-semibold">
                  No {activeRole === "all"
                    ? "users"
                    : activeRole === "children"
                    ? "families"
                    : activeRole === "therapists"
                    ? "therapists"
                    : "admins"} found.
                </td>
              </tr>
            ) : (
              users.map(user => (
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
      {/* Pagination */}
      {activeRole !== "all" && (
        <div className="flex flex-col md:flex-row items-center justify-between py-6 gap-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <label htmlFor="pageSize-select" className="font-semibold">Rows per page:</label>
            <select
              id="pageSize-select"
              className="py-1 px-2 rounded border border-slate-300 focus:border-blue-400 transition"
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {PAGE_SIZE_OPTIONS.map(sz => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <button
              className="px-2 py-1 rounded border border-slate-300 bg-white hover:bg-blue-50 transition disabled:opacity-50"
              title="Previous Page"
              disabled={page === 1 || loading}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              aria-label="Previous Page"
            >
              <FiChevronLeft />
            </button>
            <span className="px-2 select-none">
              Page{" "}
              <input
                type="number"
                min={1}
                max={totalPages}
                value={page}
                onChange={e => {
                  let val = Number(e.target.value);
                  if (Number.isNaN(val) || val < 1) val = 1;
                  if (val > totalPages) val = totalPages;
                  setPage(val);
                }}
                className="w-14 text-center border border-gray-300 rounded-lg mx-1 py-0.5 px-1 text-sm"
                style={{ width: 48 }}
                disabled={loading || totalPages <= 1}
              />{" "}
              of <span className="font-semibold">{totalPages}</span>
            </span>
            <button
              className="px-2 py-1 rounded border border-slate-300 bg-white hover:bg-blue-50 transition disabled:opacity-50"
              title="Next Page"
              disabled={page === totalPages || loading || totalPages <= 1}
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              aria-label="Next Page"
            >
              <FiChevronRight />
            </button>
            <span className="pl-3 font-medium">
              {currentTotal > 0 && (
                <>
                  {(page - 1) * pageSize + 1}-{Math.min(currentTotal, page * pageSize)} of {currentTotal} {activeRole === "children" ? "families" : "users"}
                </>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllUsers;