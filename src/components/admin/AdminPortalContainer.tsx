'use client';

import React, { useState, useEffect } from 'react';
import AdminLoginForm from './AdminLoginForm';
import AdminDashboard from './AdminDashboard';

interface AdminPortalContainerProps {
  initialAuthenticated: boolean;
  secretPath: string;
}

export default function AdminPortalContainer({
  initialAuthenticated,
  secretPath,
}: AdminPortalContainerProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuthenticated);

  useEffect(() => {
    setIsAuthenticated(initialAuthenticated);
  }, [initialAuthenticated]);

  if (!isAuthenticated) {
    return (
      <AdminLoginForm
        secretPath={secretPath}
        onLoginSuccess={() => setIsAuthenticated(true)}
      />
    );
  }

  return (
    <AdminDashboard
      secretPath={secretPath}
      onLogout={() => setIsAuthenticated(false)}
    />
  );
}
