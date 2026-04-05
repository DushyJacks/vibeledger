
import React from 'react';
import { LayoutDashboard, Music, PlusCircle, BarChart3, FileCheck } from 'lucide-react';
import { Track, RoyaltyPayment } from './types';

export const COLORS = {
  background: '#0A0A0A',
  card: '#121212',
  elevated: '#181818',
  primary: '#4FD1FF', // Apple-style Cyan
  secondary: '#22D3EE',
  success: '#4ADE80',
  warning: '#FACC15',
  textPrimary: '#F5F5F7',
  textSecondary: '#A1A1AA',
  muted: '#71717A',
  border: 'rgba(255, 255, 255, 0.06)'
};

// Starting with an empty state for a production-ready clean slate
export const INITIAL_TRACKS: Track[] = [];

export const MOCK_PAYMENTS: RoyaltyPayment[] = [];

export const NAV_ITEMS = [
  { id: 'DASHBOARD', label: 'Analytics', icon: <LayoutDashboard size={18} /> },
  { id: 'MARKETPLACE', label: 'Discover', icon: <Music size={18} /> },
  { id: 'LICENSES', label: 'My Licenses', icon: <FileCheck size={18} /> },
  { id: 'REGISTER', label: 'Asset Registration', icon: <PlusCircle size={18} /> }
];
