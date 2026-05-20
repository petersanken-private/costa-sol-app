import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Milestone, MilestoneCategory, MilestoneStatus, MilestonePriority } from '../types';

function dbToMilestone(r: Record<string, unknown>): Milestone {
  return {
    id:          r.id as string,
    propertyId:  r.property_id as string,
    title:       r.title as string,
    category:    r.category as MilestoneCategory,
    priority:    (r.priority as MilestonePriority | undefined) ?? undefined,
    dueDate:     r.due_date as string,
    status:      r.status as MilestoneStatus,
    amount:      r.amount as number | undefined,
    notes:       r.notes as string | undefined,
    completedAt: r.completed_at as string | undefined,
    createdAt:   (r.created_at as string | undefined) ?? undefined,
  };
}

function milestoneToDb(m: Milestone): Record<string, unknown> {
  return {
    id:           m.id,
    property_id:  m.propertyId,
    title:        m.title,
    category:     m.category,
    priority:     m.priority   ?? null,
    due_date:     m.dueDate,
    status:       m.status,
    amount:       m.amount     ?? null,
    notes:        m.notes      ?? null,
    completed_at: m.completedAt ?? null,
  };
}

// Auto-update overdue status based on date
function withComputedStatus(m: Milestone): Milestone {
  if (m.status === 'done' || m.status === 'snoozed') return m;
  const today = new Date().toISOString().split('T')[0];
  if (m.dueDate < today) return { ...m, status: 'overdue' };
  return m;
}

// Days until due (negative = overdue)
export function daysUntil(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

export function useMilestones(propertyId?: string) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let q = supabase.from('milestones').select('*').order('due_date');
    if (propertyId) q = q.eq('property_id', propertyId);

    const { data, error: err } = await q;
    if (err) { setError(err.message); }
    else {
      setMilestones(
        (data ?? []).map(r => withComputedStatus(dbToMilestone(r as Record<string, unknown>)))
      );
    }
    setLoading(false);
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  async function add(m: Milestone) {
    const { error: err } = await supabase.from('milestones').insert(milestoneToDb(m));
    if (!err) setMilestones(prev => [...prev, withComputedStatus(m)].sort((a, b) => a.dueDate.localeCompare(b.dueDate)));
    return { error: err?.message ?? null };
  }

  async function update(m: Milestone) {
    const { error: err } = await supabase.from('milestones').update(milestoneToDb(m)).eq('id', m.id);
    if (!err) setMilestones(prev => prev.map(x => x.id === m.id ? withComputedStatus(m) : x));
    return { error: err?.message ?? null };
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from('milestones').delete().eq('id', id);
    if (!err) setMilestones(prev => prev.filter(m => m.id !== id));
    return { error: err?.message ?? null };
  }

  async function markDone(id: string) {
    const now = new Date().toISOString();
    const { error: err } = await supabase
      .from('milestones')
      .update({ status: 'done', completed_at: now })
      .eq('id', id);
    if (!err) setMilestones(prev => prev.map(m =>
      m.id === id ? { ...m, status: 'done' as MilestoneStatus, completedAt: now } : m
    ));
    return { error: err?.message ?? null };
  }

  // Summary counts for dashboard badge
  const overdue     = milestones.filter(m => m.status === 'overdue').length;
  const upcoming    = milestones.filter(m => m.status === 'upcoming' && daysUntil(m.dueDate) <= 30).length;
  // "Urgent" = försenade + de inom 7 dagar (för sidebar-badge)
  const urgentCount = overdue + milestones.filter(m => m.status === 'upcoming' && daysUntil(m.dueDate) <= 7).length;

  return { milestones, loading, error, add, update, remove, markDone, overdue, upcoming, urgentCount, reload: load };
}
