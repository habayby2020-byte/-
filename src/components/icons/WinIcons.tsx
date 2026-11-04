import React from 'react';

// Windows-style Start Logo
export const WinLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 88 88" className={className} fill="none">
    <path fill="#0078D4" d="M0 0h41.5v41.5H0zM46.5 0H88v41.5H46.5zM0 46.5h41.5V88H0zM46.5 46.5H88V88H46.5z"/>
  </svg>
);

// File Explorer Yellow Folder with Blue Tab Icon
export const ExplorerIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none">
    <path d="M4 12a4 4 0 0 1 4-4h12l4 4h16a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V12z" fill="#0078D4" />
    <path d="M4 17a3 3 0 0 1 3-3h34a3 3 0 0 1 3 3v21a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V17z" fill="#FFC83D" />
    <path d="M4 22a2 2 0 0 1 2-2h36a2 2 0 0 1 2 2v16a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V22z" fill="#FFE27A" opacity="0.9" />
    <rect x="18" y="10" width="12" height="4" rx="1" fill="#005A9E" opacity="0.6"/>
  </svg>
);

// Modern System Web Browser Icon (Clean Fluent Globe - No proprietary brand)
export const BrowserIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none">
    <defs>
      <linearGradient id="browserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#2563EB" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="20" fill="url(#browserGrad)" />
    <ellipse cx="24" cy="24" rx="9" ry="20" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.8" />
    <line x1="4" y1="24" x2="44" y2="24" stroke="#FFFFFF" strokeWidth="2" opacity="0.8" />
    <line x1="7" y1="14" x2="41" y2="14" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.6" />
    <line x1="7" y1="34" x2="41" y2="34" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.6" />
    <circle cx="24" cy="24" r="2" fill="#FFFFFF" />
  </svg>
);

// Settings Fluent Gear
export const SettingsIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none">
    <circle cx="24" cy="24" r="20" fill="#0078D4" />
    <path d="M24 16a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" fill="#FFFFFF" />
    <path d="M26 8h-4l-1 4.2c-.7.3-1.4.7-2 1.1L15 11.8l-2.8 2.8 1.5 4c-.4.6-.8 1.3-1.1 2L8.4 22v4l4.2 1c.3.7.7 1.4 1.1 2l-1.5 4 2.8 2.8 4-1.5c.6.4 1.3.8 2 1.1l1 4.2h4l1-4.2c.7-.3 1.4-.7 2-1.1l4 1.5 2.8-2.8-1.5-4c.4-.6.8-1.3 1.1-2l4.2-1v-4l-4.2-1c-.3-.7-.7-1.4-1.1-2l1.5-4-2.8-2.8-4 1.5c-.6-.4-1.3-.8-2-1.1L26 8z" fill="#FFFFFF" opacity="0.95" />
  </svg>
);

// Notepad Icon
export const NotepadIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none">
    <rect x="8" y="6" width="32" height="36" rx="4" fill="#0078D4" />
    <rect x="12" y="10" width="24" height="28" rx="2" fill="#FFFFFF" />
    <line x1="16" y1="16" x2="32" y2="16" stroke="#0078D4" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="16" y1="22" x2="32" y2="22" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
    <line x1="16" y1="28" x2="26" y2="28" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
    <path d="M28 32l8-8 3 3-8 8h-3v-3z" fill="#3B82F6" />
  </svg>
);

// Calculator Icon
export const CalculatorIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none">
    <rect x="8" y="6" width="32" height="36" rx="5" fill="#0078D4" />
    <rect x="12" y="10" width="24" height="8" rx="2" fill="#E2E8F0" />
    <text x="32" y="16" textAnchor="end" fontSize="6" fontWeight="bold" fill="#1E293B">012</text>
    <circle cx="16" cy="24" r="2.5" fill="#FFFFFF" />
    <circle cx="24" cy="24" r="2.5" fill="#FFFFFF" />
    <circle cx="32" cy="24" r="2.5" fill="#60A5FA" />
    <circle cx="16" cy="31" r="2.5" fill="#FFFFFF" />
    <circle cx="24" cy="31" r="2.5" fill="#FFFFFF" />
    <circle cx="32" cy="31" r="2.5" fill="#60A5FA" />
    <circle cx="16" cy="37" r="2.5" fill="#FFFFFF" />
    <circle cx="24" cy="37" r="2.5" fill="#38BDF8" />
    <circle cx="32" cy="37" r="2.5" fill="#F59E0B" />
  </svg>
);

