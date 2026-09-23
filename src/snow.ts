const resorts = [
  { name: '3 Doliny', station: 'Les Menuires', monthly: [32, 91, 94, 79, 53], path: 'northern-alps/les-menuires', color: '#246859' },
  { name: 'Vialattea', station: 'Sestriere', monthly: [null, 42, 51, 72, 49], path: 'piemonte/sestriere', color: '#a66128' },
  { name: '4 Vallées', station: 'Verbier', monthly: [38, 107, 112, 83, 88], path: 'valais/verbier', color: '#5366a5' },
];
const months = [30, 31, 31, 28, 31];
const start = Date.UTC(2026, 10, 1);
const day = 86400000;
const weeks = Array.from({ length: 13 }, (_, i) => Date.UTC(2027, 0, 2 + i * 7));
const dateLabel = (date: number) => new Date(date).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
export function cumulative(monthly: (number | null)[], date: number) {
  let remaining = (date - start) / day;
  return monthly.reduce<number>((sum, snow, i) => {
    const fraction = Math.min(1, Math.max(0, remaining / months[i]));
    remaining -= months[i];
    return sum + (snow ?? 0) * fraction;
  }, 0);
}
export function renderSnow() {
  const root = document.getElementById('snow')!;
  root.innerHTML = `<p class="eyebrow">HISTORIA OPADÓW · NIE PROGNOZA NA 2027</p><h2 id="snow-title">Ile śniegu zdążyło już napadać?</h2>
    <p>Skumulowana suma świeżego śniegu <strong>do początku wybranego tygodnia</strong>. Les Menuires i Verbier: od 1 listopada. Sestriere: od 1 grudnia — listopad ma niewiarygodne zero w źródle, więc suma jest niepełna.</p>
    <div class="snow-picker"><label for="snow-week">Początek tygodnia</label><select id="snow-week">${weeks.map((date, i) => `<option value="${i}" ${i === 5 ? 'selected' : ''}>${dateLabel(date)}–${dateLabel(date + 7 * day)}.2027</option>`).join('')}</select></div>
    <div class="snow-grid" id="snow-charts"></div>
    <p class="snow-caution"><strong>To nie jest grubość pokrywy.</strong> Śnieg osiada, topnieje i jest przemieszczany przez wiatr. Rosnąca suma nie oznacza coraz lepszych warunków. Same średnie nie pozwalają obliczyć ryzyka małej ilości śniegu w styczniu; w tych danych styczeń ma największy miesięczny opad w Les Menuires i Verbier.</p>
    <details class="snow-method"><summary>Metoda, wszystkie tygodnie i ograniczenia danych</summary><p>Źródło: średnie miesięczne OnTheSnow, odczyt 23.09.2026. Dzielimy każdy miesięczny opad równomiernie na dni i sumujemy do godz. 00:00 wskazanej daty. To interpolacja, nie zmierzone średnie tygodniowe. Punkty na wykresach są co tydzień; wspólna skala 0–450 cm.</p><p>To dane dla pojedynczych ośrodków, nie średnia całych regionów. Źródło nie podaje wysokości stacji ani dokładnego okresu uśredniania i liczby obserwacji dla każdego miesiąca. Braki raportowania ograniczają porównywalność, zwłaszcza Sestriere. Nie uwzględniamy opadów sprzed listopada ani sztucznego naśnieżania.</p><div class="snow-table-wrap"><table><caption>Suma do początku tygodnia · cm, wartości przybliżone</caption><thead><tr><th>Data 2027</th>${resorts.map(r => `<th>${r.station}${r.station === 'Sestriere' ? '*' : ''}</th>`).join('')}</tr></thead><tbody>${weeks.map(date => `<tr><th>${dateLabel(date)}</th>${resorts.map(r => `<td>${Math.round(cumulative(r.monthly, date))}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p>* Sestriere bez listopada. Nie interpretuj tej sumy jako pełnych opadów od początku sezonu.</p></details>`;
  const picker = document.getElementById('snow-week') as HTMLSelectElement;
  const draw = () => {
    const chosen = weeks[Number(picker.value)];
    const x = (date: number) => 40 + (date - weeks[0]) / (weeks[12] - weeks[0]) * 270;
    const y = (snow: number) => 195 - snow / 450 * 170;
    document.getElementById('snow-charts')!.innerHTML = resorts.map(r => {
      const total = Math.round(cumulative(r.monthly, chosen));
      const points = weeks.map(date => `${x(date)},${y(cumulative(r.monthly, date))}`).join(' ');
      return `<article class="snow-card"><span class="eyebrow">${r.name}</span><h3>${r.station}</h3><div class="snow-number">≈ ${total} <small>cm</small></div><p>do ${dateLabel(chosen)} · od ${r.monthly[0] === null ? '1 grudnia*' : '1 listopada'}</p><svg viewBox="0 0 335 230" role="img" aria-label="${r.station}: suma opadów do ${dateLabel(chosen)} około ${total} cm. Pełne wartości w tabeli poniżej.">${[0,150,300,450].map(v => `<line x1="40" x2="310" y1="${y(v)}" y2="${y(v)}" stroke="#d9dfd9"/><text x="32" y="${y(v)+4}" text-anchor="end">${v}</text>`).join('')}<polyline points="${points}" fill="none" stroke="${r.color}" stroke-width="3"/><line x1="${x(chosen)}" x2="${x(chosen)}" y1="25" y2="195" stroke="${r.color}" stroke-dasharray="4 4"/><circle cx="${x(chosen)}" cy="${y(cumulative(r.monthly, chosen))}" r="5" fill="${r.color}"/>${[0,5,9,12].map(i => `<text x="${x(weeks[i])}" y="218" text-anchor="middle">${dateLabel(weeks[i])}</text>`).join('')}</svg><a href="https://www.onthesnow.co.uk/${r.path}/historical-snowfall" target="_blank" rel="noopener noreferrer">Dane opadów · OnTheSnow ↗</a>${r.monthly[0] === null ? '<p class="snow-warning">* Brak wiarygodnej sumy za listopad. Wynik niepełny.</p>' : ''}</article>`;
    }).join('');
  };
  picker.addEventListener('change', draw);
  draw();
}
