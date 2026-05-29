// Dashboard — container med tabs (Översikt / Prognos).
//
// Behåller alert-banner och page-header på topnivå så att de syns oavsett tab.

import { useState } from 'react';
import { Tabs } from '../ui';
import { useDashboard } from '../../hooks/useDashboard';
import { DashboardOverview } from './DashboardOverview';
import { Forecast } from './Forecast';

const DASH_TABS = [
  { id: 'overview', label: 'Översikt' },
  { id: 'forecast', label: 'Prognos'  },
];

export function Dashboard() {
  const { alertMs, navigate } = useDashboard();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="page">
      {alertMs.length > 0 && (
        <div
          className="flex items-center gap-2.5 py-3 px-4 mb-4 bg-[#fff7ed] border border-[#fed7aa] rounded-[10px] cursor-pointer transition-colors duration-150 hover:bg-[#ffedd5]"
          onClick={() => navigate('milestones')}
        >
          <span className="text-[18px] flex-shrink-0">⏰</span>
          <span className="flex-1 text-[13px] text-[#92400e]">
            {alertMs.filter(m => m.status === 'overdue').length > 0 && (
              <strong className="text-red">{alertMs.filter(m => m.status === 'overdue').length} försenade</strong>
            )}
            {alertMs.filter(m => m.status === 'overdue').length > 0 && alertMs.filter(m => m.status === 'upcoming').length > 0 && ' · '}
            {alertMs.filter(m => m.status === 'upcoming').length > 0 && (
              <span>{alertMs.filter(m => m.status === 'upcoming').length} milstolpar inom 7 dagar</span>
            )}
          </span>
          <span className="text-[12px] font-semibold text-[#c2410c] whitespace-nowrap">Visa →</span>
        </div>
      )}

      <div className="page-header">
        <p className="page-eyebrow">Välkommen tillbaka</p>
        <h1 className="page-title">Portföljöversikt</h1>
      </div>

      <Tabs tabs={DASH_TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && <DashboardOverview />}
      {activeTab === 'forecast' && <Forecast />}
    </div>
  );
}
