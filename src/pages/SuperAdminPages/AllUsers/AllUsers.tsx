import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL;

type FlattenedUser = {
  _id: string; // always actual Mongo _id
  shortId: string; // patientId, therapistId or subAdminId as appropriate, or fallback to _id
  name: string;
  email: string;
  role: string;
  fromCollection: 'therapists' | 'patients' | 'subAdmins' | 'unknown';
  phone?: string;
  [key: string]: any;
};

const extractShortId = (user: any, type: string): string => {
  if (type === 'therapists' && user.therapistId) return user.therapistId;
  if (type === 'patients' && user.patientId) return user.patientId;
  if (type === 'subAdmins' && (user.subAdminId || user.adminId)) return user.subAdminId || user.adminId;
  // fallback: try in userId
  if (user.userId && type !== 'subAdmins') {
    if (type === 'therapists' && user.userId.therapistId) return user.userId.therapistId;
    if (type === 'patients' && user.userId.patientId) return user.userId.patientId;
    if (type === 'subAdmins' && (user.userId.subAdminId || user.userId.adminId)) return user.userId.subAdminId || user.userId.adminId;
  }
  return user._id || '';
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
        });
      }
    });
  }
  if (Array.isArray(data.patients)) {
    data.patients.forEach((patient: any) => {
      if (patient.userId) {
        users.push({
          _id: patient.userId._id || patient._id,
          shortId: extractShortId(patient, 'patients'),
          name: patient.userId.name || patient.name || 'N/A',
          email: patient.userId.email || patient.parentEmail || 'N/A',
          role: patient.userId.role || 'patient',
          fromCollection: 'patients',
          phone: patient.userId.phone || patient.mobile1 || '',
        });
      }
    });
  }
  if (Array.isArray(data.subAdmins)) {
    data.subAdmins.forEach((subAdmin: any) => {
      users.push({
        _id: subAdmin._id,
        shortId: extractShortId(subAdmin, 'subAdmins'),
        name: subAdmin.name || 'N/A',
        email: subAdmin.email || 'N/A',
        role: subAdmin.role || 'subAdmin',
        fromCollection: 'subAdmins',
        phone: subAdmin.phone || '',
      });
    });
  }
  return users;
};

const ROLE_OPTIONS = [
  { label: "All Patients", value: "patients" },
  { label: "All Therapist", value: "therapists" },
  { label: "All SubAdmin", value: "subAdmins" },
];

const AllUsers: React.FC = () => {
  const [users, setUsers] = useState<FlattenedUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<'patients' | 'therapists' | 'subAdmins'>('patients');

  // New: always refresh list on activeRole change
  useEffect(() => {
    let didCancel = false;

    const fetchAllUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE}/api/super-admin/users`);
        const { data } = res;
        let extractedUsers: FlattenedUser[] = [];
        if (
          typeof data === 'object' &&
          (Array.isArray(data.therapists) ||
            Array.isArray(data.patients) ||
            Array.isArray(data.subAdmins))
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
        if (!didCancel) {
          setUsers(extractedUsers);
        }
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
        if (!didCancel) {
          setError(errMessage);
          setUsers([]);
        }
      } finally {
        if (!didCancel) {
          setLoading(false);
        }
      }
    };

    fetchAllUsers();

    return () => { didCancel = true; };
  }, [activeRole]); // refetch when activeRole changes

  // Filter users according to the selected role
  const filteredUsers = users.filter(user => user.fromCollection === activeRole);

  return (
    <div className="p-4 w-full">
      <h1 className="text-2xl font-semibold mb-4">All Users</h1>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {ROLE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setActiveRole(opt.value as 'patients' | 'therapists' | 'subAdmins')}
            className={
              "px-4 py-2 rounded border font-semibold "
              + (activeRole === opt.value
                  ? "bg-blue-600 text-white border-blue-700"
                  : "bg-white text-blue-700 border-gray-300 hover:bg-blue-50")
            }
          >
            {opt.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div>Loading users...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : filteredUsers.length === 0 ? (
        <div>No {activeRole === 'patients'
          ? 'patients'
          : activeRole === 'therapists'
          ? 'therapists'
          : 'sub admins'
        } found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">User&nbsp;ID</th>
                <th className="py-2 px-4 border-b text-left">Name</th>
                <th className="py-2 px-4 border-b text-left">Email</th>
                <th className="py-2 px-4 border-b text-left">Role</th>
                <th className="py-2 px-4 border-b text-left">Type</th>
                <th className="py-2 px-4 border-b text-left">Phone</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={`${user._id}-${user.fromCollection}`}>
                  <td className="py-2 px-4 border-b">{user.shortId || user._id}</td>
                  <td className="py-2 px-4 border-b">{user.name}</td>
                  <td className="py-2 px-4 border-b">{user.email}</td>
                  <td className="py-2 px-4 border-b capitalize">{user.role}</td>
                  <td className="py-2 px-4 border-b capitalize">{user.fromCollection}</td>
                  <td className="py-2 px-4 border-b">{user.phone || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllUsers;