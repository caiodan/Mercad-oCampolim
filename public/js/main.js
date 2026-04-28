let stores = [];
let events = [];
let gastronomyItems = [];
const INITIAL_STORE_LIMIT = 12;
let isShowingAllStores = false;
let selectedEventId = null;
let selectedEventImageIndex = 0;
const storeFiltersState = {
  categories: [],
  search: "",
  hoursStart: "",
  hoursEnd: ""
};
let _gastronomyMarqueeTickRAF = null;
let _gastronomyMarqueeSetupRAF = null;
let _gastronomyResizeObserver = null;
let _gastronomyMarqueeAbort = null;
/** Invalida callbacks de RAF aninhados que cancelAnimationFrame não alcança */
let _gastronomyMarqueeGen = 0;

function teardownGastronomyMarquee() {
  _gastronomyMarqueeGen++;
  if (_gastronomyMarqueeTickRAF !== null) {
    cancelAnimationFrame(_gastronomyMarqueeTickRAF);
    _gastronomyMarqueeTickRAF = null;
  }
  if (_gastronomyMarqueeSetupRAF !== null) {
    cancelAnimationFrame(_gastronomyMarqueeSetupRAF);
    _gastronomyMarqueeSetupRAF = null;
  }
  if (_gastronomyResizeObserver) {
    _gastronomyResizeObserver.disconnect();
    _gastronomyResizeObserver = null;
  }
  if (_gastronomyMarqueeAbort) {
    _gastronomyMarqueeAbort.abort();
    _gastronomyMarqueeAbort = null;
  }
}

const stateBox = document.getElementById("stateBox");
const storeGrid = document.getElementById("store-grid");
const modal = document.getElementById("store-modal");
const storeCategoryDropdown = document.getElementById("store-filter-category-dropdown");
const storeCategoryToggle = document.getElementById("store-filter-category-toggle");
const storeCategoryLabel = document.getElementById("store-filter-category-label");
const storeCategoryMenu = document.getElementById("store-filter-category-menu");
const storeCategoryOptions = document.getElementById("store-filter-category-options");
const storeSearchInput = document.getElementById("store-filter-search");
const storeHoursStartInput = document.getElementById("store-filter-hours-start");
const storeHoursEndInput = document.getElementById("store-filter-hours-end");
const toggleStoresBtn = document.getElementById("toggle-stores-btn");
const eventState = document.getElementById("event-state");
const eventHighlight = document.getElementById("event-highlight");
const eventList = document.getElementById("event-list");
const eventsPreview = document.getElementById("events-preview");
const eventsCalendarView = document.getElementById("events-calendar-view");
const fullCalendarGrid = document.getElementById("full-calendar-grid");
const openCalendarBtn = document.getElementById("open-calendar-btn");
const backToEventsBtn = document.getElementById("back-to-events-btn");
const gastronomyState = document.getElementById("gastronomy-state");
const gastronomyTrack = document.getElementById("gastronomy-track");
const sectionsToAnimate = document.querySelectorAll(".section-enter");

/** Capa quando a loja nao tem URL valida ou a imagem externa falha ao carregar. */
const DEFAULT_STORE_IMAGE_URL =
  "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200";

function resolveStoreCoverUrl(primary, secondary) {
  const pick = (v) => {
    if (v == null) return "";
    const s = String(v).trim();
    if (!s || /^null$/i.test(s) || /^undefined$/i.test(s)) return "";
    return s;
  };
  return pick(primary) || pick(secondary) || DEFAULT_STORE_IMAGE_URL;
}

function bindStoreCoverFallback(img) {
  if (!img) return;
  img.addEventListener(
    "error",
    () => {
      if (img.src !== DEFAULT_STORE_IMAGE_URL) {
        img.src = DEFAULT_STORE_IMAGE_URL;
      }
    },
    { once: true }
  );
}

function dedupeGastronomyByStoreId(items) {
  const seen = new Set();
  return items.filter((item) => {
    const n = Number(item?.id);
    if (!Number.isFinite(n)) return true;
    if (seen.has(n)) return false;
    seen.add(n);
    return true;
  });
}
function syncBodyScrollLock() {
  const mobilePanel = document.getElementById("mobile-nav-panel");
  const menuOpen = mobilePanel && mobilePanel.classList.contains("is-open");
  const storeOpen = modal && modal.classList.contains("is-open");
  document.body.style.overflow = menuOpen || storeOpen ? "hidden" : "";
}

function parseStoreCategorySlugs(store) {
  if (Array.isArray(store.categories) && store.categories.length) {
    return store.categories.map((c) => String(c || "").trim()).filter(Boolean);
  }
  const single = store.category != null ? String(store.category).trim() : "";
  return single ? [single] : [];
}

function normalizeStore(store) {
  const slugs = parseStoreCategorySlugs(store);
  const categoryKeys = [];
  const seen = new Set();
  for (const slug of slugs) {
    const k = normalizeText(slug) || "servicos";
    if (seen.has(k)) continue;
    seen.add(k);
    categoryKeys.push(k);
  }
  if (!categoryKeys.length) categoryKeys.push("servicos");
  const rawPrimary = slugs[0] || "servicos";
  const normalizedPrimary = normalizeText(rawPrimary) || "servicos";
  return {
    ...store,
    img: resolveStoreCoverUrl(store.image_url, store.img),
    logoUrl: store.logo_url || store.logoUrl || "",
    location: store.floor || store.location || "Localizacao a confirmar",
    hours: store.hours || "10:00 - 22:00",
    desc: store.description || store.desc || "",
    whatsappUrl: store.whatsapp_url || store.whatsappUrl || "",
    instagramUrl: store.instagram_url || store.instagramUrl || "",
    categories: slugs,
    category: rawPrimary,
    categoryKey: normalizedPrimary,
    categoryKeys
  };
}

function renderStores() {
  storeGrid.innerHTML = "";
  const filtered = stores.filter((store) => matchStoreFilters(store));
  const visibleStores = isShowingAllStores ? filtered : filtered.slice(0, INITIAL_STORE_LIMIT);

  visibleStores.forEach((store) => {
    const card = document.createElement("div");
    card.className = "store-card group cursor-pointer border border-slate-100";
    card.dataset.storeId = String(store.id ?? "");
    const logoBlock = `
      <div class="absolute z-20 -bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white p-[6px] shadow-md ring-1 ring-slate-100">
        ${
          store.logoUrl
            ? `<img src="${store.logoUrl}" alt="Logo ${store.name}" class="w-full h-full rounded-full object-cover">`
            : `<div class="w-full h-full rounded-full bg-marron text-white flex items-center justify-center text-base font-bold">${String(store.name || "L").charAt(0).toUpperCase()}</div>`
        }
      </div>
    `;
    const socialActions = `
      <div class="mt-3 flex items-center gap-3 text-slate-400">
        ${store.whatsappUrl ? `<a data-social-link="whatsapp" href="${store.whatsappUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center w-7 h-7 rounded-full border border-slate-200 hover:border-green-500 hover:text-green-600 transition-colors" title="WhatsApp"><svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="currentColor" aria-hidden="true"><path d="M20.52 3.48A11.79 11.79 0 0 0 12.03 0C5.42 0 .03 5.38.03 12c0 2.11.55 4.18 1.59 6.01L0 24l6.16-1.61A11.94 11.94 0 0 0 12.03 24h.01c6.61 0 12-5.38 12-12 0-3.2-1.25-6.21-3.52-8.52ZM12.04 21.98h-.01a9.96 9.96 0 0 1-5.08-1.39l-.36-.21-3.65.95.98-3.56-.24-.37A9.95 9.95 0 0 1 2.06 12c0-5.5 4.48-9.98 9.99-9.98 2.67 0 5.18 1.04 7.07 2.93A9.94 9.94 0 0 1 22.05 12c0 5.51-4.49 9.98-10.01 9.98Zm5.47-7.49c-.3-.15-1.77-.88-2.05-.98-.27-.1-.47-.15-.66.15-.2.3-.76.98-.93 1.18-.17.2-.34.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.34.44-.51.15-.17.2-.3.3-.49.1-.2.05-.37-.03-.52-.07-.15-.66-1.59-.9-2.18-.24-.57-.49-.49-.66-.5h-.56c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.86 1.2 3.06.15.2 2.09 3.19 5.07 4.47.71.31 1.27.5 1.71.64.72.23 1.37.2 1.89.12.58-.09 1.77-.72 2.02-1.41.25-.69.25-1.28.17-1.41-.07-.12-.27-.2-.57-.35Z"/></svg></a>` : ""}
        ${store.instagramUrl ? `<a data-social-link="instagram" href="${store.instagramUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center w-7 h-7 rounded-full border border-slate-200 hover:border-pink-500 hover:text-pink-600 transition-colors" title="Instagram"><svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="currentColor" aria-hidden="true"><path d="M7.75 2C4.57 2 2 4.57 2 7.75v8.5C2 19.43 4.57 22 7.75 22h8.5C19.43 22 22 19.43 22 16.25v-8.5C22 4.57 19.43 2 16.25 2h-8.5Zm0 1.8h8.5c2.19 0 3.95 1.76 3.95 3.95v8.5c0 2.19-1.76 3.95-3.95 3.95h-8.5A3.94 3.94 0 0 1 3.8 16.25v-8.5C3.8 5.56 5.56 3.8 7.75 3.8Zm9.1 1.55a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2ZM12 6.73A5.27 5.27 0 1 0 12 17.27 5.27 5.27 0 0 0 12 6.73Zm0 1.8A3.47 3.47 0 1 1 12 15.47 3.47 3.47 0 0 1 12 8.53Z"/></svg></a>` : ""}
      </div>
    `;
    card.innerHTML = `
      <div class="relative">
        <div class="aspect-[16/9] overflow-hidden">
          <img src="${store.img}" class="store-cover-img w-full h-full object-cover" alt="${store.name}">
        </div>
        ${logoBlock}
      </div>
      <div class="p-6 text-slate-800 mt-[8px]">
        <span class="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600">${(store.categoryKeys || [])
          .map((k) => formatCategoryLabel(k))
          .join(" · ")}</span>
        <h4 class="text-2xl font-serif italic mt-2 uppercase group-hover:text-marron transition-colors leading-tight">${store.name}</h4>
        <div class="flex items-center gap-2 text-[11px] text-slate-400 mt-5 border-t border-slate-50 pt-4">
          <i data-lucide="map-pin" class="w-3 h-3 text-marron"></i>
          <span class="font-bold uppercase tracking-widest">${store.location}</span>
        </div>
        <div class="flex items-center gap-2 text-[11px] text-slate-400 mt-2">
          <i data-lucide="clock-3" class="w-3 h-3 text-marron"></i>
          <span class="font-bold uppercase tracking-widest">${store.hours}</span>
        </div>
        ${socialActions}
      </div>
    `;
    bindStoreCoverFallback(card.querySelector(".store-cover-img"));
    storeGrid.appendChild(card);
  });

  const storeCards = storeGrid.querySelectorAll(".store-card");
  storeCards.forEach((card, index) => {
    card.classList.add("store-card-enter");
    card.style.setProperty("--store-enter-delay", `${Math.min(index * 40, 280)}ms`);
  });

  if (filtered.length > INITIAL_STORE_LIMIT) {
    toggleStoresBtn.classList.remove("hidden");
    toggleStoresBtn.textContent = isShowingAllStores ? "Ver menos lojas" : "Ver todas as lojas";
  } else {
    toggleStoresBtn.classList.add("hidden");
  }

  stateBox.textContent = isShowingAllStores || filtered.length <= INITIAL_STORE_LIMIT
    ? `${visibleStores.length} loja(s) exibida(s).`
    : `${visibleStores.length} de ${filtered.length} loja(s) exibida(s).`;
  if (window.lucide) window.lucide.createIcons();
}

