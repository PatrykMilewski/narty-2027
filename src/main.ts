import { rows } from './data.js';
type Row = typeof rows[number];
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const money = (v: number) => new Intl.NumberFormat('pl-PL', {maximumFractionDigits: 0}).format(v) + ' zł';
const escape = (v: string | number) => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const filters: Record<string, string> = {mode:'flight', region:'all', month:'all', agency:'all', sort:'price'};
const fuelPerPerson = 1782 * 2 * 7 / 100 * 7.5 / 3;
const base: Record<string, number> = {'16–23.01.2027':1950*4.3/4,'23–30.01.2027':2210*4.3/4,'06–13.02.2027':2907*4.3/4,'06–13.03.2027':2648*4.3/4};
const ses = (r: Row) => /Sestriere|Vialattea/.test(r[0]);
const value = (id: string) => filters[id];
function cost(r: Row): number | null {
  if (filters.mode === 'flight') return r[3];
  const lodging = r[4] || base[r[1]];
  if (!ses(r)) return typeof lodging === 'number' ? lodging : null;
  return lodging ? lodging + fuelPerPerson : null;
}
function selected(r: Row) {
  const region = value('region'), agency = value('agency');
  return (region === 'all' || (region === 'sestriere' ? ses(r) : region === 'verbier' ? r[0].includes('Verbier') : r[0].includes('Doliny')))
    && (value('month') === 'all' || r[1].split('.')[1] === value('month'))
    && (agency === 'all' || (agency === 'self') === (r[2] === 'Samodzielnie'));
}
function sortKey(r: Row) {
  if (value('sort') === 'price') return cost(r) ?? Infinity;
  if (value('sort') === 'time') return parseFloat(String(filters.mode === 'flight' ? r[5] : ses(r) ? 18 + 17/60 : r[6]));
  return Number(r[1].split('.')[1])*100 + parseInt(r[1]);
}
function pricingNote(r: Row) {
  if (filters.mode === 'flight') return 'cena od';
  return ses(r) ? 'z paliwem w obie strony' : 'bez paliwa i kosztów auta';
}
function details(r: Row) {
  let note: string = r[7].replace('Dojazd autem niewyceniony.', '');
  if (filters.mode === 'car' && ses(r)) {
    const b = r[4] || base[r[1]];
    note = `${r[2] === 'Samodzielnie' ? 'Nocleg dla 4 osób + 6-dniowy skipass, przy kursie 4,30 zł/€' : 'Pakiet dojazdu własnego z arkusza'}: ${money(b)} na osobę. Paliwo: ${money(fuelPerPerson)} na osobę za przejazd w obie strony. Bez autostrad, winiet, parkingu i ewentualnego noclegu po drodze. Wyżywienie tylko jeśli zawarte w pakiecie biura.`;
  }
  const safeUrl = r[8].startsWith('https://') ? escape(r[8]) : '#';
  return `<details><summary>Szczegóły</summary><p>${escape(note)}</p><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">Otwórz źródło wyceny ↗</a></details>`;
}
function card(r: Row) {
  const price = cost(r), self = r[2] === 'Samodzielnie';
  return `<article class="offer"><div><span class="tag ${self ? 'self' : ''}">${self ? 'Samodzielnie' : 'Z biurem · '+escape(r[2])}</span><h3>${escape(r[0])}</h3><p class="stay">${escape(r[9])}</p></div><div><span class="label">TERMIN · 2027</span><span class="date">${escape(r[1].replace('.2027',''))}</span></div><div><span class="label">${filters.mode === 'flight' ? 'WYJAZD Z LOTEM' : 'DOJAZD WŁASNY'}</span><span class="price">${price === null ? '—' : money(price)}</span><span class="sub">${pricingNote(r)}</span></div><div><span class="label">CZAS PODRÓŻY (${filters.mode === 'flight' ? 'LOT' : 'AUTO'})</span><span class="time">${escape(filters.mode === 'flight' ? r[5] : ses(r) ? '18 h 17 min' : r[6])}${filters.mode === 'car' && ses(r) ? '' : ' h'}</span><span class="sub">w jedną stronę</span></div>${details(r)}</article>`;
}
function render() {
  const result = rows.filter(selected).sort((a,b) => sortKey(a)-sortKey(b));
  $('count').textContent = `Opcje wyjazdu (${result.length})`;
  $('results').innerHTML = result.length ? result.map(card).join('') : '<p class="empty">Brak opcji dla tych filtrów. Wybierz inny termin lub ośrodek.</p>';
  $('fuel').hidden = filters.mode !== 'car';
  $('notice').textContent = filters.mode === 'flight' ? 'Ceny od, zgodnie z Twoim arkuszem. Szczegółowy zakres bagażu i dojazdu różni się między ofertami.' : 'Paliwo doliczamy tylko do Sestriere / Vialattea. Pozostałe kierunki pokazują pakiet bez paliwa — nie są pełnym kosztem podróży autem. Opłaty drogowe i parking nie są wycenione.';
}
document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(button => button.addEventListener('click', () => {
  const key = button.dataset.filter!;
  filters[key] = button.dataset.value!;
  document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(b => {
    b.setAttribute('aria-pressed', String(filters[b.dataset.filter!] === b.dataset.value));
  });
  render();
}));
render();
