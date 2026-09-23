import { rows } from './data.js';
type Row = typeof rows[number];
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const money = (v: number) => new Intl.NumberFormat('pl-PL', {maximumFractionDigits: 0}).format(v) + ' zł';
const escape = (v: string | number) => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
let mode: 'flight' | 'car' = 'flight';
const base: Record<string, number> = {'16–23.01.2027':1950*4.3/4,'23–30.01.2027':2210*4.3/4,'06–13.02.2027':2907*4.3/4,'06–13.03.2027':2648*4.3/4};
const ses = (r: Row) => /Sestriere|Vialattea/.test(r[0]);
const value = (id: string) => $<HTMLSelectElement>(id).value;
function fuel() {
  const inputs = ['distance','consumption','fuelprice','people'].map(id => $<HTMLInputElement>(id));
  if (inputs.some(input => !input.checkValidity() || !Number.isFinite(input.valueAsNumber))) return null;
  const [distance, consumption, price, people] = inputs.map(input => input.valueAsNumber);
  return {total: distance * 2 * consumption / 100 * price, people};
}
function cost(r: Row): number | null {
  if (mode === 'flight') return r[3];
  const lodging = r[4] || base[r[1]];
  if (!ses(r)) return typeof lodging === 'number' ? lodging : null;
  const f = fuel();
  return f && lodging ? lodging + f.total/f.people : null;
}
function selected(r: Row) {
  const region = value('region'), agency = value('agency');
  return (region === 'all' || (region === 'sestriere' ? ses(r) : region === 'verbier' ? r[0].includes('Verbier') : r[0].includes('Doliny')))
    && (value('month') === 'all' || r[1].split('.')[1] === value('month'))
    && (agency === 'all' || (agency === 'self') === (r[2] === 'Samodzielnie'));
}
function sortKey(r: Row) {
  if (value('sort') === 'price') return cost(r) ?? Infinity;
  if (value('sort') === 'time') return parseFloat(String(mode === 'flight' ? r[5] : ses(r) ? 18 + 17/60 : r[6]));
  return Number(r[1].split('.')[1])*100 + parseInt(r[1]);
}
function pricingNote(r: Row) {
  if (mode === 'flight') return 'od · za osobę / wyjazd';
  return ses(r) ? 'za osobę · paliwo w obie strony wliczone' : 'za osobę · bez paliwa i kosztów auta';
}
function details(r: Row) {
  let note: string = r[7].replace('Dojazd autem niewyceniony.', '');
  if (mode === 'car' && ses(r)) {
    const b = r[4] || base[r[1]], f = fuel();
    note = `${r[2] === 'Samodzielnie' ? 'Nocleg dla 4 osób + 6-dniowy skipass, przy kursie 4,30 zł/€' : 'Pakiet dojazdu własnego z arkusza'}: ${money(b)} na osobę. Paliwo: ${f ? money(f.total/f.people) : 'uzupełnij poprawne założenia'} na osobę za przejazd w obie strony. Bez autostrad, winiet, parkingu i ewentualnego noclegu po drodze. Wyżywienie tylko jeśli zawarte w pakiecie biura.`;
  }
  const safeUrl = r[8].startsWith('https://') ? escape(r[8]) : '#';
  return `<details><summary>Co obejmuje cena i skąd pochodzą dane?</summary><p>${escape(note)}</p><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">Otwórz źródło wyceny ↗</a></details>`;
}
function card(r: Row) {
  const price = cost(r), self = r[2] === 'Samodzielnie';
  return `<article class="offer"><div><span class="tag ${self ? 'self' : ''}">${self ? 'Samodzielnie' : 'Z biurem · '+escape(r[2])}</span><h3>${escape(r[0])}</h3><p class="stay">${escape(r[9])}</p></div><div><span class="label">TERMIN · 2027</span><span class="date">${escape(r[1].replace('.2027',''))}</span><span class="sub">7 noclegów</span></div><div><span class="label">${mode === 'flight' ? 'WYJAZD Z LOTEM' : 'DOJAZD WŁASNY'}</span><span class="price">${price === null ? '—' : money(price)}</span><span class="sub">${pricingNote(r)}</span></div><div><span class="label">CZAS PODRÓŻY (${mode === 'flight' ? 'LOT' : 'AUTO'})</span><span class="time">${escape(mode === 'flight' ? r[5] : ses(r) ? '18 h 17 min' : r[6])}${mode === 'car' && ses(r) ? '' : ' h'}</span><span class="sub">w jedną stronę</span></div>${details(r)}</article>`;
}
function render() {
  const result = rows.filter(selected).sort((a,b) => sortKey(a)-sortKey(b));
  $('count').textContent = `Opcje wyjazdu (${result.length})`;
  $('results').innerHTML = result.length ? result.map(card).join('') : '<p class="empty">Brak opcji dla tych filtrów. Wybierz inny termin lub ośrodek.</p>';
  $('fuel').hidden = mode !== 'car';
  const f = fuel();
  $('fuel-total').innerHTML = f ? `<strong>${money(f.total/f.people)}</strong> / osobę · ${money(f.total)} za całe auto, w obie strony` : 'Wpisz poprawne dodatnie wartości. Liczba osób musi być całkowita.';
  $('notice').textContent = mode === 'flight' ? 'Ceny od, zgodnie z Twoim arkuszem. Szczegółowy zakres bagażu i dojazdu różni się między ofertami.' : 'Paliwo doliczamy tylko do Sestriere / Vialattea. Pozostałe kierunki pokazują pakiet bez paliwa — nie są pełnym kosztem podróży autem. Opłaty drogowe i parking nie są wycenione.';
}
document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button => button.addEventListener('click', () => {
  mode = button.dataset.mode === 'car' ? 'car' : 'flight';
  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  render();
}));
document.querySelectorAll('select,input').forEach(el => el.addEventListener('input', render));
render();