function formatCategoryLabel(category) {
  const normalized = normalizeText(category);
  const labelMap = {
    all: "Ver Tudo",
    hortifruti: "Hortifruti",
    gastronomia: "Gastronomia",
    bebidas: "Bebidas",
    servicos: "Serviços",
    roupas: "Roupas",
    infantil: "Infantil",
    fitness: "Fitness"
  };
  if (labelMap[normalized]) return labelMap[normalized];
  if (!category) return "Serviços";
  return String(category)
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function renderStoreFilters() {
  if (!storeCategoryOptions) return;
  const uniqueCategories = [...new Set(stores.flatMap((store) => store.categoryKeys || []).filter(Boolean))];
  const orderedCategories = uniqueCategories.sort((a, b) => a.localeCompare(b, "pt-BR"));

  storeCategoryOptions.innerHTML = orderedCategories
    .map((categoryKey) => {
      const checked = storeFiltersState.categories.includes(categoryKey) ? "checked" : "";
      return `<label class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"><input type="checkbox" class="store-category-option rounded border-slate-300 text-marron focus:ring-marron" value="${categoryKey}" ${checked}><span>${formatCategoryLabel(categoryKey)}</span></label>`;
    })
    .join("");
  updateStoreCategoryLabel();
}

function updateStoreCategoryLabel() {
  if (!storeCategoryLabel) return;
  const selected = storeFiltersState.categories || [];
  if (!selected.length) {
    storeCategoryLabel.textContent = "Todas as categorias";
    return;
  }
  if (selected.length <= 2) {
    storeCategoryLabel.textContent = selected.map((key) => formatCategoryLabel(key)).join(", ");
    return;
  }
  storeCategoryLabel.textContent = `${selected.length} categorias selecionadas`;
}

function toggleStoreCategoryMenu(forceOpen) {
  if (!storeCategoryMenu) return;
  const shouldOpen = forceOpen == null ? storeCategoryMenu.classList.contains("hidden") : !!forceOpen;
  storeCategoryMenu.classList.toggle("hidden", !shouldOpen);
}

function parseStoreHourRange(hoursText) {
  const matches = String(hoursText || "").match(/(\d{1,2}):(\d{2})/g) || [];
  if (matches.length < 2) return null;
  const [startRaw, endRaw] = matches;
  const parseMinutes = (token) => {
    const [h, m] = token.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
  };
  const start = parseMinutes(startRaw);
  const end = parseMinutes(endRaw);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return { start, end };
}

function parseTimeToMinutes(timeText) {
  const match = String(timeText || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function expandRangeToIntervals(start, end) {
  if (start <= end) return [[start, end]];
  return [[start, 24 * 60], [0, end]];
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  const aIntervals = expandRangeToIntervals(aStart, aEnd);
  const bIntervals = expandRangeToIntervals(bStart, bEnd);
  return aIntervals.some(([as, ae]) => bIntervals.some(([bs, be]) => as < be && bs < ae));
}

function matchStoreHoursFilter(store, periodStart, periodEnd) {
  if (!periodStart && !periodEnd) return true;
  const parsedStart = parseTimeToMinutes(periodStart || "00:00");
  const parsedEnd = parseTimeToMinutes(periodEnd || "23:59");
  if (!Number.isFinite(parsedStart) || !Number.isFinite(parsedEnd)) return true;
  const storeRange = parseStoreHourRange(store.hours);
  if (!storeRange) return false;
  return rangesOverlap(storeRange.start, storeRange.end, parsedStart, parsedEnd);
}

function matchStoreSearchFilter(store, searchText) {
  const term = normalizeText(searchText);
  if (!term) return true;
  const haystack = normalizeText(
    [
      store.name,
      store.location,
      store.hours,
      store.desc,
      ...(store.categoryKeys || []).map((k) => formatCategoryLabel(k))
    ].join(" ")
  );
  return haystack.includes(term);
}

function matchStoreFilters(store) {
  const categoryFilters = (storeFiltersState.categories || []).map((item) => normalizeText(item));
  const passesCategory =
    !categoryFilters.length || categoryFilters.some((cat) => (store.categoryKeys || []).includes(cat));
  const passesSearch = matchStoreSearchFilter(store, storeFiltersState.search);
  const passesHours = matchStoreHoursFilter(store, storeFiltersState.hoursStart, storeFiltersState.hoursEnd);
  return passesCategory && passesSearch && passesHours;
}

function renderEvents() {
  eventHighlight.innerHTML = "";
  eventList.innerHTML = "";
  if (!events.length) {
    eventState.textContent = "Nenhum evento cadastrado no momento.";
    return;
  }

  const sortedEvents = [...events].sort((a, b) => compareEventsByDate(a, b));
  const selected =
    sortedEvents.find((event) => Number(event.id) === Number(selectedEventId)) ||
    selectHighlightEvent(sortedEvents);
  if (!selected) return;
  selectedEventId = selected.id;
  if (selectedEventImageIndex >= selected.images.length) {
    selectedEventImageIndex = 0;
  }
  const activeImage = selected.images[selectedEventImageIndex] || selected.image_url;
  const otherEvents = sortedEvents
    .filter((event) => Number(event.id) !== Number(selected.id))
    .slice(0, 2);

  eventHighlight.innerHTML = `
    <div data-event-id="${selected.id}" class="group relative event-card-large bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all cursor-pointer">
      <img src="${activeImage || "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=1200"}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="${selected.title}">
      <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent flex flex-col justify-end p-10 lg:p-16">
        <div class="flex items-center gap-4 text-amber-400 mb-4">
          <span class="px-4 py-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-[10px] font-bold uppercase tracking-widest">Destaque do Mes</span>
          <span class="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><i data-lucide="calendar" class="w-3 h-3"></i> ${selected.event_date || "Data a confirmar"}</span>
        </div>
        <h4 class="text-4xl lg:text-5xl font-serif italic text-white mb-6">${selected.title}</h4>
        <p class="text-white/70 text-lg max-w-xl leading-relaxed mb-8">${selected.description}</p>
        <div class="grid grid-cols-4 sm:grid-cols-6 gap-2 lg:gap-3" id="event-gallery-thumbs">
          ${selected.images
            .map(
              (url, idx) => `<button type="button" data-event-thumb-index="${idx}" class="group relative overflow-hidden rounded-xl border ${idx === selectedEventImageIndex ? "border-amber-300" : "border-white/30"}">
                <img src="${url}" alt="Foto ${idx + 1} do evento ${selected.title}" class="w-full h-16 object-cover group-hover:scale-105 transition-transform">
              </button>`
            )
            .join("")}
        </div>
      </div>
    </div>
  `;

  otherEvents.forEach((event) => {
    const card = document.createElement("div");
    card.dataset.eventId = String(event.id ?? "");
    card.className = "group flex-1 bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col sm:flex-row lg:flex-col xl:flex-row";
    card.innerHTML = `
      <div class="sm:w-1/3 lg:w-full xl:w-1/3 h-48 sm:h-full lg:h-48 xl:h-full relative overflow-hidden">
        <img src="${(event.images && event.images[0]) || event.image_url || "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=1200"}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="${event.title}">
      </div>
      <div class="flex-1 p-8 flex flex-col justify-center">
        <span class="text-[9px] font-bold text-amber-600 uppercase tracking-[0.2em] mb-2">${event.event_date}</span>
        <h5 class="text-xl font-serif italic text-slate-900 group-hover:text-marron transition-colors mb-2 leading-tight">${event.title}</h5>
        <p class="text-xs text-slate-500 line-clamp-2">${event.description}</p>
      </div>
    `;
    eventList.appendChild(card);
  });

  eventState.textContent = `${events.length} evento(s) exibido(s).`;
  if (window.lucide) window.lucide.createIcons();
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parseEventDate(eventDate) {
  const months = {
    janeiro: 0,
    fevereiro: 1,
    marco: 2,
    abril: 3,
    maio: 4,
    junho: 5,
    julho: 6,
    agosto: 7,
    setembro: 8,
    outubro: 9,
    novembro: 10,
    dezembro: 11
  };
  const normalized = normalizeText(eventDate);
  const match = normalized.match(/(\d{1,2})\s+de\s+([a-z]+)/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = months[match[2]];
  if (!Number.isFinite(day) || month === undefined) return null;

  const year = new Date().getFullYear();
  return new Date(year, month, day);
}

function normalizeEventPayload(event) {
  let imageSource = Array.isArray(event.images) ? event.images : [];
  if (!imageSource.length && typeof event.images === "string") {
    try {
      const parsed = JSON.parse(event.images);
      imageSource = Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      imageSource = [];
    }
  }
  const imageList = imageSource.map((url) => String(url || "").trim()).filter(Boolean);
  const fallback = String(event.image_url || "").trim();
  const images = imageList.length ? imageList : (fallback ? [fallback] : []);
  const weekdays = (() => {
    if (Array.isArray(event.weekdays)) return event.weekdays;
    if (typeof event.weekdays === "string") {
      try {
        const parsed = JSON.parse(event.weekdays);
        return Array.isArray(parsed) ? parsed : [];
      } catch (_error) {
        return [];
      }
    }
    return [];
  })()
    .map((item) => Number(item))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  const specificDates = (() => {
    if (Array.isArray(event.specific_dates)) return event.specific_dates;
    if (typeof event.specific_dates === "string") {
      try {
        const parsed = JSON.parse(event.specific_dates);
        return Array.isArray(parsed) ? parsed : [];
      } catch (_error) {
        return [];
      }
    }
    return [];
  })()
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  return {
    ...event,
    images,
    image_url: images[0] || null,
    recurrence_type: String(event.recurrence_type || "none"),
    weekdays,
    specific_dates: specificDates
  };
}

function formatEventRecurrenceText(event) {
  const dayMap = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  const type = String(event.recurrence_type || "none");
  if (type === "weekly") {
    if (!Array.isArray(event.weekdays) || !event.weekdays.length) return "Recorrencia semanal";
    const labels = event.weekdays
      .slice()
      .sort((a, b) => a - b)
      .map((d) => dayMap[d] || "")
      .filter(Boolean);
    return `Semanal: ${labels.join(", ")}`;
  }
  if (type === "specific_dates") {
    const count = Array.isArray(event.specific_dates) ? event.specific_dates.length : 0;
    return count ? `${count} data(s) especifica(s)` : "Datas especificas";
  }
  return "Periodo continuo";
}

function formatEventPeriodLine(event) {
  const start = String(event.period_start || "").trim();
  const end = String(event.period_end || "").trim();
  if (!start && !end) return "Data a confirmar";
  const toBr = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return `${day}/${month}/${year}`;
    }
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) return raw;
    const day = String(dt.getDate()).padStart(2, "0");
    const month = String(dt.getMonth() + 1).padStart(2, "0");
    const year = String(dt.getFullYear());
    return `${day}/${month}/${year}`;
  };
  return `Inicio: ${toBr(start || end)} · Fim: ${toBr(end || start)}`;
}

function compareEventsByDate(first, second) {
  const firstPeriod = String(first.period_start || "").trim();
  const secondPeriod = String(second.period_start || "").trim();
  if (firstPeriod && secondPeriod) {
    if (firstPeriod < secondPeriod) return -1;
    if (firstPeriod > secondPeriod) return 1;
  } else if (firstPeriod) {
    return -1;
  } else if (secondPeriod) {
    return 1;
  }
  const firstDate = parseEventDate(first.event_date);
  const secondDate = parseEventDate(second.event_date);

  if (firstDate && secondDate) return firstDate - secondDate;
  if (firstDate) return -1;
  if (secondDate) return 1;
  return Number(first.id || 0) - Number(second.id || 0);
}

function isCurrentMonthEvent(event) {
  const eventDate = parseEventDate(event.event_date);
  if (!eventDate) return false;
  return eventDate.getMonth() === new Date().getMonth();
}

function selectHighlightEvent(sortedEvents) {
  const highlightedCurrentMonth = sortedEvents.filter(
    (event) => Boolean(event.highlight) && isCurrentMonthEvent(event)
  );

  if (highlightedCurrentMonth.length === 1) {
    return highlightedCurrentMonth[0];
  }

  return sortedEvents[0];
}

/** px/s — ritmo bem lento em qualquer largura */
const GASTRONOMY_MARQUEE_BASE_MS_PER_SET = 21000;
const GASTRONOMY_MARQUEE_MIN_PX_PER_SEC = 36;
const GASTRONOMY_MARQUEE_MAX_PX_PER_SEC = 90;

function gastronomyMarqueeSpeedPxPerMs(oneSetWidthPx) {
  const ideal = oneSetWidthPx / GASTRONOMY_MARQUEE_BASE_MS_PER_SET;
  const minV = GASTRONOMY_MARQUEE_MIN_PX_PER_SEC / 1000;
  const maxV = GASTRONOMY_MARQUEE_MAX_PX_PER_SEC / 1000;
  return Math.min(maxV, Math.max(minV, ideal));
}

/** Mantém translate no intervalo (-w, 0] para o loop não “escapar” com float ou saltos de frame */
function gastronomyNormalizeLoopPosition(pos, w) {
  if (!Number.isFinite(pos) || w <= 0) return 0;
  let p = pos;
  while (p <= -w) p += w;
  while (p > 0) p -= w;
  return p;
}

/**
 * Largura de uma cópia do conteúdo: distância entre o 1º card da 1ª sequência e o 1º da 2ª.
 * Mais estável que scrollWidth/3 com flex + gap em escalas/DPR diferentes (Safari inclusive).
 */
function measureGastronomyOneSetWidth(track) {
  const cards = track.querySelectorAll(".gastronomy-card");
  const total = cards.length;
  if (total < 3 || total % 3 !== 0) {
    const sw = track.scrollWidth;
    return Number.isFinite(sw) && sw > 0 ? sw / 3 : 0;
  }
  const perCopy = total / 3;
  const r0 = cards[0].getBoundingClientRect();
  const r1 = cards[perCopy].getBoundingClientRect();
  const measured = r1.left - r0.left;
  if (Number.isFinite(measured) && measured > 0.5) {
    return measured;
  }
  const sw = track.scrollWidth;
  return Number.isFinite(sw) && sw > 0 ? sw / 3 : 0;
}

/**
 * Marquee em requestAnimationFrame + largura medida em pixels.
 * No primeiro paint (e em reload com cache), scrollWidth costuma vir antes
 * das imagens — oneSetWidth ficava errado e o loop “quebrava”. Por isso:
 *  - remedição contínua via ResizeObserver + load/error nas imgs
 *  - ao mudar a largura, escala position para manter continuidade visual
 */
function startGastronomyMarquee(track) {
  const gen = _gastronomyMarqueeGen;

  track.style.willChange = "transform";

  let position = 0;
  let lastTimestamp = null;
  let oneSetWidth = 0;

  function updateMetrics() {
    if (gen !== _gastronomyMarqueeGen) return;
    const next = measureGastronomyOneSetWidth(track);
    if (!Number.isFinite(next) || next <= 0) return;
    const prev = oneSetWidth;
    oneSetWidth = next;
    if (prev > 0 && Math.abs(next - prev) > 0.25) {
      position = (position / prev) * next;
    }
    position = gastronomyNormalizeLoopPosition(position, oneSetWidth);
    track.style.transform = "translateX(" + position.toFixed(3) + "px)";
  }

  _gastronomyMarqueeAbort = new AbortController();
  const { signal } = _gastronomyMarqueeAbort;

  track.querySelectorAll("img").forEach((img) => {
    img.addEventListener("load", updateMetrics, { signal });
    img.addEventListener("error", updateMetrics, { signal });
    if (img.complete) {
      if (typeof img.decode === "function") {
        img.decode().then(updateMetrics, updateMetrics);
      } else {
        requestAnimationFrame(updateMetrics);
      }
    }
  });

  if (typeof ResizeObserver !== "undefined") {
    _gastronomyResizeObserver = new ResizeObserver(() => {
      updateMetrics();
    });
    _gastronomyResizeObserver.observe(track);
    const carouselEl = track.parentElement;
    if (carouselEl) {
      _gastronomyResizeObserver.observe(carouselEl);
    }
  }

  if (document.readyState === "complete") {
    requestAnimationFrame(updateMetrics);
  } else {
    window.addEventListener("load", updateMetrics, { signal, once: true });
  }

  function tick(timestamp) {
    if (gen !== _gastronomyMarqueeGen) return;
    if (lastTimestamp === null) lastTimestamp = timestamp;
    const elapsed = Math.min(timestamp - lastTimestamp, 64);
    lastTimestamp = timestamp;

    if (!document.hidden && oneSetWidth > 0) {
      position -= gastronomyMarqueeSpeedPxPerMs(oneSetWidth) * elapsed;
      position = gastronomyNormalizeLoopPosition(position, oneSetWidth);
      track.style.transform = "translateX(" + position.toFixed(3) + "px)";
    }

    _gastronomyMarqueeTickRAF = requestAnimationFrame(tick);
  }

  _gastronomyMarqueeSetupRAF = requestAnimationFrame(function () {
    if (gen !== _gastronomyMarqueeGen) return;
    updateMetrics();
    requestAnimationFrame(function () {
      if (gen !== _gastronomyMarqueeGen) return;
      updateMetrics();
      _gastronomyMarqueeSetupRAF = null;
      _gastronomyMarqueeTickRAF = requestAnimationFrame(tick);
    });
  });
}

function renderGastronomy() {
  teardownGastronomyMarquee();
  gastronomyTrack.innerHTML = "";
  gastronomyTrack.style.transform = "";
  gastronomyTrack.style.willChange = "";
  gastronomyTrack.classList.remove("gastronomy-track--static");

  const uniqueItems = dedupeGastronomyByStoreId(gastronomyItems);
  if (!uniqueItems.length) {
    gastronomyState.textContent = "Nenhuma loja selecionada para a seção de gastronomia no momento.";
    return;
  }

  const useMarquee = uniqueItems.length > 2;
  const sequence = useMarquee
    ? [...uniqueItems, ...uniqueItems, ...uniqueItems]
    : [...uniqueItems];
  sequence.forEach((item) => {
    const card = document.createElement("article");
    card.className = "gastronomy-card";
    card.innerHTML = `
      <img src="${resolveStoreCoverUrl(item.image_url)}" class="gastronomy-card-image gastronomy-cover-img" alt="${item.name}">
      <div class="gastronomy-card-body">
        <span class="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-700">${item.cuisine_type}</span>
        <h4 class="mt-1 text-base font-serif italic text-slate-900 leading-tight line-clamp-1">${item.name}</h4>
        <div class="flex items-center gap-2 text-[9px] text-slate-500 mt-1.5">
          <i data-lucide="map-pin" class="w-3 h-3 text-marron"></i>
          <span class="font-bold uppercase tracking-widest">${item.location}</span>
        </div>
      </div>
    `;
    bindStoreCoverFallback(card.querySelector(".gastronomy-cover-img"));
    gastronomyTrack.appendChild(card);
  });

  if (useMarquee) {
    startGastronomyMarquee(gastronomyTrack);
  } else {
    gastronomyTrack.classList.add("gastronomy-track--static");
  }
  gastronomyState.textContent = "";
  if (window.lucide) window.lucide.createIcons();
}

function renderFullCalendar() {
  fullCalendarGrid.innerHTML = "";
  const sortedEvents = [...events].sort((a, b) => compareEventsByDate(a, b));
  sortedEvents.forEach((event) => {
    const card = document.createElement("article");
    card.dataset.eventId = String(event.id ?? "");
    card.className = "bg-white rounded-[1.5rem] overflow-hidden shadow-sm border border-[#eddcd2]";
    card.innerHTML = `
      <div class="h-52 overflow-hidden">
        <img src="${event.image_url || "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=1200"}" class="w-full h-full object-cover" alt="${event.title}">
      </div>
      <div class="p-6">
        <div class="flex items-center justify-between gap-3">
          <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">${event.event_date}</span>
          ${event.highlight ? '<span class="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[10px] uppercase tracking-widest font-bold text-amber-700">Destaque</span>' : ""}
        </div>
        <p class="mt-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">${formatEventRecurrenceText(event)}</p>
        <h4 class="mt-3 text-2xl font-serif italic text-slate-900 leading-tight line-clamp-1">${event.title}</h4>
        <p class="mt-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">${formatEventPeriodLine(event)}</p>
        <p class="mt-3 text-sm text-slate-500 leading-relaxed">${event.description}</p>
      </div>
    `;
    fullCalendarGrid.appendChild(card);
  });
}

function showCalendarView() {
  eventsPreview.classList.add("hidden");
  eventsCalendarView.classList.remove("hidden");
  eventState.textContent = `${events.length} evento(s) no calendario completo.`;
  renderFullCalendar();
}

function showPreviewView() {
  eventsCalendarView.classList.add("hidden");
  eventsPreview.classList.remove("hidden");
  eventState.textContent = `${events.length} evento(s) exibido(s).`;
}

async function loadPublicData() {
  try {
    const [storesResponse, eventsResponse, gastronomyResponse] = await Promise.all([
      fetch("/api/public/stores"),
      fetch("/api/public/events"),
      fetch("/api/public/gastronomy")
    ]);

    if (!storesResponse.ok || !eventsResponse.ok || !gastronomyResponse.ok) {
      throw new Error("Falha ao carregar conteudo publico.");
    }

    const storesData = await storesResponse.json();
    const eventsData = await eventsResponse.json();
    const gastronomyData = await gastronomyResponse.json();
    stores = storesData.map(normalizeStore);
    events = eventsData.map(normalizeEventPayload);
    gastronomyItems = dedupeGastronomyByStoreId(gastronomyData);
    renderStoreFilters();
    renderStores();
    renderEvents();
    renderGastronomy();
  } catch (error) {
    stateBox.textContent = "Nao foi possivel carregar as lojas.";
    eventState.textContent = "Nao foi possivel carregar os eventos.";
    gastronomyState.textContent = "Nao foi possivel carregar a gastronomia.";
  }
}

function openModal(store) {
  const modalTitle = document.getElementById("modal-title");
  const modalCat = document.getElementById("modal-cat");
  const modalDesc = document.getElementById("modal-desc");
  const modalLoc = document.getElementById("modal-loc");
  const modalHours = document.getElementById("modal-hours");
  const modalImg = document.getElementById("modal-img");

  if (!modalTitle || !modalCat || !modalDesc || !modalLoc || !modalHours || !modalImg) return;

  modalTitle.innerText = (store.name || "Loja").toUpperCase();
  modalCat.innerText =
    (store.categoryKeys || []).map((k) => formatCategoryLabel(k)).join(" · ") || "Categoria";
  modalDesc.innerText = store.desc || "Sem descrição disponível.";
  modalLoc.innerText = store.location || "Localização a confirmar";
  modalHours.innerText = store.hours || "Consulte a loja";
  modalImg.onerror = () => {
    modalImg.onerror = null;
    modalImg.src = DEFAULT_STORE_IMAGE_URL;
  };
  modalImg.src = store.img;

  modal.classList.add("is-open");
  syncBodyScrollLock();
  if (window.lucide) window.lucide.createIcons();
}

function selectEventInPage(eventId, options = {}) {
  const { imageIndex = 0, ensurePreviewVisible = false } = options;
  const selected = events.find((item) => Number(item.id) === Number(eventId));
  if (!selected) return;
  selectedEventId = selected.id;
  selectedEventImageIndex = Math.max(0, Math.min(Number(imageIndex) || 0, Math.max(0, selected.images.length - 1)));
  if (ensurePreviewVisible) {
    showPreviewView();
  }
  renderEvents();
}

function closeModal() {
  modal.classList.remove("is-open");
  syncBodyScrollLock();
  const modalImg = document.getElementById("modal-img");
  if (modalImg) modalImg.onerror = null;
}

function openMobileNav() {
  const backdrop = document.getElementById("mobile-nav-backdrop");
  const panel = document.getElementById("mobile-nav-panel");
  const opener = document.getElementById("mobile-nav-open");
  if (!backdrop || !panel || !opener) return;
  backdrop.classList.add("is-open");
  panel.classList.add("is-open");
  backdrop.setAttribute("aria-hidden", "false");
  panel.setAttribute("aria-hidden", "false");
  opener.setAttribute("aria-expanded", "true");
  syncBodyScrollLock();
  if (window.lucide) window.lucide.createIcons();
}

function closeMobileNav() {
  const backdrop = document.getElementById("mobile-nav-backdrop");
  const panel = document.getElementById("mobile-nav-panel");
  const opener = document.getElementById("mobile-nav-open");
  if (!backdrop || !panel || !opener) return;
  backdrop.classList.remove("is-open");
  panel.classList.remove("is-open");
  backdrop.setAttribute("aria-hidden", "true");
  panel.setAttribute("aria-hidden", "true");
  opener.setAttribute("aria-expanded", "false");
  syncBodyScrollLock();
}

document.getElementById("close-modal").onclick = closeModal;
modal.addEventListener("click", (event) => {
  if (event.target !== modal) return;
  closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const mobilePanel = document.getElementById("mobile-nav-panel");
  if (mobilePanel && mobilePanel.classList.contains("is-open")) {
    closeMobileNav();
    return;
  }
  if (modal.classList.contains("is-open")) {
    closeModal();
    return;
  }
});

(function initMobileNav() {
  const openBtn = document.getElementById("mobile-nav-open");
  const closeBtn = document.getElementById("mobile-nav-close");
  const backdrop = document.getElementById("mobile-nav-backdrop");
  const panel = document.getElementById("mobile-nav-panel");
  if (!openBtn || !closeBtn || !backdrop || !panel) return;

  openBtn.addEventListener("click", () => openMobileNav());
  closeBtn.addEventListener("click", () => closeMobileNav());
  backdrop.addEventListener("click", () => closeMobileNav());

  panel.querySelectorAll("a.mobile-nav-link").forEach((link) => {
    link.addEventListener("click", () => closeMobileNav());
  });
})();

storeGrid.addEventListener("click", (event) => {
  const clickTarget = event.target;
  if (!(clickTarget instanceof Element)) return;
  if (clickTarget.closest("a[data-social-link]")) return;

  const storeCard = clickTarget.closest("[data-store-id]");
  if (!storeCard) return;

  const storeId = Number(storeCard.getAttribute("data-store-id"));
  const store = stores.find((item) => Number(item.id) === storeId);
  if (!store) return;

  openModal(store);
});

eventsPreview.addEventListener("click", (event) => {
  const clickTarget = event.target;
  if (!(clickTarget instanceof Element)) return;

  const thumbButton = clickTarget.closest("button[data-event-thumb-index]");
  if (thumbButton) {
    const thumbIndex = Number(thumbButton.getAttribute("data-event-thumb-index"));
    if (Number.isFinite(thumbIndex)) {
      selectedEventImageIndex = thumbIndex;
      renderEvents();
    }
    return;
  }

  const eventCard = clickTarget.closest("[data-event-id]");
  if (!eventCard) return;

  const eventId = Number(eventCard.getAttribute("data-event-id"));
  selectEventInPage(eventId);
});

fullCalendarGrid.addEventListener("click", (event) => {
  const clickTarget = event.target;
  if (!(clickTarget instanceof Element)) return;

  const eventCard = clickTarget.closest("[data-event-id]");
  if (!eventCard) return;

  const eventId = Number(eventCard.getAttribute("data-event-id"));
  selectEventInPage(eventId, { ensurePreviewVisible: true });
});

if (storeCategoryToggle) {
  storeCategoryToggle.addEventListener("click", () => {
    toggleStoreCategoryMenu();
  });
}

if (storeCategoryOptions) {
  storeCategoryOptions.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.classList.contains("store-category-option")) return;
    isShowingAllStores = false;
    const checkedInputs = storeCategoryOptions.querySelectorAll(".store-category-option:checked");
    storeFiltersState.categories = Array.from(checkedInputs, (input) => input.value).filter(Boolean);
    updateStoreCategoryLabel();
    renderStores();
  });
}

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  if (!storeCategoryDropdown || !storeCategoryMenu) return;
  if (storeCategoryDropdown.contains(event.target)) return;
  toggleStoreCategoryMenu(false);
});

