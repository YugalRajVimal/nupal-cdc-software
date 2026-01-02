import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Card, Spin, Typography, message, Tag, Collapse } from 'antd';
import dayjs from 'dayjs';
const { Title, Text } = Typography;
const { Panel } = Collapse;

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Used only for typing convenience/safety in this file:
interface SessionType {
  date: string; // ISO String
  time?: string;
  status?: string;
  notes?: string;
}

interface AppointmentType {
  _id: string;
  appointmentId: string;
  discountInfo?: any;
  package?: {
    _id: string;
    name: string;
    sessionCount: number;
    costPerSession: number;
    totalCost: number;
  };
  patient?: {
    _id: string;
    userId: string;
    patientId: string;
    gender: string;
    childDOB: string;
    name: string;
    [key: string]: any;
  };
  sessions: SessionType[];
  therapy?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

const MyChildrenAppointmentsPage: React.FC = () => {
  const [fullData, setFullData] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API_BASE_URL}/api/parent/appointments`)
      .then((res) => {
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          setFullData(res.data.data);
        } else {
          setFullData([]);
          message.error('Failed to fetch appointments data.');
        }
      })
      .catch(() => {
        message.error('Error fetching appointments.');
      })
      .finally(() => setLoading(false));
  }, []);

  const appointmentColumns = [
    {
      title: 'Appointment ID',
      dataIndex: 'appointmentId',
      key: 'appointmentId',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => (d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: 'Updated At',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (d: string) => (d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-'),
    }
  ];

  const patientColumns = [
    {
      title: 'Child Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Patient ID',
      dataIndex: 'patientId',
      key: 'patientId',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
    },
    {
      title: "Date of Birth",
      dataIndex: "childDOB",
      key: "childDOB"
    }
  ];

  const packageColumns = [
    {
      title: 'Package',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Sessions',
      dataIndex: 'sessionCount',
      key: 'sessionCount',
    },
    {
      title: 'Cost/Session',
      dataIndex: 'costPerSession',
      key: 'costPerSession',
    },
    {
      title: 'Total Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
    }
  ];

  const sessionColumns = [
    {
      title: 'Session Date',
      dataIndex: 'date',
      key: 'date',
      render: (d: string) => (d ? dayjs(d).format('YYYY-MM-DD') : 'N/A'),
    },
    {
      title: 'Session Time',
      dataIndex: 'time',
      key: 'time',
      render: (t: string, rec: SessionType) =>
        t || (rec.date ? dayjs(rec.date).format('HH:mm') : '--'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'processing';
        if (status === 'Completed') color = 'green';
        else if (status === 'Cancelled') color = 'red';
        else if (status === 'Scheduled') color = 'geekblue';
        return <Tag color={color}>{status || 'Scheduled'}</Tag>;
      },
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (text: string) => text || '-'
    },
  ];

  return (
    <Card style={{ margin: 32 }}>
      <Title level={3}>My Children's Appointments (All Data)</Title>
      <Spin spinning={loading}>
        <Collapse accordion>
          {fullData.map((appt) => (
            <Panel
              header={
                <>
                  <b>Appointment:</b> {appt.appointmentId || appt._id}{' '}
                  {appt.patient?.name && (
                    <>
                      — <b>Child:</b> {appt.patient.name}{' '}
                      <Tag color="blue">{appt.patient.patientId}</Tag>
                    </>
                  )}
                  {appt.package && (
                    <span>
                      {' '}| <b>Package:</b> {appt.package.name}
                    </span>
                  )}
                </>
              }
              key={appt._id}
            >
              {/* <div style={{ marginBottom: 8 }}>
                <Text strong>Raw Data</Text>
                <pre
                  style={{
                    background: "#f7f7f7",
                    padding: "8px",
                    borderRadius: "4px",
                    fontSize: 12,
                    maxHeight: 280,
                    overflow: "auto"
                  }}
                >
                  {JSON.stringify(appt, null, 2)}
                </pre>
              </div> */}
              <br />
              <Table
                title={() => 'Appointment Info'}
                columns={appointmentColumns}
                dataSource={[appt]}
                size="small"
                pagination={false}
                rowKey={() => 'appt.' + appt._id}
              />
              {appt.patient &&
                <Table
                  style={{ marginTop: 10 }}
                  title={() => 'Child Info'}
                  columns={patientColumns}
                  dataSource={[appt.patient]}
                  size="small"
                  pagination={false}
                  rowKey={() => 'pat.' + appt.patient?._id}
                />
              }
              {appt.package &&
                <Table
                  style={{ marginTop: 10 }}
                  title={() => 'Package Info'}
                  columns={packageColumns}
                  dataSource={[appt.package]}
                  size="small"
                  pagination={false}
                  rowKey={() => 'pkg.' + (appt.package?._id || Math.random())}
                />
              }
              {/* Sessions Table */}
              <Table
                style={{ marginTop: 10 }}
                title={() => 'Sessions'}
                columns={sessionColumns}
                dataSource={Array.isArray(appt.sessions) && appt.sessions.length ? appt.sessions.map((s, idx) => ({ ...s, key: idx })) : []}
                size="small"
                pagination={false}
                // rowKey={(row, idx) => `${appt._id}_sess_${idx}`}
                locale={{
                  emptyText: "No session data"
                }}
              />
            </Panel>
          ))}
        </Collapse>
        {(!loading && !fullData.length) && (
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <Text type="secondary">No appointments found.</Text>
          </div>
        )}
      </Spin>
    </Card>
  );
};

export default MyChildrenAppointmentsPage;
