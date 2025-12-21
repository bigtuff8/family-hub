/**
 * Login Page Component
 * Location: frontend/src/features/auth/LoginPage.tsx
 */

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const { login, isLoading, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Get the page user was trying to access, or default to calendar
  const from = (location.state as any)?.from?.pathname || '/calendar';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const onFinish = async (values: LoginFormValues) => {
    setError(null);
    try {
      await login(values.email, values.password);
      // Navigation happens via the useEffect above when isAuthenticated changes
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else {
        setError('Unable to connect to server. Please try again.');
      }
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a2332 0%, #2d3748 100%)',
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ marginBottom: 8, color: '#1a2332' }}>
              Family Hub
            </Title>
            <Text type="secondary">Sign in to your account</Text>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
            />
          )}

          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            requiredMark={false}
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="Email"
                autoComplete="email"
                autoFocus
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="Password"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                style={{
                  height: 48,
                  fontSize: 16,
                  background: '#2dd4bf',
                  borderColor: '#2dd4bf',
                }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Demo: james@brown.family / familyhub123
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default LoginPage;
