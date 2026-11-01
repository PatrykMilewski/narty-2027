import { rows } from "./data.js";
import { renderSnow } from "./snow.js";
import { flightTime, franceAgency, transitDetails } from "./transit.js";
const $ = (id) => document.getElementById(id);
const money = (v) => new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(v) + " zł";
const escape = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const filters = { mode: "flight", region: "all", month: "all", agency: "all", sort: "price" };
const fuelPerPerson = (((1782 * 2 * 7) / 100) * 7.5) / 3;
const ses = (r) => /Sestriere|Vialattea/.test(r[0]);
const value = (id) => filters[id];
function cost(r) {
    if (filters.mode === "flight")
        return r[3];
    const lodging = r[4];
    if (lodging === null)
        return null;
    return ses(r) ? lodging + fuelPerPerson : lodging;
}
function selected(r) {
    const region = value("region"), agency = value("agency");
    return ((region === "all" ||
        (region === "sestriere" ? ses(r) : region === "verbier" ? r[0].includes("Verbier") : r[0].includes("Doliny"))) &&
        (value("month") === "all" || r[1].split(".")[1] === value("month")) &&
        (agency === "all" || (agency === "self") === (r[2] === "Samodzielnie")));
}
function sortKey(r) {
    if (value("sort") === "price")
        return cost(r) ?? Infinity;
    if (value("sort") === "time") {
        const hours = parseFloat(String(filters.mode === "flight" ? flightTime(r) : ses(r) ? 18 + 17 / 60 : r[6]));
        return Number.isFinite(hours) ? hours : Infinity;
    }
    return Number(r[1].split(".")[1]) * 100 + parseInt(r[1]);
}
function pricingNote(r) {
    if (filters.mode === "flight")
        return r[10];
    if (r[4] === null)
        return r[11];
    return `${r[11]} · ${ses(r) ? "z paliwem" : "bez dojazdu"}`;
}
function sourceLink(source) {
    const safeUrl = source.url.startsWith("https://") ? escape(source.url) : "#";
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${escape(source.label)} ↗</a>`;
}
function details(r) {
    let note = r[7];
    if (filters.mode === "car" && ses(r) && r[4] !== null) {
        note += ` Pobyt bez dojazdu: ${money(r[4])}/os. Paliwo: ${money(fuelPerPerson)}/os. w obie strony przy 3 osobach w aucie. Bez autostrad, winiet, parkingu i noclegu po drodze. Noclegi samodzielne liczymy dla 4 osób.`;
    }
    const sources = [{ label: "Otwórz źródło wyceny", url: r[8] }, ...r[12]];
    return `<details><summary>Szczegóły</summary><p>${escape(note)}</p>${filters.mode === "flight" ? transitDetails(r) : ""}<p>${sources.map(sourceLink).join(" · ")}</p></details>`;
}
function card(r) {
    const price = cost(r), self = r[2] === "Samodzielnie";
    const travelTime = filters.mode === "flight" ? flightTime(r) : ses(r) ? "18 h 17 min" : r[6];
    const timeUnit = String(travelTime).includes(" h") || !/^\d/.test(String(travelTime)) ? "" : " h";
    return `<article class="offer"><div><span class="tag ${self ? "self" : ""}">${self ? "Samodzielnie" : "Z biurem · " + escape(r[2])}</span><h3>${escape(r[0])}</h3><p class="stay">${escape(r[9])}</p></div><div><span class="label">TERMIN · 2027</span><span class="date">${escape(r[1].replace(".2027", ""))}</span></div><div><span class="label">${filters.mode === "flight" ? "WYJAZD Z LOTEM" : "DOJAZD WŁASNY"}</span><span class="price">${price === null ? "—" : money(price)}</span><span class="sub">${pricingNote(r)}</span></div><div><span class="label">CZAS PODRÓŻY (${filters.mode === "flight" ? "LOT" : "AUTO"})</span><span class="time">${escape(travelTime)}${timeUnit}</span><span class="sub">${filters.mode === "flight" && franceAgency(r) ? (r[2] === "SnowShow" ? "z Gdańska · szacunek, możliwy nocleg w WAW" : "model z Gdańska · lot do ustalenia") : "w jedną stronę"}</span></div>${details(r)}</article>`;
}
function render() {
    const result = rows.filter(selected).sort((a, b) => sortKey(a) - sortKey(b));
    $("count").textContent = `Opcje wyjazdu (${result.length})`;
    $("results").innerHTML = result.length
        ? result.map(card).join("")
        : '<p class="empty">Brak opcji dla tych filtrów. Wybierz inny termin lub ośrodek.</p>';
    $("fuel").hidden = filters.mode !== "car";
    $("notice").textContent =
        filters.mode === "flight"
            ? "Odczyt 01.11.2026. Kwoty opisane jako szacunek łączą aktualne składniki z rezerwą na niepotwierdzony bagaż lub transfer. „—” oznacza brak pełnej wyceny. Pakiety biur mają różny zakres i dopłaty. Dojazd Gdańsk–Warszawa przy biurach osobno. Rozwiń szczegóły i źródła."
            : "Odczyt 01.11.2026. Samodzielnie: nocleg dla 4 dorosłych + skipass przy modelowym kursie 4,30 zł/EUR. Paliwo doliczamy tylko do Sestriere, dla 3 osób w aucie. Pozostałe kierunki bez kosztów dojazdu. „—” oznacza brak aktualnej ceny, bez zastępowania jej starą wyceną.";
}
document.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => {
    const key = button.dataset.filter;
    filters[key] = button.dataset.value;
    document.querySelectorAll("[data-filter]").forEach((b) => {
        b.setAttribute("aria-pressed", String(filters[b.dataset.filter] === b.dataset.value));
    });
    render();
}));
render();
renderSnow();
