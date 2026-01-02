import { useEffect, useState } from "react";
import { Card, Spin, Typography, Row, Col, Statistic, Alert } from "antd";
import PageMeta from "../../../components/common/PageMeta";

const { Title } = Typography;

export default function TherapistDashboardHome() {
  const [dashboardData, setDashboardData] = useState<{
    totalAppointments: number;
    upcomingAppointments: number;
    completedAppointments: number;
    totalEarnings: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use therapist token if present, else fallback to common token or none
        const token =
          localStorage.getItem("therapist-token") ||
          localStorage.getItem("token") ||
          "";
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || ""}/api/therapist/dashboard`,
          {
            headers: token ? { Authorization: token } : {},
          }
        );
        if (!res.ok) {
          let errMsg = "Failed to fetch dashboard details.";
          try {
            const errData = await res.json();
            if (errData?.message) errMsg = errData.message;
          } catch {}
          throw new Error(errMsg);
        }
        const data = await res.json();
        if (data.success && data.data) {
          setDashboardData({
            totalAppointments: data.data.totalAppointments || 0,
            completedAppointments: data.data.completedAppointments || 0,
            upcomingAppointments: data.data.upcomingAppointments || 0,
            totalEarnings: data.data.totalEarnings || 0,
          });
        } else {
          throw new Error(data.message || "No dashboard data returned.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch dashboard details.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardDetails();
  }, []);

  return (
    <>
      <PageMeta
        title="Nupal CDC"
        description="Therapist Panel for Nupal CDC"
      />
      <div className="max-w-4xl mx-auto mt-8">
        <Title level={2} style={{ marginBottom: 24 }}>Therapist Dashboard</Title>
        {loading ? (
          <Spin spinning>
            <div style={{ minHeight: 180 }}></div>
          </Spin>
        ) : error ? (
          <Alert
            type="error"
            showIcon
            message="Error"
            description={error}
            style={{ marginBottom: 24 }}
          />
        ) : (
          dashboardData && (
            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
              <Col xs={24} sm={12} md={12}>
                <Card>
                  <Statistic
                    title="Total Appointments"
                    value={dashboardData.totalAppointments}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={12}>
                <Card>
                  <Statistic
                    title="Upcoming Appointments"
                    value={dashboardData.upcomingAppointments}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={12}>
                <Card>
                  <Statistic
                    title="Completed Appointments"
                    value={dashboardData.completedAppointments}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={12}>
                <Card>
                  <Statistic
                    title="Total Earnings"
                    prefix="₹"
                    value={dashboardData.totalEarnings}
                    precision={2}
                  />
                </Card>
              </Col>
            </Row>
          )
        )}
      </div>
    </>
  );
}
