/**
 * Login Page Component
 * Location: frontend/src/features/auth/LoginPage.tsx
 *
 * Family member selection + PIN entry for kiosk login
 */

import React, { useState, useEffect } from 'react';
import { Typography, Alert, Modal, Form, Input, message } from 'antd';
import { ArrowLeftOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { PinPad } from '../../components/PinPad';
import {
  getFamilyMembers,
  getStoredTenantId,
  setupPin,
  getStoredTokens,
} from '../../services/auth';
import type { FamilyMember } from '../../types/auth';
import './LoginPage.css';

const { Title, Text } = Typography;

type LoginView = 'family' | 'pin' | 'legacy';

const LoginPage: React.FC = () => {
  const { login, loginWithPin, isLoading, isAuthenticated, accessToken } = useAuth();
  const [view, setView] = useState<LoginView>('family');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // PIN Setup Modal
  const [setupModalVisible, setSetupModalVisible] = useState(false);
  const [setupPin1, setSetupPin1] = useState('');
  const [setupPin2, setSetupPin2] = useState('');
  const [setupStep, setSetupStep] = useState<1 | 2>(1);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [pinResetKey, setPinResetKey] = useState(0); // Force PinPad remount

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

  // Load family members
  useEffect(() => {
    const loadMembers = async () => {
      const tenantId = getStoredTenantId();
      if (!tenantId) {
        // No tenant ID stored - show legacy login
        setView('legacy');
        setLoadingMembers(false);
        return;
      }

      try {
        const members = await getFamilyMembers(tenantId);
        setFamilyMembers(members);
        setLoadingMembers(false);
      } catch (err) {
        console.error('Failed to load family members:', err);
        // Fall back to legacy login
        setView('legacy');
        setLoadingMembers(false);
      }
    };

    loadMembers();
  }, []);

  // Handle family member selection
  const handleSelectMember = (member: FamilyMember) => {
    setSelectedMember(member);
    setError(null);

    if (!member.has_pin) {
      // Show PIN setup flow - need to login first with legacy
      message.info('Please set up your PIN using the legacy login first.');
      setView('legacy');
    } else {
      setView('pin');
    }
  };

  // Handle PIN entry complete
  const handlePinComplete = async (pin: string) => {
    if (!selectedMember) return;

    try {
      await loginWithPin(selectedMember.id, pin);
      // Navigation happens via the useEffect above when isAuthenticated changes
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Invalid PIN');
      } else {
        setError('Unable to connect to server. Please try again.');
      }
    }
  };

  // Go back to family selection
  const handleBack = () => {
    setSelectedMember(null);
    setError(null);
    setView('family');
  };

  // Legacy login handler
  const handleLegacyLogin = async (values: { email: string; password: string }) => {
    setError(null);
    try {
      await login(values.email, values.password);
      // After successful login, if no PIN is set, show setup modal
      // This will be handled after authentication
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else {
        setError('Unable to connect to server. Please try again.');
      }
    }
  };

  // PIN Setup flow
  const handleSetupPinComplete = async (pin: string) => {
    if (setupStep === 1) {
      setSetupPin1(pin);
      setSetupStep(2);
      setPinResetKey(prev => prev + 1); // Force PinPad to reset for step 2
      setSetupError(null);
    } else {
      if (pin !== setupPin1) {
        setSetupError('PINs do not match. Try again.');
        setSetupStep(1);
        setSetupPin1('');
        setSetupPin2('');
        setPinResetKey(prev => prev + 1); // Reset for retry
        return;
      }

      // Submit PIN setup
      try {
        const { accessToken } = getStoredTokens();
        if (!accessToken) {
          setSetupError('Session expired. Please login again.');
          return;
        }

        await setupPin(accessToken, { pin, confirm_pin: pin });
        message.success('PIN set up successfully!');
        setSetupModalVisible(false);
        // Reload to update has_pin status
        window.location.reload();
      } catch (err: any) {
        setSetupError(err.response?.data?.detail || 'Failed to set up PIN');
      }
    }
  };

  // Render family member cards
  const renderFamilySelection = () => (
    <div className="login-family-container">
      <div className="login-header">
        <Title level={2} className="login-title">Family Hub</Title>
        <Text className="login-subtitle">Who's logging in?</Text>
      </div>

      <div className="family-grid">
        {familyMembers.map((member) => (
          <button
            key={member.id}
            className="family-card"
            onClick={() => handleSelectMember(member)}
            style={{ '--member-color': member.color } as React.CSSProperties}
          >
            <div
              className="family-avatar"
              style={{ backgroundColor: member.color }}
            >
              {member.avatar_url ? (
                <img src={member.avatar_url} alt={member.name} />
              ) : (
                <span>{member.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="family-name">{member.name}</span>
            {!member.has_pin && (
              <span className="family-no-pin">No PIN set</span>
            )}
          </button>
        ))}
      </div>

      <button
        className="legacy-login-link"
        onClick={() => setView('legacy')}
      >
        Use email/password instead
      </button>
    </div>
  );

  // Render PIN entry
  const renderPinEntry = () => (
    <div className="login-pin-container">
      <button className="back-button" onClick={handleBack}>
        <ArrowLeftOutlined /> Back
      </button>

      <div className="selected-member">
        <div
          className="family-avatar large"
          style={{ backgroundColor: selectedMember?.color }}
        >
          {selectedMember?.avatar_url ? (
            <img src={selectedMember.avatar_url} alt={selectedMember.name} />
          ) : (
            <span>{selectedMember?.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <Title level={3} className="member-name">{selectedMember?.name}</Title>
      </div>

      <PinPad
        onComplete={handlePinComplete}
        onCancel={handleBack}
        error={error || undefined}
        title="Enter your PIN"
      />
    </div>
  );

  // Render legacy email/password login
  const renderLegacyLogin = () => (
    <div className="login-legacy-container">
      {familyMembers.length > 0 && (
        <button className="back-button" onClick={handleBack}>
          <ArrowLeftOutlined /> Back to family selection
        </button>
      )}

      <div className="login-header">
        <Title level={2} className="login-title">Family Hub</Title>
        <Text className="login-subtitle">Sign in with email</Text>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 24 }}
        />
      )}

      <Form
        name="login"
        onFinish={handleLegacyLogin}
        layout="vertical"
        size="large"
        requiredMark={false}
        className="legacy-form"
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input
            prefix={<UserOutlined style={{ color: '#64748b' }} />}
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
            prefix={<LockOutlined style={{ color: '#64748b' }} />}
            placeholder="Password"
            autoComplete="current-password"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </Form.Item>
      </Form>

      <div className="demo-hint">
        <Text type="secondary">
          Demo: james@brown.family / familyhub123
        </Text>
      </div>
    </div>
  );

  // PIN Setup Modal
  const renderPinSetupModal = () => (
    <Modal
      open={setupModalVisible}
      onCancel={() => setSetupModalVisible(false)}
      footer={null}
      closable={false}
      centered
      className="pin-setup-modal"
    >
      <PinPad
        key={`pin-setup-${pinResetKey}`}
        onComplete={handleSetupPinComplete}
        onCancel={() => {
          setSetupModalVisible(false);
          setSetupStep(1);
          setSetupPin1('');
          setSetupError(null);
          setPinResetKey(prev => prev + 1);
        }}
        error={setupError || undefined}
        title={setupStep === 1 ? 'Create your PIN' : 'Confirm your PIN'}
        subtitle={setupStep === 1 ? 'Choose a 4-digit PIN' : 'Enter the same PIN again'}
      />
    </Modal>
  );

  if (loadingMembers) {
    return (
      <div className="login-container">
        <div className="login-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="login-container">
      {view === 'family' && renderFamilySelection()}
      {view === 'pin' && renderPinEntry()}
      {view === 'legacy' && renderLegacyLogin()}
      {renderPinSetupModal()}
    </div>
  );
};

export default LoginPage;
