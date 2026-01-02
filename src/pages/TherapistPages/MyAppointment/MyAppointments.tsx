import { useEffect, useState } from "react";
import { Table, Spin, Typography, Alert, Tag } from "antd";
import PageMeta from "../../../components/common/PageMeta";

const { Title } = Typography;

interface ISession {
  date: string;
  status?: string;
}

interface IAppointment {
  _id: string;
  patientName: string;
  parentName?: string;
  sessions: ISession[];
  paymentStatus?: string;
  therapistAmount?: number;
  // Add more fields as per your backend
}

export default function TherapistMyAppointments() {
  const [appointments, setAppointments] = useState<IAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError(null);
      try {
        const token =
          localStorage.getItem("therapist-token") ||
          localStorage.getItem("token") ||
          "";
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || ""}/api/therapist/appointments`,
          {
            headers: token ? { Authorization: token } : {},
          }
        );
        if (!res.ok) {
          let errMsg = "Failed to fetch appointments.";
          try {
            const errData = await res.json();
            if (errData?.message) errMsg = errData.message;
          } catch {}
          throw new Error(errMsg);
        }
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setAppointments(data.data);
        } else {
          throw new Error(data.message || "No appointment data returned.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch appointments.");
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  // Column definition for the Ant Design Table
  const columns = [
    {
      title: "Patient",
      dataIndex: "patientName",
      key: "patientName",
      render: (text: string) => <b>{text}</b>,
    },
    {
      title: "Parent",
      dataIndex: "parentName",
      key: "parentName",
      render: (text: string) => text || "-",
    },
    {
      title: "Sessions",
      dataIndex: "sessions",
      key: "sessions",
      render: (sessions: ISession[]) =>
        Array.isArray(sessions)
          ? (
            <span>
              {sessions.length}{" "}
              <span style={{ color: "#aaa", fontSize: 12 }}>
                {sessions
                  .map(
                    (s) =>
                      `${s.date ? new Date(s.date).toLocaleDateString() : ""}${
                        s.status ? ` [${s.status}]` : ""
                      }`
                  )
                  .join(", ")}
              </span>
            </span>
          )
          : "-",
    },
    {
      title: "Payment Status",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (status: string) =>
        status === "Paid" ? (
          <Tag color="green">Paid</Tag>
        ) : status ? (
          <Tag color="orange">{status}</Tag>
        ) : (
          <Tag color="red">Unpaid</Tag>
        ),
    },
    {
      title: "Therapist Amount",
      dataIndex: "therapistAmount",
      key: "therapistAmount",
      render: (amt: number) =>
        typeof amt === "number" ? `₹${amt.toFixed(2)}` : "-",
    },
  ];

  return (
    <>
      <PageMeta
        title="My Appointments"
        description="View all appointments for the therapist"
      />
      <div className="max-w-4xl mx-auto mt-8">
        <Title level={2} style={{ marginBottom: 24 }}>
          My Appointments
        </Title>
        {loading ? (
          <Spin spinning>
            <div style={{ minHeight: 180 }}></div>
          </Spin>
        ) : error ? (
          <Alert type="error" message={error} />
        ) : (
          <Table
            columns={columns}
            dataSource={appointments.map((a) => ({ ...a, key: a._id }))}
            pagination={{ pageSize: 10 }}
          />
        )}
      </div>
    </>
  );
}
