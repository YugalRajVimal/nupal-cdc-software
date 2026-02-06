import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface AuditLog {
  _id: string;
  action: string;
  user: string | { _id: string, name?: string, email?: string };
  role: string;
  resource?: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  updatedAt: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const roleBadgeClasses = (role: string) => {
  switch (role) {
    case 'superadmin':
      return 'bg-yellow-100 text-yellow-800';
    case 'admin':
      return 'bg-cyan-100 text-cyan-800';
    case 'therapist':
      return 'bg-green-100 text-green-800';
    case 'patient':
      return 'bg-pink-100 text-pink-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const renderObject = (obj: any, level = 0) =>
  Object.entries(obj).map(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return (
        <div key={key} className={`ml-${(level + 1) * 3}`}>
          <span className="font-medium">{key}:</span>
          <div>{renderObject(value, level + 1)}</div>
        </div>
      );
    } else if (Array.isArray(value)) {
      return (
        <div key={key} className={`ml-${(level + 1) * 3}`}>
          <span className="font-medium">{key}:</span> [
          {value.map((v, i) => (
            <span key={i}>
              {typeof v === 'object' ? JSON.stringify(v, null, 1) : String(v)}
              {i < value.length - 1 ? ', ' : ''}
            </span>
          ))}]
        </div>
      );
    } else {
      return (
        <div key={key} className={`ml-${(level + 1) * 3}`}>
          <span className="font-medium">{key}:</span> {String(value)}
        </div>
      );
    }
  });

const renderDetailsModalBody = (details: any) => {
  if (!details || typeof details !== 'object') {
    return <span>{String(details)}</span>;
  }
  return (
    <div className="bg-lime-50 rounded px-3 py-2 text-sm mt-2 max-h-[500px] overflow-y-auto">
      {renderObject(details)}
    </div>
  );
};

// const formatUser = (user: string | { _id: string, name?: string, email?: string }) => {
//   if (!user) return '-';
//   if (typeof user === 'string') {
//     return <span title={user}>{user.slice(0, 8) + (user.length > 8 ? '...' : '')}</span>;
//   }
//   return (
//     <span title={user._id}>
//       {(user.name || user.email) && (
//         <span className="font-medium">
//           {user.name ? user.name : (user.email ? user.email : user._id)}
//         </span>
//       )}
//       {(user.name || user.email) ? (
//         <span className="text-gray-400 text-xs ml-1">
//           ({user._id.slice(0, 6)}...)
//         </span>
//       ) : user._id}
//     </span>
//   );
// };

// const formatUserAgent = (ua: string | null | undefined) =>
//   ua
//     ? <span title={ua}>{ua.length > 32 ? ua.slice(0, 28) + '…' : ua}</span>
//     : '-';

const formatResourceId = (id: string | undefined) =>
  id ?
    <span className="text-indigo-700 font-mono break-all text-xs" title={id}>
      {id.slice(0, 9) + (id.length > 9 ? '...' : '')}
    </span>
    : '-';

// const formatIP = (ip: string | null | undefined) =>
//   ip ?
//     <span className="text-emerald-800 font-mono bg-emerald-100 rounded px-2 py-[2px] text-xs">{ip}</span>
//     : '-';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const DetailsModal: React.FC<{
  show: boolean;
  onClose: () => void;
  log?: AuditLog | null;
}> = ({ show, onClose, log }) => {
  if (!show || !log) return null;
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/30 z-[1011]"
      tabIndex={-1}
    >
      <div className="bg-white rounded-xl shadow-2xl px-7 py-6 min-w-[388px] max-w-[93vw] max-h-[75vh] overflow-y-auto relative z-[1013]">
        <button
          aria-label="Close"
          className="absolute top-3 right-4 text-2xl text-blue-900 font-bold z-[1020] hover:text-blue-700"
          onClick={onClose}
          title="Close"
        >&times;</button>
        <h3 className="font-bold text-lg text-blue-900 mb-2">
          Details for Action:{' '}
          <span className="text-green-800">{capitalize(log.action.replace(/_/g, ' '))}</span>
        </h3>
        <div className="mb-3 text-gray-500 text-sm">
          Logged at:{' '}
          <span className="inline-block bg-blue-50 text-slate-700 text-xs rounded px-2 py-1 ml-1">
            {new Date(log.createdAt).toLocaleString()}
          </span>
        </div>
        {renderDetailsModalBody(log.details)}
      </div>
    </div>
  );
};

const AllLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<{ show: boolean, log: AuditLog | null }>({
    show: false,
    log: null,
  });

  React.useEffect(() => {
    if (!modal.show) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModal({ show: false, log: null });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modal.show]);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_URL}/api/super-admin/logs`);
        if (response.data && response.data.success) {
          setLogs(response.data.logs);
        } else {
          setError('Failed to fetch logs.');
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Error fetching logs.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="bg-white rounded-xl p-8 shadow-lg  mx-auto mt-9 mb-9">
      <h2 className="font-extrabold text-3xl mb-3 text-blue-900 tracking-tight">
        <span role="img" aria-label="logs" className="text-2xl mr-3">🗒️</span>
        Audit Logs
      </h2>
      <div className={`text-gray-500 text-lg mb-${loading || error ? 3 : 6} ml-1 tracking-tight`}>
        Review all account, admin, and system activities. Click <b>Show Details</b> to see more info about any log.
      </div>
      <DetailsModal
        show={modal.show}
        onClose={() => setModal({ show: false, log: null })}
        log={modal.log}
      />

      {loading ? (
        <div className="flex items-center gap-3 py-4 text-blue-700 font-medium text-lg">
          <span className="inline-block w-5 h-5 mr-2 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          Loading audit logs...
        </div>
      ) : error ? (
        <div className="text-red-700 bg-red-50 border border-red-200 px-5 py-2 rounded-lg mt-5 mb-4 font-medium">
          Error: {error}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-4 py-5 mt-4 font-medium">
          No audit logs found yet.
        </div>
      ) : (
        <div className="overflow-x-auto mt-6 rounded-lg shadow-sm bg-slate-50">
          <table className="w-full border-separate border-spacing-0 text-[15px] min-w-[850px]">
            <thead>
              <tr>
                <th className="bg-blue-50 px-3 py-2 border-b-2 border-blue-100 font-semibold text-center">Action</th>
                <th className="bg-blue-50 px-3 py-2 border-b-2 border-blue-100 font-semibold text-center">User</th>
                <th className="bg-blue-50 px-3 py-2 border-b-2 border-blue-100 font-semibold text-center">Role</th>
                <th className="bg-blue-50 px-3 py-2 border-b-2 border-blue-100 font-semibold text-center">Resource</th>
                <th className="bg-blue-50 px-3 py-2 border-b-2 border-blue-100 font-semibold text-center">Resource ID</th>
                {/* <th className="bg-blue-50 px-3 py-2 border-b-2 border-blue-100 font-semibold text-center">IP Address</th>
                <th className="bg-blue-50 px-3 py-2 border-b-2 border-blue-100 font-semibold text-center">User Agent</th> */}
                <th className="bg-blue-50 px-3 py-2 border-b-2 border-blue-100 font-semibold text-center">Timestamp</th>
                {/* <th className="bg-blue-50 px-3 py-2 border-b-2 border-blue-100 font-semibold text-center">Details</th> */}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={log._id} className={idx % 2 === 1 ? 'bg-slate-50' : ''}>
                  <td className="py-3 px-3 text-center border-b border-slate-200 font-semibold text-blue-700 text-[15px]">
                    {capitalize(log.action.replace(/_/g, ' '))}
                  </td>
                  <td className="py-3 px-3 text-center border-b border-slate-200  ">
                    {(() => {
                      const userVal = log.user;
                      if (typeof userVal === "string") {
                        // multiple users as comma separated string
                        if (userVal.includes(",")) {
                          return userVal.split(",").map((part, i, arr) => (
                            <React.Fragment key={i}>
                              {part.trim()}
                              {i < arr.length - 1 && <br />}
                            </React.Fragment>
                          ));
                        }
                        return userVal;
                      }
                      // if it's an object with optional name/email
                      if (
                        userVal &&
                        typeof userVal === "object" &&
                        "_id" in userVal
                      ) {
                        return (
                          <span>
                            {userVal.name
                              ? userVal.name
                              : userVal.email
                                ? userVal.email
                                : userVal._id}
                          </span>
                        );
                      }
                      // fallback for anything else
                      return "-";
                    })()}
                  </td>
                  <td className="py-3 px-3 text-center border-b border-slate-200 max-w-[250px] align-top">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${roleBadgeClasses(log.role)}`}>
                      {capitalize(log.role)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center border-b border-slate-200 max-w-[250px] align-top">
                    {log.resource ? (
                      <span className="font-medium">{capitalize(log.resource.replace(/_/g, ' '))}</span>
                    ) : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="py-3 px-3 text-center border-b border-slate-200 max-w-[250px] align-top">
                    {(() => {
                      const resourceIdVal = log.resourceId;
                      if (typeof resourceIdVal === "string") {
                        if (resourceIdVal.includes(",")) {
                          return resourceIdVal.split(",").map((part, i, arr) => (
                            <React.Fragment key={i}>
                              {formatResourceId(part.trim())}
                              {i < arr.length - 1 && <br />}
                            </React.Fragment>
                          ));
                        }
                        return formatResourceId(resourceIdVal);
                      }
                      return formatResourceId(resourceIdVal);
                    })()}
                  </td>
                  {/* <td className="py-3 px-3 text-center border-b border-slate-200">{formatIP(log.ipAddress)}</td>
                  <td className="py-3 px-3 text-center border-b border-slate-200">{formatUserAgent(log.userAgent)}</td> */}
                  <td className="py-3 px-3 text-center border-b border-slate-200">
                    <span className="text-xs text-slate-800 bg-blue-50 px-2 py-1 rounded">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </td>
                  {/* <td className="py-3 px-3 text-left border-b border-slate-200 max-w-[240px] word-break break-words">
                    <button
                      className="text-green-700 text-xs font-medium underline hover:text-green-800"
                      onClick={() => setModal({ show: true, log })}
                      type="button"
                    >
                      Show Details
                    </button>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllLogs;