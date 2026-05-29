import { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { useMilestones, daysUntil } from '../../hooks/useMilestones';
import { Milestone, MilestoneStatus } from '../../types';
import { Card, Btn } from '../ui';
import { MilestoneModal } from '.';
import { MilestoneSummaryStrip } from './MilestoneSummaryStrip';
import { MilestoneRow } from './MilestoneRow';

type GroupKey = MilestoneStatus | 'all' | 'soon' | 'month' | 'later';

const FILTER_OPTIONS: { key: GroupKey; label: string }[] = [
  { key: 'all',     label: 'Alla'          },
  { key: 'overdue', label: '🔴 Försenade'  },
  { key: 'soon',    label: '🟡 Snart'      },
  { key: 'month',   label: '📅 30 dagar'  },
  { key: 'later',   label: 'Kommande'      },
  { key: 'done',    label: '✓ Klara'      },
];

export function Milestones() {
  const { state } = useApp();
  const { milestones, loading, add, update, remove, markDone } = useMilestones();

  const [showModal,  setShowModal]  = useState(false);
  const [editItem,   setEditItem]   = useState<Milestone | null>(null);
  const [filterStat, setFilterStat] = useState<GroupKey>('all');
  const [saving,     setSaving]     = useState(false);

  const groups = [
    { key: 'overdue', label: 'Försenade',    color: 'var(--red)',      items: milestones.filter(m => m.status === 'overdue') },
    { key: 'soon',    label: 'Inom 7 dagar', color: '#d97706',         items: milestones.filter(m => m.status === 'upcoming' && daysUntil(m.dueDate) <= 7) },
    { key: 'month',   label: 'Inom 30 dagar',color: 'var(--gold)',     items: milestones.filter(m => m.status === 'upcoming' && daysUntil(m.dueDate) > 7 && daysUntil(m.dueDate) <= 30) },
    { key: 'later',   label: 'Kommande',      color: 'var(--text-dim)', items: milestones.filter(m => m.status === 'upcoming' && daysUntil(m.dueDate) > 30) },
    { key: 'done',    label: 'Klara',         color: 'var(--green)',    items: milestones.filter(m => m.status === 'done') },
  ];

  const filtered = filterStat === 'all'
    ? groups.filter(g => g.items.length > 0)
    : groups.filter(g => g.key === filterStat && g.items.length > 0);

  const overdueCount  = groups[0].items.length;
  const soonCount     = groups[1].items.length;
  const totalPayments = milestones
    .filter(m => m.category === 'payment' && m.status !== 'done' && m.amount)
    .reduce((s, m) => s + (m.amount ?? 0), 0);

  async function handleSave(m: Milestone) {
    setSaving(true);
    if (editItem) await update(m);
    else          await add(m);
    setSaving(false);
    setShowModal(false);
    setEditItem(null);
  }

  async function handleDelete(m: Milestone) {
    if (!window.confirm(`Ta bort "${m.title}"?`)) return;
    await remove(m.id);
  }

  return (
    <div className="page">
      <div className="page-header">
        <p className="page-eyebrow">Tidslinje</p>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="page-title">Milstolpar</h1>
          <Btn variant="primary" size="sm" onClick={() => { setEditItem(null); setShowModal(true); }}>
            + Ny milstolpe
          </Btn>
        </div>
      </div>

      <MilestoneSummaryStrip
        milestones={milestones}
        overdueCount={overdueCount}
        soonCount={soonCount}
        totalPayments={totalPayments}
      />

      <div className="ms-filter-tabs">
        {FILTER_OPTIONS.map(f => (
          <button
            key={f.key}
            className={`filter-pill ${filterStat === f.key ? 'filter-pill--active' : ''}`}
            onClick={() => setFilterStat(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-mute">Laddar…</p>
      ) : milestones.length === 0 ? (
        <Card className="card-p">
          <div className="empty-state">
            <p className="empty-state__icon">📅</p>
            <p className="empty-state__title">Inga milstolpar ännu</p>
            <p className="empty-state__sub">
              Lägg till betalningsetapper, deadlines för VFT-licens, Modelo 210 och inflyttningsdatum.
            </p>
            <div style={{ marginTop: '16px' }}>
              <Btn variant="primary" size="sm" onClick={() => setShowModal(true)}>+ Skapa första milstolpen</Btn>
            </div>
          </div>
        </Card>
      ) : (
        <div className="ms-groups">
          {filtered.map(group => (
            <div key={group.key} className="ms-group">
              <div className="ms-group__header">
                <span className="ms-group__label" style={{ color: group.color }}>{group.label}</span>
                <span className="ms-group__count">{group.items.length}</span>
              </div>
              <div className="ms-list">
                {group.items.map(m => (
                  <MilestoneRow
                    key={m.id}
                    milestone={m}
                    property={state.properties.find(p => p.id === m.propertyId)}
                    onMarkDone={markDone}
                    onEdit={item => { setEditItem(item); setShowModal(true); }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <MilestoneModal
          initial={editItem}
          properties={state.properties}
          saving={saving}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
