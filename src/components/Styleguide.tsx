// ════════════════════════════════════════════════════════════════════════════
// Styleguide — visuell katalog över alla UI-primitiver
//
// Nås via `?styleguide` query-param. Bypassar auth (se main.tsx / App.tsx).
// Används som baseline för Playwright visual regression tests.
//
// Lägg till nya komponenter/varianter här när de skapas eller ändras
// så fångas regressioner automatiskt.
// ════════════════════════════════════════════════════════════════════════════

import {
  Badge, Btn, Card, Divider, EmptyState,
  FormGroup, Modal, SectionHeader, Stat, Tabs,
} from './ui';
import { SidebarView } from './SidebarView';
import { useState } from 'react';
import '../styles/global.css';
import '../styles/components.css';

export function Styleguide() {
  const [showModal, setShowModal] = useState(false);
  const [tab,       setTab]       = useState('one');

  return (
    <div style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto', background: 'var(--bg)', minHeight: '100vh' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 300, marginBottom: '8px' }}>
        Costa Sol — Styleguide
      </h1>
      <p style={{ color: 'var(--text-mute)', fontSize: '13px', marginBottom: '32px' }}>
        Visuell katalog över alla UI-primitiver. Används som baseline för Playwright visual regression tests.
      </p>

      {/* ── Buttons ────────────────────────────────────────────────────────── */}
      <Section title="Buttons">
        <SubSection label="Sizes">
          <Btn size="md" variant="primary">Primary medium</Btn>
          <Btn size="sm" variant="primary">Primary small</Btn>
        </SubSection>
        <SubSection label="Variants (md)">
          <Btn variant="primary">Primary</Btn>
          <Btn variant="ghost">Ghost</Btn>
          <Btn variant="danger">Danger</Btn>
        </SubSection>
        <SubSection label="Variants (sm)">
          <Btn size="sm" variant="primary">Primary</Btn>
          <Btn size="sm" variant="ghost">Ghost</Btn>
          <Btn size="sm" variant="danger">Danger</Btn>
        </SubSection>
        <SubSection label="Disabled">
          <Btn variant="primary" disabled>Primary disabled</Btn>
          <Btn variant="ghost" disabled>Ghost disabled</Btn>
        </SubSection>
        <SubSection label="With icon">
          <Btn variant="primary">+ Lägg till</Btn>
          <Btn size="sm" variant="ghost">↻ Uppdatera</Btn>
          <Btn variant="danger">× Ta bort</Btn>
        </SubSection>
      </Section>

      {/* ── Badges ─────────────────────────────────────────────────────────── */}
      <Section title="Badges">
        <SubSection label="Default + colored">
          <Badge label="Default" />
          <Badge label="Ägs" color="var(--green)" />
          <Badge label="Off-plan" color="var(--gold)" />
          <Badge label="Förfallen" color="var(--red)" />
          <Badge label="Bevakas" color="var(--text-mute)" />
        </SubSection>
      </Section>

      {/* ── Stat ───────────────────────────────────────────────────────────── */}
      <Section title="Stat">
        <div className="grid-4">
          <Card className="card-p-md"><Stat label="Default" value="€1 250 000" sub="3 fastigheter" /></Card>
          <Card className="card-p-md"><Stat label="Med färg" value="+€85 000" sub="Orealiserat" color="var(--green)" /></Card>
          <Card className="card-p-md"><Stat label="Negativ" value="−€12 400" sub="Förlust" color="var(--red)" /></Card>
          <Card className="card-p-md"><Stat label="Utan sub" value="€146" /></Card>
        </div>
      </Section>

      {/* ── Cards ──────────────────────────────────────────────────────────── */}
      <Section title="Cards">
        <div className="grid-3">
          <Card className="card-p"><p>Default card med card-p padding</p></Card>
          <Card className="card-p" hoverable><p>Hoverable card</p></Card>
          <Card className="card-p" dashed><p>Dashed card</p></Card>
        </div>
        <div className="grid-3" style={{ marginTop: '12px' }}>
          <Card className="card-p card--gold"><p>Gold-variant</p></Card>
          <Card className="card-p card--selected"><p>Selected (gold border)</p></Card>
          <Card className="card-p-sm"><p>Small padding (card-p-sm)</p></Card>
        </div>
      </Section>

      {/* ── Section Header ─────────────────────────────────────────────────── */}
      <Section title="SectionHeader">
        <Card className="card-p">
          <SectionHeader title="Utan action" />
          <p style={{ color: 'var(--text-mute)', fontSize: '13px' }}>Innehåll här</p>
        </Card>
        <Card className="card-p" style={{ marginTop: '12px' }}>
          <SectionHeader title="Med action" action={<Btn size="sm" variant="ghost">Visa alla →</Btn>} />
          <p style={{ color: 'var(--text-mute)', fontSize: '13px' }}>Innehåll här</p>
        </Card>
      </Section>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <Section title="Tabs">
        <Tabs
          tabs={[
            { id: 'one',   label: 'Översikt'  },
            { id: 'two',   label: 'Detaljer'  },
            { id: 'three', label: 'Historik'  },
          ]}
          active={tab}
          onChange={setTab}
        />
        <p style={{ color: 'var(--text-mute)', fontSize: '13px' }}>Aktiv tab: {tab}</p>
      </Section>

      {/* ── Divider ────────────────────────────────────────────────────────── */}
      <Section title="Divider">
        <Card className="card-p">
          <p>Innehåll ovanför</p>
          <Divider className="mt-8 mb-8" />
          <p>Innehåll nedanför</p>
        </Card>
      </Section>

      {/* ── EmptyState ─────────────────────────────────────────────────────── */}
      <Section title="EmptyState">
        <Card className="card-p">
          <EmptyState
            icon="📅"
            title="Inga milstolpar ännu"
            subtitle="Lägg till betalningsetapper, deadlines för VFT-licens och inflyttningsdatum."
          />
        </Card>
      </Section>

      {/* ── FormGroup ──────────────────────────────────────────────────────── */}
      <Section title="FormGroup">
        <Card className="card-p">
          <div className="grid-2">
            <FormGroup label="Namn">
              <input className="form-input" defaultValue="Essence Residences 3B" />
            </FormGroup>
            <FormGroup label="Köpeskilling (€)">
              <input className="form-input" defaultValue="780000" />
            </FormGroup>
            <FormGroup label="Anteckningar" span2>
              <textarea className="form-input form-input--textarea" defaultValue="Sea view, södervänd terrass" />
            </FormGroup>
          </div>
        </Card>
      </Section>

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      <Section title="Modal">
        <Btn variant="primary" onClick={() => setShowModal(true)}>Öppna modal</Btn>
        {showModal && (
          <Modal
            title="Exempel-modal"
            onClose={() => setShowModal(false)}
            footer={<>
              <Btn variant="ghost" onClick={() => setShowModal(false)}>Avbryt</Btn>
              <Btn variant="primary" onClick={() => setShowModal(false)}>Spara</Btn>
            </>}
          >
            <p style={{ marginBottom: '12px' }}>Modal-innehåll här. Tester ska inkludera modalen öppen.</p>
            <FormGroup label="Fält">
              <input className="form-input" defaultValue="Test" />
            </FormGroup>
          </Modal>
        )}
      </Section>

      {/* ── Typography helpers ─────────────────────────────────────────────── */}
      <Section title="Typography helpers">
        <Card className="card-p">
          <p className="text-display" style={{ fontSize: '24px' }}>text-display (Cormorant Garamond)</p>
          <p className="text-gold">text-gold</p>
          <p className="text-dim">text-dim (text-text-dim)</p>
          <p className="text-mute">text-mute (text-text-mute)</p>
          <p className="text-green">text-green</p>
          <p className="text-red">text-red</p>
        </Card>
      </Section>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <Section title="Sidebar (desktop only, hidden < 768px)">
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg-card)', height: '600px' }}>
          <SidebarView
            activePage="milestones"
            urgentCount={3}
            currency="EUR"
            rate={11.45}
            userEmail="test@costasol.se"
            onNavigate={() => {}}
            onToggleCurrency={() => {}}
            onReset={() => {}}
            onSignOut={() => {}}
          />
          <div style={{ flex: 1, padding: '24px', color: 'var(--text-mute)', fontSize: '13px' }}>
            ← Sidebaren med "Påminnelser" aktiv (med urgent-badge "3") och EUR vald.
          </div>
        </div>
      </Section>

      {/* ── Color tokens ───────────────────────────────────────────────────── */}
      <Section title="Color tokens">
        <div className="grid-4">
          <ColorSwatch name="--gold"        cssVar="var(--gold)"        />
          <ColorSwatch name="--gold-dim"    cssVar="var(--gold-dim)"    />
          <ColorSwatch name="--gold-faint"  cssVar="var(--gold-faint)"  />
          <ColorSwatch name="--bg"          cssVar="var(--bg)"          />
          <ColorSwatch name="--bg-card"     cssVar="var(--bg-card)"     />
          <ColorSwatch name="--bg-subtle"   cssVar="var(--bg-subtle)"   />
          <ColorSwatch name="--bg-hover"    cssVar="var(--bg-hover)"    />
          <ColorSwatch name="--border"      cssVar="var(--border)"      />
          <ColorSwatch name="--border-hi"   cssVar="var(--border-hi)"   />
          <ColorSwatch name="--text"        cssVar="var(--text)"        />
          <ColorSwatch name="--text-dim"    cssVar="var(--text-dim)"    />
          <ColorSwatch name="--text-mute"   cssVar="var(--text-mute)"   />
          <ColorSwatch name="--green"       cssVar="var(--green)"       />
          <ColorSwatch name="--red"         cssVar="var(--red)"         />
          <ColorSwatch name="--blue"        cssVar="var(--blue)"        />
        </div>
      </Section>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 400, marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function SubSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <p style={{ fontSize: '11px', color: 'var(--text-mute)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {children}
      </div>
    </div>
  );
}

function ColorSwatch({ name, cssVar }: { name: string; cssVar: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '32px', height: '32px', background: cssVar, border: '1px solid var(--border)', borderRadius: '6px', flexShrink: 0 }} />
      <code style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-dim)' }}>{name}</code>
    </div>
  );
}
