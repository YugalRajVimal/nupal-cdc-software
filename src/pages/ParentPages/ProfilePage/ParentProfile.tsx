import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Spin, Typography, Descriptions, message } from 'antd';

const { Title } = Typography;

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface ParentProfileType {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  _id?: string;
  [key: string]: any;
}

const ParentProfile: React.FC = () => {
  const [profile, setProfile] = useState<ParentProfileType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API_BASE_URL}/api/parent/profile`)
      .then((res) => {
        if (res.data && res.data.success && res.data.data) {
          setProfile(res.data.data);
        } else {
          setProfile(null);
          message.error('Failed to fetch profile data.');
        }
      })
      .catch(() => {
        message.error('Error fetching profile.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card style={{ maxWidth: 600, margin: '40px auto' }}>
      <Title level={3}>Parent Profile</Title>
      <Spin spinning={loading}>
        {profile ? (
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item label="Name">{profile.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="Email">{profile.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="Phone">{profile.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="Address">{profile.address || '-'}</Descriptions.Item>
            <Descriptions.Item label="User ID">{profile._id || '-'}</Descriptions.Item>
          </Descriptions>
        ) : (
          !loading && <Typography.Text type="secondary">No profile data found.</Typography.Text>
        )}
      </Spin>
    </Card>
  );
};

export default ParentProfile;