if (storeSearchInput) {
  storeSearchInput.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    isShowingAllStores = false;
    storeFiltersState.search = target.value || "";
    renderStores();
  });
}

if (storeHoursStartInput) {
  storeHoursStartInput.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    isShowingAllStores = false;
    storeFiltersState.hoursStart = target.value || "";
    renderStores();
  });
}

if (storeHoursEndInput) {
  storeHoursEndInput.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    isShowingAllStores = false;
    storeFiltersState.hoursEnd = target.value || "";
    renderStores();
  });
}

toggleStoresBtn.addEventListener("click", () => {
  isShowingAllStores = !isShowingAllStores;
  renderStores();
});

openCalendarBtn.addEventListener("click", showCalendarView);
backToEventsBtn.addEventListener("click", showPreviewView);

window.addEventListener("resize", () => {
  if (!window.matchMedia("(min-width: 1024px)").matches) return;
  const mobilePanel = document.getElementById("mobile-nav-panel");
  if (mobilePanel && mobilePanel.classList.contains("is-open")) {
    closeMobileNav();
  }
});

window.addEventListener("scroll", () => {
  const nav = document.getElementById("main-nav");
  const logoWrapper = document.getElementById("logo-wrapper");
  const btn = document.getElementById("nav-action-btn");

  if (window.scrollY > 80) {
    nav.classList.add("nav-scrolled");
    logoWrapper.classList.replace("border-white-alpha", "border-marron-alpha");
    btn.classList.remove("bg-white", "text-marron");
    btn.classList.add("bg-marron", "text-white");
  } else {
    nav.classList.remove("nav-scrolled");
    logoWrapper.classList.replace("border-marron-alpha", "border-white-alpha");
    btn.classList.remove("bg-marron", "text-white");
    btn.classList.add("bg-white", "text-marron");
  }
});

if (window.lucide) window.lucide.createIcons();

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        sectionObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  sectionsToAnimate.forEach((section, index) => {
    section.style.transitionDelay = `${Math.min(index * 90, 260)}ms`;
    sectionObserver.observe(section);
  });
} else {
  sectionsToAnimate.forEach((section) => {
    section.classList.add("is-visible");
  });
}

loadPublicData();
