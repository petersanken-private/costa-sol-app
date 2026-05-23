import { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { Card, Btn, Tabs } from '../components/ui';
import { calcBuyingCosts } from '../utils/calc.utils';
import { DocumentsTab } from '../components/DocumentsTab';
import { RecurringExpensesTab } from '../components/recurring';
import { MortgagesTab } from '../components/mortgages';
import { BudgetTab } from '../components/budget';
import { AIPanel } from '../components/AIPanel';
import {
  PropertyHeader, PropertyQuickStats, CalcTab, RentalsTab, ExpensesTab,
} from '../components/property';

const DETAIL_TABS = [
  { id: 'calc',      label: 'Kalkylator'       },
  { id: 'rentals',   label: 'Hyreshistorik'    },
  { id: 'expenses',  label: 'Kostnader'        },
  { id: 'recurring', label: 'Återkommande'     },
  { id: 'mortgage',  label: 'Bolån'            },
  { id: 'budget',    label: 'Budget vs utfall' },
  { id: 'ai',        label: '🤖 AI-analys'     },
  { id: 'docs',      label: 'Dokument'         },
];

export function PropertyDetail() {
  const {
    state, navigate, getProperty, getRentalsForProperty, getExpensesForProperty,
  } = useApp();
  const [tab, setTab] = useState('calc');

  const property = getProperty(state.selectedPropertyId ?? '');
  if (!property) {
    return (
      <div className="page">
        <p className="text-mute">Fastigheten hittades inte.</p>
        <Btn onClick={() => navigate('portfolio')}>← Tillbaka</Btn>
      </div>
    );
  }

  const rentals  = getRentalsForProperty(property.id);
  const expenses = getExpensesForProperty(property.id);
  const costs    = calcBuyingCosts(property.purchasePrice);

  const totalRentRevenue = rentals.reduce((s, r) => s + r.revenue, 0);
  const totalNights      = rentals.reduce((s, r) => s + r.nights, 0);
  const totalExpenses    = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="page">
      <PropertyHeader property={property} onBack={() => navigate('portfolio')} />

      <PropertyQuickStats
        totalRentRevenue={totalRentRevenue}
        totalNights={totalNights}
        totalExpenses={totalExpenses}
        totalKapital={property.purchasePrice + costs.total}
      />

      <Tabs tabs={DETAIL_TABS} active={tab} onChange={setTab} />

      {tab === 'calc'      && <CalcTab     property={property} />}
      {tab === 'rentals'   && <RentalsTab  property={property} rentals={rentals} />}
      {tab === 'expenses'  && <ExpensesTab property={property} expenses={expenses} />}
      {tab === 'recurring' && <RecurringExpensesTab propertyId={property.id} />}
      {tab === 'mortgage'  && <MortgagesTab         propertyId={property.id} />}
      {tab === 'budget'    && <BudgetTab            propertyId={property.id} />}
      {tab === 'docs'      && <DocumentsTab         propertyId={property.id} />}
      {tab === 'ai'        && (
        <AIPanel
          scope="property"
          propertyId={property.id}
          title={`🤖 AI-djupanalys · ${property.name}`}
          presets={[
            { key: 'property-deepdive', icon: '🔬', label: 'Djupanalys av objektet' },
          ]}
        />
      )}

      {property.notes && (
        <Card className="card-p-sm" style={{ marginTop: '16px' }}>
          <p className="text-mute" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px' }}>
            Anteckningar
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.6 }}>{property.notes}</p>
        </Card>
      )}
    </div>
  );
}
