// Calendar — page wrapper för BookingCalendar.

import { BookingCalendar } from './BookingCalendar';

export function Calendar() {
  return (
    <div className="page">
      <div className="page-header">
        <p className="page-eyebrow">Bokningsöversikt</p>
        <h1 className="page-title">Kalender</h1>
        <p className="text-mute text-[13px] mt-1.5">
          Visa alla bokningar per fastighet och månad. iCal-importerade bokningar
          har exakta datum, manuellt registrerade entries visas som spann över hela månaden.
          Färgkodning per plattform — röda dagar markerar konflikter mellan iCal-feeds.
        </p>
      </div>
      <BookingCalendar />
    </div>
  );
}
