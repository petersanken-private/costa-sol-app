// ── Guideinnehåll ─────────────────────────────────────────────────────────────
//
// Statiska sektioner med JSX-innehåll. Extraherade från Guide.tsx för att
// hålla komponenten under ~150 rader. All logik (toggle, expand/collapse)
// bor kvar i Guide.tsx.

import type { ReactNode } from 'react';
import { TAX, BUYING_COSTS } from '../../constants/tax';

export interface GuideSection {
  id:      string;
  icon:    string;
  title:   string;
  summary: string;
  content: ReactNode;
}

const pct = (n: number) => (n * 100).toFixed(n < 0.1 ? 1 : 0) + '%';

export const SECTIONS: GuideSection[] = [
  // ── 1. Köpprocess ─────────────────────────────────────────────────────────
  {
    id: 'process', icon: '🏁',
    title:   'Köpprocessen — steg för steg',
    summary: 'Från NIE-ansökan till nycklarna i handen, vad som händer och vem som gör vad.',
    content: (
      <>
        <ol>
          <li><strong>Skaffa NIE</strong> (Número de Identificación de Extranjero). Krävs för all ekonomisk aktivitet i Spanien. Ansök på spanska konsulatet i Sverige eller genom advokat på plats. Tar 2–6 veckor.</li>
          <li><strong>Anlita en oberoende advokat</strong> i Spanien — INTE den som mäklaren rekommenderar. Kostar 1–1,5% av köpeskillingen men sparar dig från dolda servitut, obetalda skulder på fastigheten och felaktiga kontrakt.</li>
          <li><strong>Reservationsavtal</strong> (Contrato de reserva): 6 000–10 000 € deposition för att ta objektet av marknaden i 14–30 dagar medan advokaten gör due diligence.</li>
          <li><strong>Köpekontrakt</strong> (Contrato de arras): 10% deposition. Om du backar förlorar du depositionen. Om säljaren backar betalar de tillbaka dubbla.</li>
          <li><strong>Slutförsäljning hos notarie</strong> (Escritura): slutbetalning + alla skatter. Du får nyckeln samma dag. Notarien skickar handlingarna till lagfartsmyndigheten (Registro de la Propiedad).</li>
          <li><strong>Lagfart klar</strong> efter 1–3 månader. Du blir officiellt registrerad ägare.</li>
        </ol>
        <p style={{ marginTop: '12px' }}><strong>Total tid:</strong> 2–4 månader från reservation till nycklarna.</p>
      </>
    ),
  },

  // ── 2. Kostnader vid köp ──────────────────────────────────────────────────
  {
    id: 'buying-costs', icon: '💸',
    title:   'Kostnader vid köp — ~12% utöver priset',
    summary: 'ITP, notarie, lagfart, advokat — vad det egentligen kostar att köpa.',
    content: (
      <>
        <p>Räkna med ungefär <strong>10–13% utöver köpeskillingen</strong> i köpkostnader. Fördelat:</p>
        <table className="md-table">
          <thead><tr><th>Post</th><th>Andrahandsobjekt</th><th>Nybyggt</th></tr></thead>
          <tbody>
            <tr><td><strong>ITP / IVA + AJD</strong></td><td>{pct(BUYING_COSTS.TRANSFER_TAX_PCT)} (ITP)</td><td>{pct(BUYING_COSTS.VAT_NEW_BUILD_PCT)} IVA + {pct(BUYING_COSTS.STAMP_DUTY_PCT)} AJD</td></tr>
            <tr><td>Notarie</td><td colSpan={2}>{pct(BUYING_COSTS.NOTARY_PCT)}</td></tr>
            <tr><td>Lagfart</td><td colSpan={2}>{pct(BUYING_COSTS.LAND_REGISTRY_PCT)}</td></tr>
            <tr><td>Advokat</td><td colSpan={2}>{pct(BUYING_COSTS.LAWYER_PCT)}</td></tr>
            <tr><td>Gestor + admin</td><td colSpan={2}>≈€{BUYING_COSTS.ADMIN_FEE_EUR}</td></tr>
          </tbody>
        </table>
        <p style={{ marginTop: '12px' }}>
          <strong>Exempel — andrahandslägenhet 500 000 €:</strong> ITP 35 000 + notarie 2 500 + lagfart 5 000 + advokat 7 500 + admin 500 = <strong>~50 500 €</strong> (10,1%).
        </p>
        <p><strong>Nybyggt 500 000 €:</strong> IVA 50 000 + AJD 6 000 + övrigt = <strong>~71 000 €</strong> (14,2%). Nybyggt kostar mer eftersom IVA är högre.</p>
        <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-mute)' }}>
          📍 Andalusien sänkte ITP från 8% till 7% under 2021 — en av Spaniens lägsta. Detta är en konkurrensfördel jämfört med Madrid (6%) och Katalonien (10–11%).
        </p>
      </>
    ),
  },

  // ── 3. Löpande skatter ────────────────────────────────────────────────────
  {
    id: 'recurring-tax', icon: '📋',
    title:   'Löpande skatter & avgifter',
    summary: 'IBI, basura, communidad, IRNR — vad du betalar varje år som ägare.',
    content: (
      <>
        <h4>Som ägare (oavsett om du hyr ut):</h4>
        <ul>
          <li><strong>IBI</strong> — kommunal fastighetsskatt, 0,4–1,3% av "valor catastral". Typiskt 800–1 500 €/år för €500k lägenhet.</li>
          <li><strong>Basura</strong> — sophämtning, 100–250 €/år.</li>
          <li><strong>Communidad</strong> — föreningsavgift. Vanlig lägenhet 1 500–3 500 €/år, lyx med pool/concierge 5 000–10 000 €/år.</li>
          <li><strong>Hemförsäkring</strong> — 400–1 200 €/år.</li>
        </ul>
        <h4 style={{ marginTop: '16px' }}>Om du INTE hyr ut men äger som non-resident:</h4>
        <ul>
          <li><strong>IRNR "imputerad inkomst"</strong> — Spanien anser att du har en fiktiv inkomst på 1,1–2% av taxeringsvärdet. Du betalar {pct(TAX.IRNR_EU_PCT)} skatt på det beloppet (EU-bosatt). Modelo 210 lämnas årligen.</li>
          <li>Exempel: Taxeringsvärde 250 000 € × 1,1% × 19% = <strong>~520 €/år</strong> bara för att äga.</li>
        </ul>
        <h4 style={{ marginTop: '16px' }}>Om du hyr ut:</h4>
        <ul>
          <li><strong>IRNR på hyresinkomst</strong> — {pct(TAX.IRNR_EU_PCT)} på nettoinkomst (efter avdrag). Modelo 210 kvartalsvis.</li>
          <li>Icke-EU-bosatta betalar {pct(TAX.IRNR_NON_EU_PCT)} <strong>utan avdragsrätt</strong> — viktigt att vara EU-bosatt.</li>
        </ul>
      </>
    ),
  },

  // ── 4. VFT-licens ─────────────────────────────────────────────────────────
  {
    id: 'vft', icon: '📜',
    title:   'VFT-licens — kritiskt för korttidsuthyrning',
    summary: 'Andalusiens system för turisthyra. Utan licens — ingen Airbnb.',
    content: (
      <>
        <p><strong>VFT</strong> = Vivienda con Fines Turísticos. Krävs för all uthyrning under 2 månader till turister i Andalusien (Junta de Andalucía Decreto 28/2016).</p>
        <h4>Vad som krävs för att få licens:</h4>
        <ul>
          <li>Bygglov + slutbesiktning klar (för off-plan: hela projektet)</li>
          <li>Boende uppfyller minimikrav: AC, försäklingar, första hjälpen, etc.</li>
          <li>Cédula de Habitabilidad (boendegodkännande)</li>
          <li>Communidad-stadgarna får INTE förbjuda turisthyra (vanligt sedan 2019)</li>
        </ul>
        <h4 style={{ marginTop: '16px' }}>⚠ Restriktionerna skärps snabbt:</h4>
        <ul>
          <li><strong>Sevilla, Málaga centrum</strong> — stopp för nya licenser i flera stadsdelar 2024–2025</li>
          <li><strong>Marbella</strong> — kommunen utreder tak för antal VFT per byggnad</li>
        </ul>
        <h4 style={{ marginTop: '16px' }}>💡 Tips:</h4>
        <ul>
          <li><strong>Köp objekt med befintlig VFT</strong> om du ska hyra korttid — licensen följer fastigheten</li>
          <li><strong>Off-plan?</strong> Säkerställ skriftligt med utvecklaren att VFT är möjlig och påbörja ansökan så snart Cédula är klar</li>
          <li><strong>Communidad-protokoll</strong> — kontrollera senaste 5 årens beslut. Om 60% röstat för förbud är det bindande</li>
        </ul>
      </>
    ),
  },

  // ── 5. Modelo 210 ─────────────────────────────────────────────────────────
  {
    id: 'modelo-210', icon: '🧾',
    title:   'Modelo 210 — skattedeklarationen',
    summary: 'Hur du deklarerar i Spanien som non-resident. Kvartalsvis eller årligen.',
    content: (
      <>
        <p><strong>Modelo 210</strong> är non-residents-deklarationen som alla utländska fastighetsägare i Spanien måste lämna.</p>
        <h4>När?</h4>
        <ul>
          <li><strong>Kvartalsvis</strong> om du hyr ut: 1–20 april, 1–20 juli, 1–20 oktober, 1–20 januari</li>
          <li><strong>Årligen</strong> om du bara äger (imputerad inkomst): senast 31 december</li>
        </ul>
        <h4 style={{ marginTop: '16px' }}>Avdragsgilla kostnader (EU-bosatt):</h4>
        <ul>
          <li>IBI (proportionerligt mot uthyrningsperiod)</li>
          <li>Communidad-avgift, försäkring, basura</li>
          <li>Räntor på bolån (proportionerligt)</li>
          <li>Avskrivning på byggnaden (3% av byggnadsvärdet exkl. mark)</li>
          <li>Reparationer & underhåll, förvaltning, städning, marknadsföring, gestor</li>
        </ul>
        <p style={{ marginTop: '12px' }}>
          <strong>💡 Anlita en gestor</strong> (≈1 000–1 500 €/år). De lämnar Modelo 210 åt dig.
        </p>
        <h4 style={{ marginTop: '16px' }}>I Sverige måste du också deklarera:</h4>
        <ul>
          <li>Hyresinkomsten i K4/K7</li>
          <li><strong>Dubbelbeskattningsavtalet</strong> Sverige-Spanien gör att du får avräkna spansk skatt mot svensk — du betalar inte dubbelt, men du betalar minst den högre satsen</li>
        </ul>
      </>
    ),
  },

  // ── 6. Off-plan ───────────────────────────────────────────────────────────
  {
    id: 'off-plan', icon: '🏗',
    title:   'Off-plan-köp — risker och möjligheter',
    summary: 'Betalningsplaner, bankgarantier, leveransrisk, värdeökning.',
    content: (
      <>
        <p>Off-plan = köp innan byggnaden är färdig. Vanligt på Costa del Sol där hela utvecklingsområden säljs på pappret.</p>
        <h4>Typisk betalningsplan:</h4>
        <ul>
          <li><strong>Reservation:</strong> 6 000–10 000 €</li>
          <li><strong>Privat kontrakt:</strong> 20–30%</li>
          <li><strong>Milstolpar under byggnation:</strong> 10–20% per etapp (2–4 etapper)</li>
          <li><strong>Slutbetalning:</strong> 30–50% vid leverans</li>
        </ul>
        <h4 style={{ marginTop: '16px' }}>⚠ Risker:</h4>
        <ul>
          <li><strong>Förseningar</strong> — vanligt 6–18 månader. Kontraktet ska ange straffavgift om utvecklaren är för sen</li>
          <li><strong>Konkurs hos utvecklaren</strong> — skydda dig med <strong>bankgaranti (Ley 57/68)</strong>. Acceptera ALDRIG köp utan</li>
          <li><strong>Inga intäkter under 2–4 år</strong> — du har kapital låst utan cashflow</li>
        </ul>
        <h4 style={{ marginTop: '16px' }}>✅ Fördelar:</h4>
        <ul>
          <li>Pris vid lansering ofta 10–20% under marknadsvärde vid leverans</li>
          <li>Möjlighet att välja layout, finish, lägenhet</li>
          <li>Allt är nytt — låga underhållskostnader första åren</li>
          <li>10 års byggnadsgaranti enligt LOE</li>
        </ul>
      </>
    ),
  },

  // ── 7. Bolån för utländska ────────────────────────────────────────────────
  {
    id: 'mortgage', icon: '🏦',
    title:   'Bolån för utländska köpare',
    summary: 'Vad spanska banker erbjuder, kontantinsats, dokumentkrav.',
    content: (
      <>
        <h4>Vad du normalt får som utländsk:</h4>
        <ul>
          <li><strong>LTV:</strong> 60–70%. EU-bosatt får ofta 70%, non-EU 60%</li>
          <li><strong>Löptid:</strong> 20–30 år, slutar vanligtvis vid 70-75 års ålder</li>
          <li><strong>Ränta:</strong> Euribor + marginal (1,5–2,5%)</li>
        </ul>
        <h4 style={{ marginTop: '16px' }}>Dokument banken vill se:</h4>
        <ul>
          <li>NIE, senaste 3 lönespecifikationer, senaste deklaration</li>
          <li>Kontoutdrag senaste 6 månader, anställningsbevis</li>
        </ul>
        <h4 style={{ marginTop: '16px' }}>💡 Tips:</h4>
        <ul>
          <li><strong>Förhandsbesked</strong> innan du köper — annars kan finansieringen falla och du förlorar arras-depositionen</li>
          <li><strong>Jämför 3–4 banker</strong> — Sabadell, BBVA, Santander, ING brukar vara mest öppna</li>
          <li><strong>Mortgage broker</strong> kan vara värt en fee för bättre villkor</li>
        </ul>
      </>
    ),
  },

  // ── 8. Skillnader mot Sverige ─────────────────────────────────────────────
  {
    id: 'sweden-vs-spain', icon: '🇸🇪',
    title:   'Skillnader mot svensk fastighetsmarknad',
    summary: 'Vad som funkar annorlunda och vad du inte ska anta från Sverige.',
    content: (
      <>
        <table className="md-table">
          <thead><tr><th></th><th>Sverige</th><th>Spanien</th></tr></thead>
          <tbody>
            <tr><td><strong>Ägandeform</strong></td><td>Bostadsrätt (förening äger)</td><td>Direktägd freehold</td></tr>
            <tr><td><strong>Köpkostnader</strong></td><td>~1,5%</td><td>~10–13%</td></tr>
            <tr><td><strong>Reavinstskatt</strong></td><td>22%</td><td>{pct(TAX.CAPITAL_GAINS_PCT)}</td></tr>
            <tr><td><strong>Skatt på hyresvinst</strong></td><td>30% kapital</td><td>{pct(TAX.IRNR_EU_PCT)} på netto</td></tr>
            <tr><td><strong>Andrahandsuthyrning</strong></td><td>Föreningens tillstånd</td><td>Egen rätt om VFT finns</td></tr>
            <tr><td><strong>Säljprocess</strong></td><td>Budgivning vanligt</td><td>Förhandling — 5–15% under utgångspris normalt</td></tr>
          </tbody>
        </table>
        <p style={{ marginTop: '12px' }}>
          <strong>Mentalt skifte:</strong> I Sverige förlitar du dig på regelverk. I Spanien förlitar du dig på <strong>din advokat och din due diligence</strong>.
        </p>
      </>
    ),
  },

  // ── 9. Fallgropar ─────────────────────────────────────────────────────────
  {
    id: 'pitfalls', icon: '⚠️',
    title:   'Vanliga fallgropar att undvika',
    summary: 'Dyra misstag som lätt görs av första-gångs-köpare.',
    content: (
      <ul>
        <li><strong>Mäklarens "rekommenderade advokat"</strong> — har ofta provisionsavtal med mäklaren. Anlita oberoende.</li>
        <li><strong>Köp utan Nota Simple</strong> — kolla att fastigheten är skuldfri (inga embargos, hypotek, IBI-skulder).</li>
        <li><strong>Förbise communidad-protokoll</strong> — planerade renoveringar kan kosta 5 000–20 000 € per ägare.</li>
        <li><strong>Anta att Cédula finns</strong> — utan giltigt boendegodkännande får du inte ansluta el/vatten i ditt namn.</li>
        <li><strong>Glöm "imputerad inkomst"</strong> — Modelo 210 ska lämnas även de år du inte hyr ut.</li>
        <li><strong>Underskatta löpande kostnader</strong> — communidad + IBI + försäkring + gestor + underhåll = lätt 6 000–10 000 €/år.</li>
        <li><strong>Inga reserver för räntehöjningar</strong> — stresstest din kalkyl med +2% ränta.</li>
        <li><strong>Glömt skatta i Sverige</strong> — Skatteverket får data via informationsutbyten med Spanien sedan 2017.</li>
      </ul>
    ),
  },

  // ── 10. Tips & best practices ─────────────────────────────────────────────
  {
    id: 'tips', icon: '💡',
    title:   'Tips & best practices',
    summary: 'Saker som de erfarna gör — och nybörjare missar.',
    content: (
      <>
        <h4>Före köp:</h4>
        <ul>
          <li>Hyr först — bo några veckor i området innan du köper</li>
          <li>Bestäm syfte FÖRST: lyxsemester / korttidsuthyrning / långtidshyra / kapitalplacering</li>
          <li>Skaffa NIE direkt — sparar 4 veckor när rätt objekt dyker upp</li>
        </ul>
        <h4 style={{ marginTop: '16px' }}>Under förhandling:</h4>
        <ul>
          <li>Bud 10–15% under utgångspris är förväntat på Costa del Sol</li>
          <li>Be om kompletta utgiftshistorik (IBI, communidad, el/vatten) för senaste 3 åren</li>
        </ul>
        <h4 style={{ marginTop: '16px' }}>Som ägare:</h4>
        <ul>
          <li>Använd förvaltningsbolag de första 12 månaderna</li>
          <li>Sätt upp autogiro för IBI, basura, communidad</li>
          <li>Behåll <strong>alla kvitton digitalt</strong> — kan kvittas mot hyresinkomst på Modelo 210</li>
        </ul>
        <h4 style={{ marginTop: '16px' }}>Vid utbyggnad av portfölj:</h4>
        <ul>
          <li>Andra köpet kan finansieras med belåning av det första</li>
          <li>Diversifiera område + segment</li>
          <li>Överväg spanska SL-bolag vid 3+ objekt</li>
        </ul>
      </>
    ),
  },

  // ── 11. Sambo / gemensamt ägande ──────────────────────────────────────────
  {
    id: 'co-ownership', icon: '👫',
    title:   'Sambo, äktenskap & gemensamt ägande',
    summary: 'Skuldebrev, ojämn andel, framtida giftermål, spanska arvsregler för par.',
    content: (
      <>
        <p>
          Om ni köper tillsammans finns det <strong>ingen automatisk samäganderätt i Spanien</strong> — det är vad som står på <strong>Escritura</strong> som gäller, oavsett er status i Sverige.
        </p>
        <h4>Sambo (ej gift):</h4>
        <ul>
          <li><strong>Båda måste stå på Escritura</strong> om ni vill samäga. Andelarna anges där (t.ex. 90/10, 50/50).</li>
          <li><strong>Sambolagen i Sverige gäller INTE i Spanien.</strong></li>
        </ul>
        <h4 style={{ marginTop: '16px' }}>Ojämn andel via skuldebrev — vanlig lösning:</h4>
        <ol>
          <li><strong>Registrera 90/10 på Escritura</strong> — enklast juridiskt</li>
          <li><strong>Registrera 100/0 + skuldebrev</strong> — den som äger 100% utfärdar skuldebrev. Vanligt mellan sambor som planerar gifta sig</li>
        </ol>
        <h4 style={{ marginTop: '16px' }}>Vid dödsfall:</h4>
        <ul>
          <li><strong>Spansk arvslag gäller för spanska fastigheter</strong> — skriv ett spanskt testamente hos notarie (~80–150 €)</li>
          <li>För sambor: utan testamente kan sambon bli helt utesluten från arvet</li>
        </ul>
        <p style={{ marginTop: '16px', padding: '12px', background: 'var(--surface-2)', borderRadius: '6px', fontSize: '13px', color: 'var(--text-mute)' }}>
          ⚠ Anlita en svensk familjerättsadvokat OCH en spansk advokat. Kostnaden är försumbar mot risken att hamna i en juridisk tvist.
        </p>
      </>
    ),
  },

  // ── 12. Costa del Sol-specifikt ───────────────────────────────────────────
  {
    id: 'costa-del-sol', icon: '☀️',
    title:   'Costa del Sol — områdesguide',
    summary: 'Marbella, Estepona, Málaga, Cancelada — vad varje område är bra för.',
    content: (
      <>
        <h4>Marbella & Golden Mile</h4>
        <p>Premium (€8 000–15 000/m²). Stark internationell efterfrågan, hög ADR (€350–600), beläggning 60–75%.</p>
        <h4 style={{ marginTop: '16px' }}>Estepona — Gamla stan</h4>
        <p>Boom-område senaste 5 åren. €3 500–5 000/m² men stigande. Bra för medellång-budget med tillväxtpotential.</p>
        <h4 style={{ marginTop: '16px' }}>New Golden Mile (Estepona East)</h4>
        <p>Mellan Marbella och Estepona. €4 000–7 000/m². Snabbt växande men testa din specifika utvecklare noga.</p>
        <h4 style={{ marginTop: '16px' }}>Cancelada / Selwo</h4>
        <p>€3 800–5 500/m². Lugnt, bra för korttidsuthyrning till familjer.</p>
        <h4 style={{ marginTop: '16px' }}>Málaga centrum / Soho</h4>
        <p>€3 500–5 500/m². ⚠ VFT-stopp i flera stadsdelar 2024 — kolla noga innan köp för korttid.</p>
        <h4 style={{ marginTop: '16px' }}>Fuengirola / Benalmádena</h4>
        <p>€2 500–4 000/m². Volymorienterad korttidsmarknad, lägre marginal men låg ingång.</p>
      </>
    ),
  },
];
