import { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { useMilestones, daysUntil } from '../../hooks/useMilestones';
import { Milestone, MilestoneStatus } from '../../types';
import { Card, Btn } from '../ui';
import { fmtMoney } from '../../utils/calc.utils';
import { catInfo, DueBadge, MilestoneModal } from '.';

// ── Main page ─────────────────────────────────────────────────────────────────
export function Milestones() {
  const { state } = useApp();
  const { milestones, loading, add, update, remove, markDone } = useMilestones();

  const [showModal,  setShowModal]  = useState(false);
  const [editItem,   setEditItem]   = useState<Milestone | null>(null);
  const [filterStat, setFilterStat] = useState<MilestoneStatus | 'all'>('all');
  const [saving,     setSaving]     = useState(false);

  // Group: overdue → this week → this month → later → done
  const groups = [
    {
      key:   'overdue',
      label: 'Försenade',
      color: 'var(--red)',
      items: milestones.filter(m => m.status === 'overdue'),
    },
    {
      key:   'soon',
      label: 'Inom 7 dagar',
      color: '#d97706',
      items: milestones.filter(m => m.status === 'upcoming' && daysUntil(m.dueDate) <= 7),
    },
    {
      key:   'month',
      label: 'Inom 30 dagar',
      color: 'var(--gold)',
      items: milestones.filter(m => m.status === 'upcoming' && daysUntil(m.dueDate) > 7 && daysUntil(m.dueDate) <= 30),
    },
    {
      key:   'later',
      label: 'Kommande',
      color: 'var(--text-dim)',
      items: milestones.filter(m => m.status === 'upcoming' && daysUntil(m.dueDate) > 30),
    },
    {
      key:   'done',
      label: 'Klara',
      color: 'var(--green)',
      items: milestones.filter(m => m.status === 'done'),
    },
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
        <div className="dashboard-top-bar">
          <h1 className="page-title">Milstolpar</h1>
          <Btn variant="primary" size="sm" onClick={() => { setEditItem(null); setShowModal(true); }}>
            + Ny milstolpe
          </Btn>
        </div>
      </div>

      {/* Summary strip */}
      <div className="ms-summary-strip">
        <div className="ms-summary-card" style={{ borderColor: overdueCount > 0 ? 'var(--red)' : undefined }}>
          <p className="stat-label">Försenade</p>
          <p className="stat-value" style={{ color: overdueCount > 0 ? 'var(--red)' : 'var(--text-mute)' }}>
            {overdueCount}
          </p>
        </div>
        <div className="ms-summary-card" style={{ borderColor: soonCount > 0 ? '#d97706' : undefined }}>
          <p className="stat-label">Inom 7 dagar</p>
          <p className="stat-value" style={{ color: soonCount > 0 ? '#d97706' : 'var(--text-mute)' }}>
            {soonCount}
          </p>
        </div>
        <div className="ms-summary-card">
          <p className="stat-label">Kommande betalningar</p>
          <p className="stat-value" style={{ color: totalPayments > 0 ? 'var(--gold)' : 'var(--text-mute)' }}>
            {totalPayments > 0 ? fmtMoney(totalPayments) : '—'}
          </p>
        </div>
        <div className="ms-summary-card">
          <p className="stat-label">Totalt</p>
          <p className="stat-value">{milestones.filter(m => m.status !== 'done').length}</p>
          <p className="stat-sub">{milestones.filter(m => m.status === 'done').length} klara</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="ms-filter-tabs">
        {([
          { key: 'all',     label: 'Alla' },
          { key: 'overdue', label: '🔴 Försenade' },
          { key: 'soon',    label: '🟡 Snart' },
          { key: 'month',   label: '📅 30 dagar' },
          { key: 'later',   label: 'Kommande' },
          { key: 'done',    label: '✓ Klara' },
        ] as { key: MilestoneStatus | 'all'; label: string }[]).map(f => (
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
                {group.items.map(m => {
                  const cat  = catInfo(m.category);
                  const prop = state.properties.find(p => p.id === m.propertyId);
                  const done = m.status === 'done';

                  return (
                    <div key={m.id} className={`ms-row ${done ? 'ms-row--done' : ''}`}>
                      {/* Left: check button */}
                      <button
                        className={`ms-check ${done ? 'ms-check--done' : ''}`}
                        onClick={() => !done && markDone(m.id)}
                        title={done ? 'Klar' : 'Markera som klar'}
                        disabled={done}
                      >
                        {done ? '✓' : ''}
                      </button>

                      {/* Category icon */}
                      <span className="ms-cat-icon">{cat.icon}</span>

                      {/* Main content */}
                      <div className="ms-row__content">
                        <div className="ms-row__top">
                          <p className="ms-row__title">{m.title}</p>
                          <DueBadge dueDate={m.dueDate} status={m.status} />
                        </div>
                        <div className="ms-row__meta">
                          <span className="ms-cat-label">{cat.label}</span>
                          {prop && <span>· {prop.name}</span>}
                          {m.amount && <span>· <strong style={{ color: 'var(--gold)' }}>{fmtMoney(m.amount)}</strong></span>}
                          {m.notes && <span className="ms-row__notes">· {m.notes}</span>}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="ms-row__actions">
                        <button
                          className="row-action-btn row-action-btn--edit"
                          onClick={() => { setEditItem(m); setShowModal(true); }}
                        >✎</button>
                        <button
                          className="row-action-btn row-action-btn--delete"
                          onClick={() => handleDelete(m)}
                        >×</button>
                      </div>
                    </div>
                  );
                })}
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

