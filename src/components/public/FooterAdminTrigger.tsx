'use client';

import React, { useState } from 'react';
import { AdminAccessModal } from './AdminAccessModal';

export function FooterAdminTrigger() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleClick = async () => {
    if (checking) return;
    setChecking(true);

    try {
      const res = await fetch('/api/admin/auth/status');
      if (res.ok) {
        const data = await res.json();
        if (data?.authenticated && data?.redirectUrl) {
          window.location.href = data.redirectUrl;
          return;
        }
      }
    } catch {
      // On error, fall back to showing the access modal
    } finally {
      setChecking(false);
    }

    setIsModalOpen(true);
  };

  return (
    <>
      <button
        type="button"
        data-testid="footer-admin-link"
        onClick={handleClick}
        className="cursor-default text-inherit hover:text-inherit no-underline hover:no-underline focus:outline-none bg-transparent border-0 p-0 font-inherit inline"
      >
        Hydroponic Database System
      </button>
      <AdminAccessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

export default FooterAdminTrigger;
