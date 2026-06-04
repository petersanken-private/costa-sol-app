import { useState } from 'react';
import { Btn, Modal, FormGroup } from '../ui';
import { ProspectProperty, PropertyStatus } from '../../types';
import { STATUS_LABELS } from '../../data';
import { fmtMoney } from '../../utils/calc.utils';

/** Status som är meningsfulla vid "köp" — watchlist exkluderas medvetet. */
const CONVERT_STATUSES: PropertyStatus[] = ['under-contract', 'owned', 'off-plan'];

export interface ConvertProspectModalProps {
  prospect: ProspectProperty;
  onClose:  () => void;
  onConfirm: (opts: { status: PropertyStatus; purchaseDate?: string }) => void;
}

export function ConvertProspectModal({ prospect, onClose, onConfirm }: ConvertProspectModalProps) {
  const [status,       setStatus]       = useState<PropertyStatus>('under-contract');
  const [purchaseDate, setPurchaseDate] = useState('');

  function handleConfirm() {
    onConfirm({ status, purchaseDate: purchaseDate || undefined });
  }

  return (
    <Modal
      title="Flytta till portfölj"
      onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Avbryt</Btn>
        <Btn variant="primary" onClick={handleConfirm}>Flytta till portfölj</Btn>
      </>}
    >
      <p className="text-[13px] text-text-dim mb-4">
        <strong className="text-text">{prospect.name}</strong> ({fmtMoney(prospect.purchasePrice)}) skapas som
        ett objekt i portföljen och tas bort från prospekt. Övriga uppgifter
        (badrum, uthyrningsstrategi, aktuellt värde) justerar ni efteråt.
      </p>

      <div className="grid-2">
        <FormGroup label="Status">
          <select className="form-input" value={status} onChange={e => setStatus(e.target.value as PropertyStatus)}>
            {CONVERT_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </FormGroup>
        <FormGroup label="Tillträdesdatum (valfritt)">
          <input className="form-input" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
        </FormGroup>
      </div>
    </Modal>
  );
}
