export const franceAgency = (r) => r[0].includes('Doliny') && r[2] !== 'Samodzielnie';
export function flightTime(r) {
    return franceAgency(r) ? r[2] === 'SnowShow' ? '13–16' : '14–17' : r[5];
}
export function transitDetails(r) {
    if (!franceAgency(r))
        return '';
    const snowshow = r[2] === 'SnowShow';
    const january = r[1].includes('.01.');
    const location = r[0].startsWith('Orelle') ? 'orelle' : r[0].startsWith('Val Thorens') ? 'val-thorens' : 'les-menuires';
    const url = snowshow ? `https://snowshow.pl/wyjazdy/francja/${location}/${january ? '22-01' : '12-03'}-2027` : 'https://www.taksidi.pl/wyjazdy/wyjazd-na-narty-francja-les-menuires-12-marca-2027';
    const text = snowshow
        ? `Potwierdzony kierunek pakietu: Warszawa Chopina → Lyon, nie Gdańsk. Loty ${january ? '23–30 stycznia' : '13–20 marca'}; daty oferty w tabeli obejmują podróż autokarem. Wstępnie wylot 10:10, transfer z Lyonu 13:30, około 3 h. Godziny organizator potwierdza około tygodnia przed wyjazdem. Szacunek 13–16 h od odjazdu pociągu z Gdańska: kolej 3–4 h + dojazd na WAW 45–60 min + odprawa i zapas 2,5–3 h + lot około 2 h 20 min + bagaż i oczekiwanie 1–1,5 h + transfer 3–4 h. Pociąg pozwalający zdążyć na 10:10 nie jest potwierdzony. Przy noclegu w Warszawie licz orientacyjnie 20–26 h od wyjazdu z Gdańska. Dojazd do Warszawy i ewentualny hotel są poza pokazaną ceną. Powrót: wstępnie transfer około 06:00 i lot z Lyonu 13:25; podany czas dotyczy wyjazdu w Alpy.`
        : 'Taksidi nie sprzedaje tu lotu z Gdańska ani Warszawy — bilet kupujesz osobno. Model 14–17 h zakłada kolej Gdańsk → Warszawa 3–4 h, dojazd na lotnisko 45–60 min, zapas 2,5–3 h, lot około 2 h 20 min, bagaż/oczekiwanie 1–1,5 h i transfer 4–5 h. Nie potwierdzono konkretnego lotu pasującego do transferu. 13 marca: Lyon około 14:45 → Grenoble około 15:45 → Les Menuires. 20 marca: wyjazd około 08:00, Lyon do około 13:00. Lot musi pasować do tych godzin z zapasem na bagaż i odprawę. Cena z arkusza obejmuje założony osobny lot i bagaż, ale nie jest aktualnie potwierdzoną ofertą; kolej Gdańsk–Warszawa i ewentualny hotel nie zostały w niej zweryfikowane.';
    return `<p class="transit-audit"><strong>Audyt dojazdu · 23.09.2026.</strong> ${text}</p><a href="${url}" target="_blank" rel="noopener noreferrer">Transport na stronie organizatora ↗</a>`;
}
