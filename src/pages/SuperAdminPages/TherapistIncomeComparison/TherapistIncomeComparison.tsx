import  { useEffect, useState } from "react";

type Therapist = {
  _id: string;
  therapistId: string;
  userId: string;
  name?: string;
  experienceYears: number;
};

type Patient = {
  _id: string;
  name: string;
  patientId: string;
};

type Package = {
  _id: string;
  name: string;
  costPerSession: number;
  totalCost: number;
  sessionCount: number;
};

type Session = {
  date: string;
  slotId: string;
  isCheckedIn: boolean;
  price: number;
  bookingId: string;
  package?: Package;
  patient?: Patient;
};

type Earning = {
  amount: number;
  type: string;
  fromDate: string;
  toDate: string;
  remark: string;
  paidOn: string;
  _id: string;
};

type EarningEntry = {
  earning: Earning;
  sessions: Session[];
  sessionDeliveredSumCost: number;
  earningAmount: number;
  difference: number;
};

type TherapistComparison = {
  therapist: Therapist;
  earnings: EarningEntry[];
  totalSessionDeliveredSumCost: number;
  totalEarningAmount: number;
  totalDifference: number;
};

const TABLE_ROW_BG_DEFAULT = "#fff";
const TABLE_ROW_BG_ALERT = "#fde8e8";
const MONEY = (amt: number) => amt.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const TherapistIncomeComparison = () => {
  const [data, setData] = useState<TherapistComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("super-admin-token");
        if (!token) {
          throw new Error("No superadmin token found in localStorage.");
        }
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/super-admin/finance/therapist/salary-session-comparison`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
          }
        );
        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw new Error(
            `API error: ${res.status}${
              errorData && errorData.message ? " - " + errorData.message : ""
            }`
          );
        }
        const resp = await res.json();
        setData(resp);
      } catch (err: any) {
        setError(err?.message ?? String(err));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Therapist Income Comparison</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}
      {!loading && !error && (
        <div>
          {data.length === 0 && <div>No data found.</div>}
          {data.map((therapistObj) => {
            const { therapist, earnings, totalSessionDeliveredSumCost, totalEarningAmount } = therapistObj;
            const seventyPct = totalSessionDeliveredSumCost * 0.7;
            const isViolation = totalEarningAmount > seventyPct;

            return (
              <div
                key={therapist._id}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: 8,
                  marginBottom: 32,
                  boxShadow: isViolation ? "0 0 10px #bd1c1c55" : "0 0 5px #9992",
                  background: isViolation ? TABLE_ROW_BG_ALERT : TABLE_ROW_BG_DEFAULT,
                  padding: 16,
                }}
              >
                <h3>
                  Therapist: {therapist.name ?? therapist.therapistId} <br />
                  <small>
                    (ID: {therapist.therapistId}) &nbsp;|&nbsp; Experience: {therapist.experienceYears ?? "-"} years
                  </small>
                </h3>
                <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                  Total Earnings: {MONEY(totalEarningAmount)} &nbsp;|&nbsp; 70% of Session Sum: {MONEY(seventyPct)}
                  <span style={{
                    color: isViolation ? "#c00" : "green",
                    fontWeight: "bold",
                    marginLeft: 8
                  }}>
                    {isViolation
                      ? "❌ Salary exceeds 70% of session sum"
                      : "✅ Salary within 70% of session sum"}
                  </span>
                </div>
                <div>
                  <table style={{ borderCollapse: "collapse", width: "100%", marginTop: 12, marginBottom: 10 }}>
                    <thead>
                      <tr style={{ background: "#f8f8fa" }}>
                        <th style={{ border: "1px solid #ccc", padding: 5 }}>Type</th>
                        <th style={{ border: "1px solid #ccc", padding: 5 }}>Period</th>
                        <th style={{ border: "1px solid #ccc", padding: 5 }}>Remark</th>
                        <th style={{ border: "1px solid #ccc", padding: 5 }}>Paid On</th>
                        <th style={{ border: "1px solid #ccc", padding: 5 }}>Earning ₹</th>
                        <th style={{ border: "1px solid #ccc", padding: 5 }}>Session Sum ₹</th>
                        <th style={{ border: "1px solid #ccc", padding: 5 }}>Difference ₹</th>
                        <th style={{ border: "1px solid #ccc", padding: 5, width: 100 }}>Sessions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {earnings.map((e) => {
                        const {
                          earning,
                          sessionDeliveredSumCost,
                          earningAmount,
                          difference,
                          sessions,
                        } = e;
                        const isEntryViolation =
                          earning.type === "salary" &&
                          earningAmount > sessionDeliveredSumCost * 0.7;
                        const earningBg = isEntryViolation ? "#ffe0e0" : undefined;

                        return (
                          <tr
                            key={earning._id}
                            style={{ background: earningBg }}
                          >
                            <td style={{ border: "1px solid #ccc", padding: 4, textTransform: "capitalize" }}>
                              {earning.type}
                              {isEntryViolation && (
                                <span style={{ color: "#bd1c1c", fontWeight: 800 }}> &#9888;</span>
                              )}
                            </td>
                            <td style={{ border: "1px solid #ccc", padding: 4 }}>
                              {new Date(earning.fromDate).toLocaleDateString()} &ndash;{" "}
                              {new Date(earning.toDate).toLocaleDateString()}
                            </td>
                            <td style={{ border: "1px solid #ccc", padding: 4 }}>{earning.remark}</td>
                            <td style={{ border: "1px solid #ccc", padding: 4 }}>{new Date(earning.paidOn).toLocaleDateString()}</td>
                            <td style={{ border: "1px solid #ccc", padding: 4 }}>{MONEY(earningAmount)}</td>
                            <td style={{ border: "1px solid #ccc", padding: 4 }}>{MONEY(sessionDeliveredSumCost)}</td>
                            <td style={{ border: "1px solid #ccc", padding: 4 }}>
                              <span style={{
                                color: difference >= 0 ? "#333" : "#c00",
                                fontWeight: difference >= 0 ? "bold" : undefined,
                              }}>
                                {MONEY(difference)}
                              </span>
                            </td>
                            <td style={{ border: "1px solid #ccc", padding: 4 }}>
                              {sessions.length === 0 ? (
                                <span style={{ color: "#666" }}>No Sessions</span>
                              ) : (
                                <details>
                                  <summary style={{ cursor: "pointer" }}>{sessions.length} session(s)</summary>
                                  <div style={{
                                    maxHeight: 200,
                                    overflowY: "auto",
                                    borderTop: "1px solid #eee",
                                    marginTop: 2,
                                    fontSize: 13
                                  }}>
                                    <table style={{ width: "100%" }}>
                                      <thead>
                                        <tr style={{ background: "#fafafc" }}>
                                          <th>Date</th>
                                          <th>Slot</th>
                                          <th>Patient</th>
                                          <th>Package</th>
                                          <th>₹/Session</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {sessions.map((ses, sid) => (
                                          <tr key={sid}>
                                            <td>{ses.date}</td>
                                            <td>{ses.slotId}</td>
                                            <td>
                                              {ses.patient ? (
                                                <>
                                                  {ses.patient.name} <small>({ses.patient.patientId})</small>
                                                </>
                                              ) : (
                                                "-"
                                              )}
                                            </td>
                                            <td>
                                              {ses.package ? (
                                                <>
                                                  {ses.package.name}
                                                </>
                                              ) : (
                                                "-"
                                              )}
                                            </td>
                                            <td>{MONEY(ses.price)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </details>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {isViolation && (
                  <div style={{
                    color: "#c00",
                    background: "#ffeaea",
                    padding: "6px 12px",
                    borderRadius: 5,
                    fontWeight: 500,
                    marginBottom: 8,
                  }}>
                    <b>Notice:</b> This therapist's total earnings <span style={{ textDecoration: "underline" }}>{MONEY(totalEarningAmount)}</span> <br />
                    exceed 70% of the session delivered sum ({MONEY(seventyPct)}).
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TherapistIncomeComparison;