// Diagnostics and Self-Healing Icon
export const DiagnosticsIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none">
    <circle cx="24" cy="24" r="20" fill="#0D9488" />
    <path d="M16 24h5l3-6 4 12 3-6h5" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="36" cy="14" r="4" fill="#34D399" />
  </svg>
);

// This PC Desktop Icon
export const ThisPcIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none">
    <rect x="4" y="6" width="40" height="26" rx="3" fill="#0078D4" />
    <rect x="7" y="9" width="34" height="20" rx="1.5" fill="#60A5FA" opacity="0.3" />
    <rect x="7" y="9" width="34" height="20" rx="1.5" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.4" />
    <path d="M24 13l6 6-6 6M24 13L18 19l6 6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 32v6h8v-6" fill="#94A3B8" />
    <rect x="14" y="38" width="20" height="4" rx="2" fill="#64748B" />
  </svg>
);

// Network Desktop Icon
export const NetworkIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none">
    <circle cx="24" cy="24" r="18" fill="#0284C7" />
    <ellipse cx="24" cy="24" rx="8" ry="17" stroke="#BAE6FD" strokeWidth="1.8" fill="none" />
    <line x1="6" y1="24" x2="42" y2="24" stroke="#BAE6FD" strokeWidth="1.8" />
    <line x1="9" y1="16" x2="39" y2="16" stroke="#BAE6FD" strokeWidth="1.5" />
    <line x1="9" y1="32" x2="39" y2="32" stroke="#BAE6FD" strokeWidth="1.5" />
  </svg>
);

// Recycle Bin Desktop Icon
export const RecycleBinIcon: React.FC<{ className?: string; isEmpty?: boolean }> = ({ className = 'w-10 h-10', isEmpty = false }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none">
    <rect x="12" y="14" width="24" height="28" rx="3" fill="#0284C7" opacity="0.85" />
    <path d="M10 12h28a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2z" fill="#0369A1" />
    <rect x="20" y="4" width="8" height="2" rx="1" fill="#BAE6FD" />
    <line x1="18" y1="20" x2="18" y2="36" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    <line x1="24" y1="20" x2="24" y2="36" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    <line x1="30" y1="20" x2="30" y2="36" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    {!isEmpty && (
      <path d="M15 16l3-2 6 3 6-2 3 2v2H15v-3z" fill="#E2E8F0" opacity="0.9" />
    )}
  </svg>
);

// User Folder Desktop Icon
export const UserFolderIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none">
    <path d="M6 12a3 3 0 0 1 3-3h12l4 4h14a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V12z" fill="#F59E0B" />
    <path d="M6 18a2 2 0 0 1 2-2h32a2 2 0 0 1 2 2v18a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V18z" fill="#FBBF24" />
    <circle cx="24" cy="24" r="4" fill="#B45309" opacity="0.6"/>
    <path d="M17 33c0-3.5 3-5 7-5s7 1.5 7 5" stroke="#B45309" strokeWidth="2" strokeLinecap="round" opacity="0.6" fill="none"/>
  </svg>
);

// Taskbar Search Icon
export const TaskbarSearchIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

// Task View Icon
export const TaskViewIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <rect x="3" y="5" width="11" height="14" rx="2" fill="#0078D4" />
    <rect x="10" y="7" width="11" height="12" rx="2" fill="#94A3B8" opacity="0.9" />
  </svg>
);

// Chat / Messages Icon (Neutral Fluent style)
export const ChatTeamsIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <rect x="3" y="4" width="18" height="13" rx="3" fill="#4F46E5" />
    <polygon points="8,17 12,17 10,20" fill="#4F46E5" />
    <circle cx="8" cy="10.5" r="1.2" fill="#FFFFFF" />
    <circle cx="12" cy="10.5" r="1.2" fill="#FFFFFF" />
    <circle cx="16" cy="10.5" r="1.2" fill="#FFFFFF" />
  </svg>
);

