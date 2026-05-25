import { useState, ReactNode } from 'react';
import { Card, SectionHeader } from '../ui';
import { TAX, BUYING_COSTS } from '../../constants/tax';
import '../../styles/pages.css';

// ── Sektioner med innehåll ────────────────────────────────────────────────────
interface GuideSection {
  id:       string;
  icon:     string;
  title:    string;
  summary:  string;
  content:  ReactNode;
}

const pct = (n: number) => (n * 100).toFixed(n < 0.1 ? 1 : 0) + '%';

const SECTIONS: GuideSection[] = [
  // ── 1. Köpprocess ─────────────────────────────────────────────────────────
  {
    id: 'process',
    icon: '🏁',
    title: 'Köpprocessen — steg för steg',
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
        <p style={{ marginTop: '12px' }}>
          <strong>Total tid:</strong> 2–4 månader från reservation till nycklarna.
        </p>
      </>
    ),
  },

  // ── 2. Kostnader vid köp ──────────────────────────────────────────────────
  {
    id: 'buying-costs',
    icon: '💸',
    title: 'Kostnader vid köp — ~12% utöver priset',
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
        <p>
          <strong>Nybyggt 500 000 €:</strong> IVA 50 000 + AJD 6 000 + övrigt = <strong>~71 000 €</strong> (14,2%). Nybyggt kostar mer eftersom IVA är högre.
        </p>
        <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-mute)' }}>
          📍 Andalusien sänkte ITP från 8% till 7% under 2021 — en av Spaniens lägsta. Detta är en konkurrensfördel jämfört med Madrid (6%) och Katalonien (10–11%).
        </p>
      </>
    ),
  },

  // ── 3. Löpande skatter ────────────────────────────────────────────────────
  {
    id: 'recurring-tax',
    icon: '📋',
    title: 'Löpande skatter & avgifter',
    summary: 'IBI, basura, communidad, IRNR — vad du betalar varje år som ägare.',
    content: (
      <>
        <h4>Som ägare (oavsett om du hyr ut):</h4>
        <ul>
          <li><strong>IBI</strong> (Impuesto sobre Bienes Inmuebles) — kommunal fastighetsskatt, 0,4–1,3% av "valor catastral" (taxeringsvärdet, oftast 40–60% av marknadsvärdet). För en €500k lägenhet typiskt 800–1 500 €/år.</li>
          <li><strong>Basura</strong> — sophämtning, 100–250 €/år.</li>
          <li><strong>Communidad</strong> — föreningsavgift, varierar enormt. Vanlig lägenhet 1 500–3 500 €/år, lyx med pool/concierge 5 000–10 000 €/år.</li>
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
    id: 'vft',
    icon: '📜',
    title: 'VFT-licens — kritiskt för korttidsuthyrning',
    summary: 'Andalusiens system för turisthyra. Utan licens — ingen Airbnb.',
    content: (
      <>
        <p>
          <strong>VFT</strong> = Vivienda con Fines Turísticos. Krävs för all uthyrning under 2 månader till turister i Andalusien (Junta de Andalucía Decreto 28/2016).
        </p>
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
          <li><strong>Madrid + Barcelona</strong> — har redan stränga begränsningar (Andalusien följer trenden)</li>
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
    id: 'modelo-210',
    icon: '🧾',
    title: 'Modelo 210 — skattedeklarationen',
    summary: 'Hur du deklarerar i Spanien som non-resident. Kvartalsvis eller årligen.',
    content: (
      <>
        <p>
          <strong>Modelo 210</strong> är non-residents-deklarationen som alla utländska fastighetsägare i Spanien måste lämna.
        </p>

        <h4>När?</h4>
        <ul>
          <li><strong>Kvartalsvis</strong> om du hyr ut: 1–20 april, 1–20 juli, 1–20 oktober, 1–20 januari (för respektive kvartal)</li>
          <li><strong>Årligen</strong> om du bara äger (imputerad inkomst): senast 31 december för året innan</li>
        </ul>

        <h4 style={{ marginTop: '16px' }}>Avdragsgilla kostnader (EU-bosatt):</h4>
        <ul>
          <li>IBI (proportionerligt mot uthyrningsperiod)</li>
          <li>Communidad-avgift, försäkring, basura</li>
          <li>Räntor på bolån (proportionerligt)</li>
          <li>Avskrivning på byggnaden (3% av byggnadsvärdet exkl. mark)</li>
          <li>Reparationer & underhåll</li>
          <li>Förvaltning, städning, marknadsföring</li>
          <li>Gestor, advokat, revisorsfee</li>
        </ul>

        <p style={{ marginTop: '12px' }}>
          <strong>💡 Anlita en gestor</strong> (typ revisor light, ≈1 000–1 500 €/år). De lämnar Modelo 210 åt dig och säkerställer att du inte missar deadlines. Värt varenda krona.
        </p>

        <h4 style={{ marginTop: '16px' }}>I Sverige måste du också deklarera:</h4>
        <ul>
          <li>Hyresinkomsten i K4/K7 (kapitalinkomst eller näringsverksamhet beroende på omfattning)</li>
          <li><strong>Dubbelbeskattningsavtalet</strong> Sverige-Spanien gör att du får avräkna spansk skatt mot svensk — du betalar inte dubbelt, men du betalar minst den högre satsen</li>
        </ul>
      </>
    ),
  },

  // ── 6. Off-plan ───────────────────────────────────────────────────────────
  {
    id: 'off-plan',
    icon: '🏗',
    title: 'Off-plan-köp — risker och möjligheter',
    summary: 'Betalningsplaner, bankgarantier, leveransrisk, värdeökning.',
    content: (
      <>
        <p>
          Off-plan = köp innan byggnaden är färdig. Vanligt på Costa del Sol där hela utvecklingsområden säljs på pappret.
        </p>

        <h4>Typisk betalningsplan:</h4>
        <ul>
          <li><strong>Reservation:</strong> 6 000–10 000 €</li>
          <li><strong>Privat kontrakt:</strong> 20–30% av priset</li>
          <li><strong>Milstolpar under byggnation:</strong> 10–20% per etapp (2–4 etapper)</li>
          <li><strong>Slutbetalning:</strong> 30–50% vid leverans / Escritura</li>
        </ul>

        <h4 style={{ marginTop: '16px' }}>⚠ Risker att förstå:</h4>
        <ul>
          <li><strong>Förseningar</strong> — vanligt att projekt försenas 6–18 månader. Kontraktet ska ange straffavgift om utvecklaren är för sen</li>
          <li><strong>Konkurs hos utvecklaren</strong> — händer. Skydda dig med <strong>bankgaranti (Ley 57/68)</strong>. Detta är OBLIGATORISKT — utvecklaren MÅSTE ge dig en avalbankgaranti eller försäkring för alla delbetalningar. Acceptera ALDRIG att köpa utan</li>
          <li><strong>Värdet kan ändras</strong> — på en svag marknad är leveranspriset lägre än vad du betalat</li>
          <li><strong>Inga intäkter under 2–4 år</strong> — du har kapital låst utan cashflow</li>
        </ul>

        <h4 style={{ marginTop: '16px' }}>✅ Fördelar när det går bra:</h4>
        <ul>
          <li>Pris vid lansering ofta 10–20% under marknadsvärde vid leverans</li>
          <li>Möjlighet att välja layout, finish, lägenhet i projektet</li>
          <li>Allt är nytt — låga underhållskostnader första åren</li>
          <li>10 års byggnadsgaranti enligt LOE (Ley de Ordenación de la Edificación)</li>
        </ul>
      </>
    ),
  },

  // ── 7. Bolån för utländska ────────────────────────────────────────────────
  {
    id: 'mortgage',
    icon: '🏦',
    title: 'Bolån för utländska köpare',
    summary: 'Vad spanska banker erbjuder, kontantinsats, dokumentkrav.',
    content: (
      <>
        <h4>Vad du normalt får som utländsk:</h4>
        <ul>
          <li><strong>LTV (belåningsgrad):</strong> 60–70% av lägsta värdet av (köpeskilling, bankens värdering). EU-bosatt får ofta 70%, non-EU 60%</li>
          <li><strong>Löptid:</strong> 20–30 år, slutar vanligtvis vid 70-75 års ålder</li>
          <li><strong>Ränta:</strong> Spanska bolån är ofta knutna till Euribor + marginal (1,5–2,5%). Fast ränta finns men kostar mer</li>
          <li><strong>Amortering:</strong> Annuitet är standard — konstant månadsbetalning</li>
        </ul>

        <h4 style={{ marginTop: '16px' }}>Dokument banken vill se:</h4>
        <ul>
          <li>NIE</li>
          <li>Senaste 3 lönespecifikationer + senaste deklaration (från Sverige)</li>
          <li>Kontoutdrag senaste 6 månader</li>
          <li>Eventuella andra fastigheter, lån, tillgångar</li>
          <li>Anställningsbevis</li>
        </ul>

        <h4 style={{ marginTop: '16px' }}>💡 Tips:</h4>
        <ul>
          <li><strong>Förhandsbesked</strong> innan du köper — annars kan finansieringen falla och du förlorar arras-depositionen</li>
          <li><strong>Jämför 3–4 banker</strong> — Sabadell, BBVA, Santander, ING brukar vara mest öppna för utländska kunder. Räntespreaden kan vara 0,5–1% mellan dem</li>
          <li><strong>Mortgage broker</strong> kan vara värt en fee — de har redan etablerade relationer och kan förhandla bättre villkor</li>
          <li><strong>SEPA-överföringar</strong> — sätt upp ett spanskt konto direkt så kan månadsbetalningarna gå därifrån</li>
        </ul>
      </>
    ),
  },

  // ── 8. Skillnader mot Sverige ─────────────────────────────────────────────
  {
    id: 'sweden-vs-spain',
    icon: '🇸🇪',
    title: 'Skillnader mot svensk fastighetsmarknad',
    summary: 'Vad som funkar annorlunda och vad du inte ska anta från Sverige.',
    content: (
      <>
        <table className="md-table">
          <thead>
            <tr><th></th><th>Sverige</th><th>Spanien</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>Ägandeform</strong></td><td>Bostadsrätt (förening äger)</td><td>Direktägd freehold (du äger fastigheten)</td></tr>
            <tr><td><strong>Köpkostnader</strong></td><td>~1,5% (mäklare betalar oftast lagfart)</td><td>~10–13%</td></tr>
            <tr><td><strong>Reavinstskatt</strong></td><td>22% (för privatperson)</td><td>{pct(TAX.CAPITAL_GAINS_PCT)}</td></tr>
            <tr><td><strong>Skatt på hyresvinst</strong></td><td>30% kapital (efter schablonavdrag 40 000 kr)</td><td>{pct(TAX.IRNR_EU_PCT)} på netto (EU-bosatt)</td></tr>
            <tr><td><strong>Föreningsavgift</strong></td><td>Allt-i-ett: lån, underhåll, värme</td><td>Bara löpande underhåll (inga föreningslån)</td></tr>
            <tr><td><strong>Andrahandsuthyrning</strong></td><td>Föreningens tillstånd, ofta motvilligt</td><td>Egen rätt — om VFT finns</td></tr>
            <tr><td><strong>Bostadsbrist</strong></td><td>Strukturell (Stockholm/Göteborg)</td><td>Säsongsbaserad (sommarpeak)</td></tr>
            <tr><td><strong>Säljprocess</strong></td><td>Budgivning vanligt</td><td>Förhandling — 5–15% under utgångspris är normalt</td></tr>
            <tr><td><strong>Mäklarens roll</strong></td><td>Säljarens representant, neutral i förhandling</td><td>Inget formellt ansvar mot köpare — anlita ALLTID egen advokat</td></tr>
          </tbody>
        </table>
        <p style={{ marginTop: '12px' }}>
          <strong>Mentalt skifte:</strong> I Sverige förlitar du dig på regelverk (bostadsrättslagen, mäklarlagen). I Spanien förlitar du dig på <strong>din advokat och din due diligence</strong>. Det finns färre skyddsnät — men också mer frihet och lägre transaktionsfriktion vid uthyrning.
        </p>
      </>
    ),
  },

  // ── 9. Fallgropar ─────────────────────────────────────────────────────────
  {
    id: 'pitfalls',
    icon: '⚠️',
    title: 'Vanliga fallgropar att undvika',
    summary: 'Dyra misstag som lätt görs av första-gångs-köpare.',
    content: (
      <ul>
        <li><strong>Mäklarens "rekommenderade advokat"</strong> — har ofta provisionsavtal med mäklaren. Anlita oberoende.</li>
        <li><strong>Köp utan Nota Simple</strong> — kolla att fastigheten är skuldfri (inga embargos, hypotek, IBI-skulder). Detta görs av advokaten innan kontrakt.</li>
        <li><strong>Förbise communidad-protokoll</strong> — det kan finnas planerade renoveringar (fasad, tak, pool) som kostar 5 000–20 000 € per ägare nästa år.</li>
        <li><strong>Anta att Cédula finns</strong> — utan giltigt boendegodkännande får du inte ansluta el/vatten i ditt namn. Kontrollera.</li>
        <li><strong>Olicensierad utvecklare (off-plan)</strong> — kolla att de har Licencia de Obra och bankgaranti. Två projekt har failat på Costa del Sol senaste 5 åren med stora förluster för köpare.</li>
        <li><strong>Glöm "imputerad inkomst"</strong> — Modelo 210 ska lämnas även de år du inte hyr ut. Skatteverket i Spanien skickar inga påminnelser — du måste själv komma ihåg.</li>
        <li><strong>Underskatta löpande kostnader</strong> — communidad + IBI + försäkring + gestor + underhåll = lätt 6 000–10 000 €/år innan något hyrs ut.</li>
        <li><strong>Inga reserver för räntehöjningar</strong> — Euribor-knutna bolån kan röra sig snabbt. Stresstest din kalkyl med +2% ränta.</li>
        <li><strong>Olicensierad rörmokare / elektriker</strong> — använd alltid någon med faktura. Försäkringen täcker inte annars.</li>
        <li><strong>Glömt skatta i Sverige</strong> — Skatteverket i Sverige får data via informationsutbyten med Spanien sedan 2017. Slarvar du upptäcks det.</li>
      </ul>
    ),
  },

  // ── 10. Tips & best practices ─────────────────────────────────────────────
  {
    id: 'tips',
    icon: '💡',
    title: 'Tips & best practices',
    summary: 'Saker som de erfarna gör — och nybörjare missar.',
    content: (
      <>
        <h4>Före köp:</h4>
        <ul>
          <li>Hyr först — bo några veckor i området innan du köper. Stadsdelar känns olika på vintern vs sommar</li>
          <li>Bestäm syfte FÖRST: lyxsemester / korttidsuthyrning / långtidshyra / kapitalplacering. Olika syften ger olika optimala objekt</li>
          <li>Skaffa NIE direkt — sparar 4 veckor när rätt objekt dyker upp</li>
        </ul>

        <h4 style={{ marginTop: '16px' }}>Under förhandling:</h4>
        <ul>
          <li>Bud 10–15% under utgångspris är förväntat på Costa del Sol — sällan kontrat hårt</li>
          <li>Be om kompletta utgiftshistorik (IBI, communidad, el/vatten) för senaste 3 åren</li>
          <li>Kräv att alla rörliga föremål specifieras i Inventario (möbler ingår oftast i pris för möblerat)</li>
        </ul>

        <h4 style={{ marginTop: '16px' }}>Som ägare:</h4>
        <ul>
          <li>Använd förvaltningsbolag de första 12 månaderna — du kommer lära dig hur allt funkar utan att brännas</li>
          <li>Sätt upp autogiro för IBI, basura, communidad — annars riskerar du att glömma och få inkasso</li>
          <li>Behåll <strong>alla kvitton digitalt</strong> — kan kvittas mot hyresinkomst på Modelo 210 (EU-bosatt). Använd appens kostnadsregistrering</li>
          <li>Försäkring: säkerställ att den täcker turisthyra om du gör korttidsuthyrning — vanlig hemförsäkring gör det inte alltid</li>
        </ul>

        <h4 style={{ marginTop: '16px' }}>Vid utbyggnad av portfölj:</h4>
        <ul>
          <li>Andra köpet kan finansieras med belåning av det första (om värdet stigit och första lånet amorterats)</li>
          <li>Diversifiera område + segment — t.ex. en korttids i Estepona + en långtids i Málaga centrum</li>
          <li>Överväg spanska SL-bolag (Sociedad Limitada) vid 3+ objekt — bättre skatteoptimering men ökar administration</li>
        </ul>
      </>
    ),
  },

  // ── 11. Sambo / gemensamt ägande ──────────────────────────────────────────
  {
    id: 'co-ownership',
    icon: '👫',
    title: 'Sambo, äktenskap & gemensamt ägande',
    summary: 'Skuldebrev, ojämn andel, framtida giftermål, spanska arvsregler för par.',
    content: (
      <>
        <p>
          Om ni köper tillsammans (sambo, gift, eller partners) finns det <strong>ingen automatisk
          samäganderätt i Spanien</strong> — det är vad som står på <strong>Escritura</strong> (köpehandlingen)
          som gäller, oavsett er status i Sverige.
        </p>

        <h4>Sambo (ej gift) — så funkar det praktiskt</h4>
        <ul>
          <li><strong>Båda måste stå på Escritura</strong> om ni vill samäga. Andelarna anges där (t.ex. 90/10, 50/50). Står bara en av er — den personen är ensam ägare juridiskt.</li>
          <li><strong>Sambolagen i Sverige gäller INTE i Spanien.</strong> Om ni separerar har den som inte står på handlingen ingen rätt till fastigheten — inte ens om båda bidragit ekonomiskt.</li>
          <li><strong>Spansk lag känner "pareja de hecho"</strong> (registrerat samboskap), men registreringen sker per region och ger inte automatisk äganderätt. Det är fortfarande Escritura som styr.</li>
        </ul>

        <h4 style={{ marginTop: '16px' }}>Ojämn andel via skuldebrev — vanlig lösning</h4>
        <p>
          När en part finansierar större delen (säg 90%) och den andra mindre del (10%) finns två vägar:
        </p>
        <ol>
          <li><strong>Registrera 90/10 på Escritura</strong> — enklast juridiskt. Skatter, vinster och förluster fördelas automatiskt enligt andelarna. Men: minderhetspart är "låst" — kan inte sälja sin del separat utan medägarens godkännande</li>
          <li><strong>Registrera 100/0 på Escritura + skuldebrev mellan parterna</strong> — den som äger 100% utfärdar ett skuldebrev till partnern på dennes insats (10% + ev. ränta). Vid försäljning eller separation regleras skulden. Detta är vanligt mellan sambor som planerar gifta sig senare.</li>
        </ol>

        <p style={{ marginTop: '12px' }}>
          <strong>💡 Skuldebrev-lösningen — så gör ni:</strong>
        </p>
        <ul>
          <li>Skuldebrevet skrivs <strong>i Sverige</strong> (svensk lag, svensk valuta), inte i Spanien</li>
          <li>Definiera tydligt: belopp, ränta (kan vara 0%), löptid, vad som händer vid separation/försäljning/dödsfall</li>
          <li>Reglera om beloppet ska indexuppräknas mot fastighetens värde — annars förlorar minderhetsparten på inflation/värdetillväxt</li>
          <li>Bevittna och datera — håller i svensk domstol även utan notarie</li>
          <li><strong>Använd advokat för utformningen</strong> — billigare än att lösa konflikt senare</li>
        </ul>

        <h4 style={{ marginTop: '16px' }}>⚠ Skattemässiga konsekvenser</h4>
        <ul>
          <li>Om bara en står på Escritura: <strong>all hyresinkomst beskattas hos den personen</strong> i både Spanien och Sverige</li>
          <li>Vid försäljning: kapitalvinsten också</li>
          <li>Skuldebrevet räknas som privat skuld — inga skatteeffekter i sig, men räntan måste deklareras om den är &gt;0%</li>
          <li>Om 90/10 på Escritura: båda lämnar Modelo 210 årligen — dubbelt så mycket gestor-arbete</li>
        </ul>

        <h4 style={{ marginTop: '16px' }}>När ni gifter er om 1–2 år</h4>
        <ul>
          <li><strong>Påverkar INTE den befintliga Escrituran automatiskt.</strong> Den som står som ägare förblir ägare.</li>
          <li>Om ni vill ändra andelarna efter äktenskap krävs <strong>gåva eller köp</strong> mellan makarna — båda är skattepliktiga händelser i Spanien (gåvoskatt mellan makar är låg i Andalusien men inte noll)</li>
          <li><strong>Smartast:</strong> bestäm slutgiltig ägarstruktur INNAN köpet och justera vid behov via skuldebrev som regleras vid äktenskap. Då slipper ni gåvoskatt</li>
          <li>Överväg <strong>äktenskapsförord</strong> som specifikt undantar / inkluderar spanska tillgångar — annars gäller svensk giftorättsregel som inte är samma som spansk "régimen económico matrimonial"</li>
        </ul>

        <h4 style={{ marginTop: '16px' }}>Vid dödsfall — viktigt även för unga par</h4>
        <ul>
          <li><strong>Spansk arvslag gäller för spanska fastigheter</strong>, inte svensk — om ni inte aktivt väljer svensk lag i ett spanskt testamente (möjligt sedan EU-förordning 650/2012)</li>
          <li>Spansk lag har <strong>tvångsarv</strong> — barn ärver minst 2/3 av tillgången. Make/maka får mindre del än i Sverige. Sambo: ingenting.</li>
          <li><strong>Lösning:</strong> skriv ett spanskt testamente hos notarie (kostar ~80–150 €) som specificerar svensk lag + dina önskemål. Görs separat från svenskt testamente</li>
          <li>För sambor är detta <strong>absolut kritiskt</strong> — utan testamente kan en sambo bli helt utesluten från arvet trots gemensamt liv</li>
        </ul>

        <h4 style={{ marginTop: '16px' }}>Praktiska tips för er specifika situation (ojämn andel, ej gifta)</h4>
        <ol>
          <li><strong>Bestäm finansieringen tidigt</strong> — vem betalar handpenningen, vem står på bolånet, hur ska driftskostnader fördelas månadsvis</li>
          <li><strong>Skriv skuldebrevet INNAN ni går till notarie</strong> i Spanien — när Escrituran är signerad är pengarna redan flödade</li>
          <li><strong>Båda i Costa Sol-appen som inloggade</strong> — använd `notes`-fält på fastigheten för att markera ägarstruktur, t.ex. "Escritura 100% Peter, skuldebrev 10% till [partner] värt €25 000 + indexuppräkning enligt IPV Málaga"</li>
          <li><strong>Skriv båda testamenten i Spanien</strong> så snart Escrituran är klar</li>
          <li><strong>Om ni planerar gifta er:</strong> diskutera med advokat om timing — i vissa fall är det skattemässigt fördelaktigt att vänta med fastighetsköp tills efter äktenskap (Andalusien har äktenskapsförmåner)</li>
        </ol>

        <p style={{ marginTop: '16px', padding: '12px',
                    background: 'var(--surface-2)', borderRadius: '6px',
                    fontSize: '13px', color: 'var(--text-mute)' }}>
          ⚠ Detta är ett komplext område där svensk och spansk rätt möts. Anlita en svensk familjerättsadvokat
          OCH en spansk advokat — gärna en som är specialiserad på utländska köpare. Kostnaden är försumbar
          mot risken att hamna i en juridisk tvist senare.
        </p>
      </>
    ),
  },

  // ── 12. Costa del Sol-specifikt ───────────────────────────────────────────
  {
    id: 'costa-del-sol',
    icon: '☀️',
    title: 'Costa del Sol — områdesguide',
    summary: 'Marbella, Estepona, Málaga, Cancelada — vad varje område är bra för.',
    content: (
      <>
        <h4>Marbella & Golden Mile</h4>
        <p>Premium-segmentet (€8 000–15 000/m²). Stark internationell efterfrågan, hög ADR (€350–600), beläggning 60–75%. Stabilare värdetillväxt men dyrare ingång. Mycket konkurrens i korttidsuthyrning.</p>

        <h4 style={{ marginTop: '16px' }}>Puerto Banús</h4>
        <p>Yachthamnen — lyxshoppingsegment. €6 000–10 000/m². Hög ADR sommartid men beroende av off-season-uthyrning. Lägenheter med havsutsikt går bäst.</p>

        <h4 style={{ marginTop: '16px' }}>Nueva Andalucía</h4>
        <p>"Golfdalen" — lugnare, familjevänligare. €4 500–7 000/m². Bra för långsiktig värdetillväxt. Många golfbanor + nära Puerto Banús.</p>

        <h4 style={{ marginTop: '16px' }}>Estepona — Gamla stan</h4>
        <p>Boom-område senaste 5 åren. €3 500–5 000/m² men stigande. Charm, autentiskt, mycket nybyggt på gång. Bra för medellång-budget med vill ha tillväxtpotential.</p>

        <h4 style={{ marginTop: '16px' }}>New Golden Mile (Estepona East)</h4>
        <p>Mellan Marbella och Estepona. €4 000–7 000/m². Många nya off-plan-projekt (Essence Residences etc.). Snabbt växande område men test din specifika utvecklare noga.</p>

        <h4 style={{ marginTop: '16px' }}>Cancelada / Selwo</h4>
        <p>Estepona-västra. €3 800–5 500/m². Lugnt, bostadsområden, nära stränder. Bra för korttidsuthyrning till familjer som vill ha pool + nära beach.</p>

        <h4 style={{ marginTop: '16px' }}>Málaga centrum / Soho</h4>
        <p>Kultur, restauranger, året-om-stad. €3 500–5 500/m². ⚠ VFT-stopp i flera stadsdelar 2024 — kolla noga innan köp för korttid. Långtidshyra till studenter / professionals fungerar dock alltid.</p>

        <h4 style={{ marginTop: '16px' }}>Fuengirola / Benalmádena</h4>
        <p>Folkliga, mindre exklusiva. €2 500–4 000/m². Volymorienterad korttidsmarknad, mest brittiska + nordeuropeiska gäster. Lägre marginal men låg ingång.</p>
      </>
    ),
  },
];

// ── Komponent ─────────────────────────────────────────────────────────────────
export function Guide() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set([SECTIONS[0].id]));

  function toggle(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else              next.add(id);
      return next;
    });
  }

  function expandAll()  { setExpandedIds(new Set(SECTIONS.map(s => s.id))); }
  function collapseAll(){ setExpandedIds(new Set()); }

  return (
    <div className="page">
      <div className="page-header">
        <p className="page-eyebrow">Investeringsguide</p>
        <h1 className="page-title">Att investera i fastigheter i Spanien</h1>
        <p className="text-mute" style={{ fontSize: '14px', marginTop: '8px', maxWidth: '720px' }}>
          Praktisk översikt av köpprocess, skatter, regler och fallgropar.
          Fokus på Andalusien & Costa del Sol — där reglerna och kostnaderna ofta avviker från övriga Spanien.
        </p>
      </div>

      {/* Disclaimer */}
      <Card className="card-p" style={{ marginBottom: '20px', background: 'var(--surface-2)', borderLeft: '3px solid var(--gold)' }}>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-mute)' }}>
          ⚠ <strong>Disclaimer:</strong> Detta är allmän information, inte juridisk eller skatterådgivning.
          Anlita alltid spansk advokat och svensk skatterådgivare för din specifika situation. Reglerna ändras —
          dubbelkolla aktuella satser hos AEAT och Junta de Andalucía.
        </p>
      </Card>

      {/* Snabblänkar + expand/collapse */}
      <Card className="card-p" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
          <p className="section-title" style={{ margin: 0 }}>Innehåll</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="filter-pill" onClick={expandAll}>Expandera alla</button>
            <button className="filter-pill" onClick={collapseAll}>Kollapsa alla</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
          {SECTIONS.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={(e) => {
                e.preventDefault();
                if (!expandedIds.has(s.id)) toggle(s.id);
                setTimeout(() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
              }}
              style={{
                padding: '8px 10px', fontSize: '13px', color: 'var(--text)',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '6px', textDecoration: 'none', cursor: 'pointer',
              }}
            >
              {s.icon} {s.title.split(' — ')[0]}
            </a>
          ))}
        </div>
      </Card>

      {/* Sektioner */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {SECTIONS.map(s => {
          const open = expandedIds.has(s.id);
          return (
            <div key={s.id} id={s.id} style={{ scrollMarginTop: '20px' }}>
            <Card className="card-p">
              <div
                style={{ cursor: 'pointer' }}
                onClick={() => toggle(s.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '17px', fontWeight: 600 }}>
                      {s.icon} {s.title}
                    </p>
                    {!open && (
                      <p className="text-mute" style={{ margin: '4px 0 0', fontSize: '13px' }}>
                        {s.summary}
                      </p>
                    )}
                  </div>
                  <span style={{ color: 'var(--text-mute)', fontSize: '14px' }}>
                    {open ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {open && (
                <div className="ai-response" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  {s.content}
                </div>
              )}
            </Card>
            </div>
          );
        })}
      </div>

      <Card className="card-p" style={{ marginTop: '24px' }}>
        <SectionHeader title="Vidare läsning" />
        <ul style={{ fontSize: '14px', lineHeight: 1.8 }}>
          <li><a href="https://www.aeat.es" target="_blank" rel="noopener noreferrer">AEAT — Agencia Tributaria (spanska skatteverket)</a></li>
          <li><a href="https://www.juntadeandalucia.es/organismos/turismoregeneracionjusticiayadministracionlocal/areas/turismo.html" target="_blank" rel="noopener noreferrer">Junta de Andalucía — Turism & VFT-information</a></li>
          <li><a href="https://www.skatteverket.se/privat/internationellt/utlandsinkomster.4.2cf1b5cd163796a5c8b4a35.html" target="_blank" rel="noopener noreferrer">Skatteverket — Inkomster från utlandet</a></li>
          <li>Anlita en gestor lokalt + en svensk skatterådgivare med Spanien-erfarenhet — kombinationen är guld värd</li>
        </ul>
      </Card>
    </div>
  );
}
