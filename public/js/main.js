let stores = [];
let events = [];
let gastronomyItems = [];
const INITIAL_STORE_LIMIT = 12;
let isShowingAllStores = false;
let currentStoreFilter = "all";
let _gastronomyMarqueeRAF = null;

const stateBox = document.getElementById("stateBox");
const storeGrid = document.getElementById("store-grid");
const modal = document.getElementById("store-modal");
const categoryFilters = document.getElementById("category-filters");
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
const eventModal = document.getElementById("event-modal");

function normalizeStore(store) {
  const rawCategory = String(store.category || "servicos").trim();
  const normalizedCategory = normalizeText(rawCategory);
  return {
    ...store,
    img: resolveStoreCoverUrl(store.image_url, store.img),
    logoUrl: store.logo_url || store.logoUrl || "",
    location: store.floor || store.location || "Localizacao a confirmar",
    hours: store.hours || "10:00 - 22:00",
    desc: store.description || store.desc || "",
    whatsappUrl: store.whatsapp_url || store.whatsappUrl || "",
    instagramUrl: store.instagram_url || store.instagramUrl || "",
    category: rawCategory,
    categoryKey: normalizedCategory || "servicos"
  };
}

function renderStores(filter = "all") {
  currentStoreFilter = filter;
  storeGrid.innerHTML = "";
  const normalizedFilter = normalizeText(filter);
  const filtered = normalizedFilter === "all"
    ? stores
    : stores.filter((store) => store.categoryKey === normalizedFilter);
  const visibleStores = isShowingAllStores ? filtered : filtered.slice(0, INITIAL_STORE_LIMIT);

  visibleStores.forEach((store) => {
    const card = document.createElement("div");
    card.className = "store-card group cursor-pointer border border-slate-100";
    card.dataset.storeId = String(store.id ?? "");
    const logoBlock = `
      <div class="absolute z-20 -bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white p-1.5 shadow-md ring-1 ring-slate-100">
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
      <div class="p-6 text-slate-800">
        <span class="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600">${formatCategoryLabel(store.category)}</span>
        <h4 class="text-2xl font-serif italic mt-2 group-hover:text-marron transition-colors leading-tight">${store.name}</h4>
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
    servicos: "Serviços"
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

function renderCategoryFilters() {
  if (!categoryFilters) return;
  const uniqueCategories = [...new Set(stores.map((store) => store.categoryKey).filter(Boolean))];
  const orderedCategories = ["all", ...uniqueCategories.sort((a, b) => a.localeCompare(b, "pt-BR"))];

  categoryFilters.innerHTML = "";
  orderedCategories.forEach((categoryKey) => {
    const button = document.createElement("button");
    const isActive = currentStoreFilter === categoryKey;
    button.type = "button";
    button.className = `filter-btn px-7 py-3 rounded-full border border-marron text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-marron hover:text-white ${isActive ? "active bg-marron text-white" : "text-marron"}`;
    button.dataset.category = categoryKey;
    button.textContent = formatCategoryLabel(categoryKey);
    categoryFilters.appendChild(button);
  });
}

function renderEvents() {
  eventHighlight.innerHTML = "";
  eventList.innerHTML = "";
  if (!events.length) {
    eventState.textContent = "Nenhum evento cadastrado no momento.";
    return;
  }

  const sortedEvents = [...events].sort((a, b) => compareEventsByDate(a, b));
  const highlight = selectHighlightEvent(sortedEvents);
  const remaining = sortedEvents.filter((event) => event.id !== highlight.id).slice(0, 2);

  eventHighlight.innerHTML = `
    <div data-event-id="${highlight.id}" class="group relative event-card-large bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all cursor-pointer">
      <img src="${highlight.image_url || "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=1200"}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="${highlight.title}">
      <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-10 lg:p-16">
        <div class="flex items-center gap-4 text-amber-400 mb-4">
          <span class="px-4 py-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-[10px] font-bold uppercase tracking-widest">Destaque do Mes</span>
          <span class="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><i data-lucide="calendar" class="w-3 h-3"></i> ${highlight.event_date}</span>
        </div>
        <h4 class="text-4xl lg:text-5xl font-serif italic text-white mb-6">${highlight.title}</h4>
        <p class="text-white/70 text-lg max-w-xl leading-relaxed mb-8">${highlight.description}</p>
      </div>
    </div>
  `;

  remaining.forEach((event) => {
    const card = document.createElement("div");
    card.dataset.eventId = String(event.id ?? "");
    card.className = "group flex-1 bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col sm:flex-row lg:flex-col xl:flex-row";
    card.innerHTML = `
      <div class="sm:w-1/3 lg:w-full xl:w-1/3 h-48 sm:h-full lg:h-48 xl:h-full relative overflow-hidden">
        <img src="${event.image_url || "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=1200"}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="${event.title}">
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

function compareEventsByDate(first, second) {
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

/**
 * Animação de marquee baseada em requestAnimationFrame com pixels reais.
 * Substitui o keyframe CSS `calc(-100% / 3)` que é instável no iOS Safari
 * quando o elemento possui width:max-content — o browser usa a largura do
 * container como referência para %, quebrando o loop seamless.
 *
 * Estratégia:
 *  - 3 cópias idênticas no DOM → oneSetWidth = track.scrollWidth / 3
 *  - Avança position por tempo decorrido (timestamp-based, frame-rate agnóstico)
 *  - Quando position ≤ -oneSetWidth, reposiciona em 0 (wrap seamless)
 *  - Respeita document.hidden para não consumir CPU em abas ocultas
 */
function startGastronomyMarquee(track) {
  if (_gastronomyMarqueeRAF !== null) {
    cancelAnimationFrame(_gastronomyMarqueeRAF);
    _gastronomyMarqueeRAF = null;
  }

  track.style.willChange = "transform";

  const DURATION_PER_SET_MS = 7000;
  let position = 0;
  let lastTimestamp = null;
  let oneSetWidth = 0;

  function tick(timestamp) {
    if (lastTimestamp === null) lastTimestamp = timestamp;
    const elapsed = Math.min(timestamp - lastTimestamp, 64); // cap a 2 frames para evitar salto em tabs reativadas
    lastTimestamp = timestamp;

    if (!document.hidden && oneSetWidth > 0) {
      position -= (oneSetWidth / DURATION_PER_SET_MS) * elapsed;
      if (position <= -oneSetWidth) {
        position += oneSetWidth;
      }
      track.style.transform = "translateX(" + position.toFixed(3) + "px)";
    }

    _gastronomyMarqueeRAF = requestAnimationFrame(tick);
  }

  // Medir após um frame para garantir que o layout já foi calculado
  requestAnimationFrame(function () {
    oneSetWidth = track.scrollWidth / 3;
    _gastronomyMarqueeRAF = requestAnimationFrame(tick);
  });
}

function renderGastronomy() {
  if (_gastronomyMarqueeRAF !== null) {
    cancelAnimationFrame(_gastronomyMarqueeRAF);
    _gastronomyMarqueeRAF = null;
  }
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
        <h4 class="mt-3 text-2xl font-serif italic text-slate-900 leading-tight">${event.title}</h4>
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
    events = eventsData;
    gastronomyItems = dedupeGastronomyByStoreId(gastronomyData);
    renderCategoryFilters();
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

  modalTitle.innerText = store.name || "Loja";
  modalCat.innerText = store.category || "Categoria";
  modalDesc.innerText = store.desc || "Sem descrição disponível.";
  modalLoc.innerText = store.location || "Localização a confirmar";
  modalHours.innerText = store.hours || "Consulte a loja";
  modalImg.onerror = () => {
    modalImg.onerror = null;
    modalImg.src = DEFAULT_STORE_IMAGE_URL;
  };
  modalImg.src = store.img;

  modal.classList.add("is-open");
  document.body.style.overflow = "hidden";
  if (window.lucide) window.lucide.createIcons();
}

function openEventModal(eventData) {
  if (!eventModal) return;

  const eventModalTitle = document.getElementById("event-modal-title");
  const eventModalDate = document.getElementById("event-modal-date");
  const eventModalDesc = document.getElementById("event-modal-desc");
  const eventModalImg = document.getElementById("event-modal-img");

  if (!eventModalTitle || !eventModalDate || !eventModalDesc || !eventModalImg) return;

  eventModalTitle.innerText = eventData.title || "Evento";
  eventModalDate.innerText = eventData.event_date || "Data a confirmar";
  eventModalDesc.innerText = eventData.description || "Sem descricao disponivel.";
  eventModalImg.src = eventData.image_url || "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=1200";

  eventModal.classList.add("is-open");
  document.body.style.overflow = "hidden";
  if (window.lucide) window.lucide.createIcons();
}

function closeModal() {
  modal.classList.remove("is-open");
  document.body.style.overflow = "auto";
  const modalImg = document.getElementById("modal-img");
  if (modalImg) modalImg.onerror = null;
}

function closeEventModal() {
  if (!eventModal) return;
  eventModal.classList.remove("is-open");
  document.body.style.overflow = "auto";
}

document.getElementById("close-modal").onclick = closeModal;
modal.addEventListener("click", (event) => {
  if (event.target !== modal) return;
  closeModal();
});
if (eventModal) {
  const closeEventModalBtn = document.getElementById("close-event-modal");
  if (closeEventModalBtn) {
    closeEventModalBtn.onclick = closeEventModal;
  }

  eventModal.addEventListener("click", (event) => {
    if (event.target !== eventModal) return;
    closeEventModal();
  });
}
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (modal.classList.contains("is-open")) {
    closeModal();
    return;
  }
  if (eventModal && eventModal.classList.contains("is-open")) {
    closeEventModal();
  }
});

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

  const eventCard = clickTarget.closest("[data-event-id]");
  if (!eventCard) return;

  const eventId = Number(eventCard.getAttribute("data-event-id"));
  const selectedEvent = events.find((item) => Number(item.id) === eventId);
  if (!selectedEvent) return;

  openEventModal(selectedEvent);
});

fullCalendarGrid.addEventListener("click", (event) => {
  const clickTarget = event.target;
  if (!(clickTarget instanceof Element)) return;

  const eventCard = clickTarget.closest("[data-event-id]");
  if (!eventCard) return;

  const eventId = Number(eventCard.getAttribute("data-event-id"));
  const selectedEvent = events.find((item) => Number(item.id) === eventId);
  if (!selectedEvent) return;

  openEventModal(selectedEvent);
});

if (categoryFilters) {
  categoryFilters.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest("button[data-category]");
    if (!button) return;

    isShowingAllStores = false;
    currentStoreFilter = button.dataset.category || "all";
    renderCategoryFilters();
    renderStores(currentStoreFilter);
  });
}

toggleStoresBtn.addEventListener("click", () => {
  isShowingAllStores = !isShowingAllStores;
  renderStores(currentStoreFilter);
});

openCalendarBtn.addEventListener("click", showCalendarView);
backToEventsBtn.addEventListener("click", showPreviewView);

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
