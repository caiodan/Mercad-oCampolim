const loginSection = document.getElementById("loginSection");
const panelSection = document.getElementById("panelSection");
const loginForm = document.getElementById("loginForm");
const storeForm = document.getElementById("storeForm");
const adminStoresGrid = document.getElementById("adminStoresGrid");
const adminState = document.getElementById("adminState");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const openStoreFormBtn = document.getElementById("openStoreFormBtn");
const eventForm = document.getElementById("eventForm");
const adminEventsGrid = document.getElementById("adminEventsGrid");
const adminEventsState = document.getElementById("adminEventsState");
const cancelEventEditBtn = document.getElementById("cancelEventEditBtn");
const openEventFormBtn = document.getElementById("openEventFormBtn");
const adminGastronomyList = document.getElementById("adminGastronomyList");
const adminGastronomyState = document.getElementById("adminGastronomyState");
const saveGastronomySelectionBtn = document.getElementById("saveGastronomySelectionBtn");
const gastronomySelectionPanel = document.getElementById("gastronomySelectionPanel");
const openGastronomyPanelBtn = document.getElementById("openGastronomyPanelBtn");
const adminUserMenu = document.getElementById("adminUserMenu");
const adminUserMenuBtn = document.getElementById("adminUserMenuBtn");
const adminUserDropdown = document.getElementById("adminUserDropdown");
const adminUserEmail = document.getElementById("adminUserEmail");
const headerLogoutBtn = document.getElementById("headerLogoutBtn");

const TOKEN_KEY = "mercado_admin_token";
/** Aviso no front; o servidor aceita ate ~25 MB (ver uploadImage). */
const IMAGE_SOFT_LIMIT_BYTES = 5 * 1024 * 1024;

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setAuthMode(isAuthenticated) {
  loginSection.classList.toggle("hidden", isAuthenticated);
  panelSection.classList.toggle("hidden", !isAuthenticated);
  adminUserMenu.classList.toggle("hidden", !isAuthenticated);
  if (!isAuthenticated) {
    adminUserDropdown.classList.add("hidden");
  }
}

function clearImageSoftHints(root) {
  root.querySelectorAll("[data-image-soft-warn]").forEach((el) => {
    el.classList.add("hidden");
    el.textContent = "";
  });
}

function clearImageSoftHintForFileInput(input) {
  if (!input) return;
  const warn = input.parentElement?.querySelector("[data-image-soft-warn]");
  if (!warn) return;
  warn.classList.add("hidden");
  warn.textContent = "";
}

function setupImageSoftLimitWarnings() {
  const fileInputs = document.querySelectorAll(
    'input[type="file"][accept*="image"][data-store-file-for], input[type="file"][accept*="image"][data-event-file-for]'
  );
  fileInputs.forEach((input) => {
    input.addEventListener("change", () => {
      const warn = input.parentElement?.querySelector("[data-image-soft-warn]");
      if (!warn) return;
      const file = input.files?.[0];
      if (!file || file.size <= IMAGE_SOFT_LIMIT_BYTES) {
        warn.classList.add("hidden");
        warn.textContent = "";
        return;
      }
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      warn.textContent = `Aviso: ~${mb} MB (acima da recomendacao de 5 MB). O envio continuara ao salvar.`;
      warn.classList.remove("hidden");
    });
  });
}

function getStoreCategoriesFromApi(store) {
  if (Array.isArray(store.categories) && store.categories.length) {
    return store.categories.map((c) => String(c || "").trim()).filter(Boolean);
  }
  if (store.category) return [String(store.category).trim()].filter(Boolean);
  return [];
}

function formatAdminCategoriesLine(store) {
  const cats = getStoreCategoriesFromApi(store);
  if (!cats.length) return "";
  return cats.join(" · ");
}

function setStoreFormCategoriesChecked(selected) {
  const set = new Set(selected.map((c) => String(c || "").trim()).filter(Boolean));
  storeForm.querySelectorAll('input[name="categories"][type="checkbox"]').forEach((cb) => {
    cb.checked = set.has(cb.value);
  });
}

function resetForm() {
  storeForm.reset();
  storeForm.elements.id.value = "";
  setStoreFormCategoriesChecked([]);
  cancelEditBtn.classList.add("hidden");
  clearImageSoftHints(storeForm);
  closeStoreForm();
}

function resetEventForm() {
  eventForm.reset();
  eventForm.elements.id.value = "";
  eventForm.elements.highlight.checked = false;
  cancelEventEditBtn.classList.add("hidden");
  clearImageSoftHints(eventForm);
  closeEventForm();
}

function openStoreForm() {
  storeForm.classList.remove("hidden");
  storeForm.classList.add("grid");
  openStoreFormBtn.textContent = "Fechar";
}

function openEventForm() {
  eventForm.classList.remove("hidden");
  eventForm.classList.add("grid");
  openEventFormBtn.textContent = "Fechar";
}

function closeStoreForm() {
  storeForm.classList.add("hidden");
  storeForm.classList.remove("grid");
  openStoreFormBtn.textContent = "Adicionar loja";
}

function closeEventForm() {
  eventForm.classList.add("hidden");
  eventForm.classList.remove("grid");
  openEventFormBtn.textContent = "Adicionar evento";
}

function openGastronomySelectionPanel() {
  gastronomySelectionPanel.classList.remove("hidden");
  openGastronomyPanelBtn.textContent = "Fechar";
}

function closeGastronomySelectionPanel() {
  gastronomySelectionPanel.classList.add("hidden");
  openGastronomyPanelBtn.textContent = "Gerenciar selecao";
}

function setAdminMessage(message, type = "default") {
  adminState.className = "ml-auto w-fit rounded-xl bg-white px-4 py-2 text-xs font-semibold";
  adminState.style.boxShadow = "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px";
  if (type === "error") {
    adminState.classList.add("text-red-700");
  } else {
    adminState.classList.add("text-slate-600");
  }
  adminState.textContent = message;
}

function setEventsMessage(message, type = "default") {
  adminEventsState.className = "ml-auto w-fit rounded-xl bg-white px-4 py-2 text-xs font-semibold";
  adminEventsState.style.boxShadow = "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px";
  if (type === "error") {
    adminEventsState.classList.add("text-red-700");
  } else {
    adminEventsState.classList.add("text-slate-600");
  }
  adminEventsState.textContent = message;
}

function setGastronomyMessage(message, type = "default") {
  adminGastronomyState.className = "ml-auto w-fit rounded-xl bg-white px-4 py-2 text-xs font-semibold";
  adminGastronomyState.style.boxShadow = "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px";
  if (type === "error") {
    adminGastronomyState.classList.add("text-red-700");
  } else {
    adminGastronomyState.classList.add("text-slate-600");
  }
  adminGastronomyState.textContent = message;
}

function createActionButton(label, className, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = className;
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}

function parseHoursRange(hours) {
  const value = String(hours || "");
  const match = value.match(/^\s*(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\s*$/);
  if (!match) {
    return { openTime: "10:00", closeTime: "22:00" };
  }
  return { openTime: match[1], closeTime: match[2] };
}

function createAdminCard(store) {
  const card = document.createElement("article");
  card.className = "store-card group border border-slate-100";
  card.innerHTML = `
    <div class="relative">
      <div class="aspect-[16/9] overflow-hidden">
        <img src="${store.image_url || "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200"}" class="w-full h-full object-cover" alt="${store.name}">
      </div>
      <div class="absolute z-20 -bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white p-1 shadow-md ring-1 ring-slate-100">
        ${
          store.logo_url
            ? `<img src="${store.logo_url}" alt="Logo ${store.name}" class="w-full h-full rounded-full object-cover">`
            : `<div class="w-full h-full rounded-full bg-marron text-white flex items-center justify-center text-base font-bold">${String(store.name || "L").charAt(0).toUpperCase()}</div>`
        }
      </div>
    </div>
    <div class="p-6 pt-11 text-slate-800 mt-[8px]">
      <span class="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600">${formatAdminCategoriesLine(store)}</span>
      <h4 class="text-2xl font-serif italic mt-2 uppercase group-hover:text-marron transition-colors leading-tight">${store.name}</h4>
      <div class="flex items-center gap-2 text-[11px] text-slate-400 mt-5 border-t border-slate-50 pt-4">
        <i data-lucide="map-pin" class="w-3 h-3 text-marron"></i>
        <span class="font-bold uppercase tracking-widest">${store.floor}</span>
      </div>
      <div class="flex items-center gap-2 text-[11px] text-slate-400 mt-3">
        <i data-lucide="clock-3" class="w-3 h-3 text-marron"></i>
        <span class="font-bold uppercase tracking-widest">${store.hours || "10:00 - 22:00"}</span>
      </div>
      <div class="mt-4 flex justify-end gap-2" data-store-actions></div>
    </div>
  `;

  const actions = card.querySelector("[data-store-actions]");

  const editButton = createActionButton(
    "Editar",
    "px-4 py-2 rounded-full border border-slate-300 bg-white text-[10px] font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-100 transition-colors",
    () => {
      openStoreForm();
      storeForm.elements.id.value = String(store.id);
      storeForm.elements.name.value = store.name;
      setStoreFormCategoriesChecked(getStoreCategoriesFromApi(store));
      storeForm.elements.floor.value = store.floor;
      const { openTime, closeTime } = parseHoursRange(store.hours || "10:00 - 22:00");
      storeForm.elements.openTime.value = openTime;
      storeForm.elements.closeTime.value = closeTime;
      storeForm.elements.description.value = store.description;
      storeForm.elements.imageUrl.value = store.image_url || "";
      storeForm.elements.logoUrl.value = store.logo_url || "";
      storeForm.elements.whatsappUrl.value = store.whatsapp_url || "";
      storeForm.elements.instagramUrl.value = store.instagram_url || "";
      cancelEditBtn.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  );

  const deleteButton = createActionButton(
    "Excluir",
    "px-4 py-2 rounded-full bg-red-700 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-800 transition-colors",
    async () => {
      if (!confirm(`Excluir a loja "${store.name}"?`)) return;
      try {
        await apiRequest(`/api/admin/stores/${store.id}`, { method: "DELETE" });
        await loadAdminStores();
        await loadGastronomySelection();
        setAdminMessage("Loja removida com sucesso.", "success");
      } catch (error) {
        setAdminMessage(error.message || "Erro ao remover loja.", "error");
      }
    }
  );

  actions.append(editButton, deleteButton);
  return card;
}

function createAdminEventCard(event) {
  const card = document.createElement("article");
  card.className = "rounded-[1.5rem] overflow-hidden bg-white border border-[#eddcd2] shadow-sm h-full flex flex-col";
  card.innerHTML = `
    <div class="h-52 overflow-hidden">
      <img src="${event.image_url || "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=1200"}" class="w-full h-full object-cover" alt="${event.title}">
    </div>
    <div class="p-6 flex-1 flex flex-col">
      <div class="flex items-center justify-between gap-3">
        <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">${event.event_date}</span>
        ${event.highlight ? '<span class="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[10px] uppercase tracking-widest font-bold text-amber-700">Destaque</span>' : ""}
      </div>
      <h4 class="mt-3 text-2xl font-serif italic text-slate-900 leading-tight">${event.title}</h4>
      <p class="mt-3 text-sm text-slate-500 leading-relaxed" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${event.description}</p>
      <div class="mt-auto pt-4 flex justify-end gap-2" data-event-actions></div>
    </div>
  `;

  const actions = card.querySelector("[data-event-actions]");

  const editButton = createActionButton(
    "Editar",
    "px-4 py-2 rounded-full border border-slate-300 bg-white text-[10px] font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-100 transition-colors",
    () => {
      eventForm.elements.id.value = String(event.id);
      openEventForm();
      eventForm.elements.title.value = event.title;
      eventForm.elements.eventDate.value = event.event_date;
      eventForm.elements.description.value = event.description;
      eventForm.elements.imageUrl.value = event.image_url || "";
      eventForm.elements.highlight.checked = Boolean(event.highlight);
      cancelEventEditBtn.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  );

  const deleteButton = createActionButton(
    "Excluir",
    "px-4 py-2 rounded-full bg-red-700 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-800 transition-colors",
    async () => {
      if (!confirm(`Excluir o evento "${event.title}"?`)) return;
      await apiRequest(`/api/admin/events/${event.id}`, { method: "DELETE" });
      await loadAdminEvents();
      setAdminMessage("Evento removido com sucesso.", "success");
    }
  );

  actions.append(editButton, deleteButton);
  return card;
}

function renderGastronomyStoreRow(store) {
  const label = document.createElement("label");
  label.className =
    "flex items-start gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100";
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.name = "gastro_store";
  cb.value = String(store.id);
  cb.checked = Number(store.show_in_gastronomy) === 1;
  cb.className = "mt-1 shrink-0";
  const wrap = document.createElement("div");
  const title = document.createElement("span");
  title.className = "block text-sm font-semibold text-slate-800";
  title.textContent = store.name || "";
  const sub = document.createElement("span");
  sub.className = "block text-[11px] text-slate-500 mt-0.5";
  sub.textContent = [formatAdminCategoriesLine(store), store.floor || ""].filter(Boolean).join(" · ");
  wrap.appendChild(title);
  wrap.appendChild(sub);
  label.appendChild(cb);
  label.appendChild(wrap);
  return label;
}

async function apiRequest(url, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let message = "Falha na requisicao.";
    try {
      const body = await response.json();
      message = body.message || message;
    } catch (_error) {}
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      setAuthMode(false);
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function uploadAdminImageFile(file) {
  if (!file) {
    throw new Error("Selecione um arquivo de imagem.");
  }
  const token = getToken();
  if (!token) {
    throw new Error("Sessao expirada. Faca login novamente.");
  }
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/admin/uploads/image", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body
  });
  if (!response.ok) {
    let message = "Falha no upload.";
    try {
      const data = await response.json();
      message = data.message || message;
    } catch (_err) {}
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      setAuthMode(false);
    }
    throw new Error(message);
  }
  return response.json();
}

function decodeJwtPayload(token) {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalized = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const json = atob(normalized);
    return JSON.parse(json);
  } catch (_error) {
    return null;
  }
}

async function performLogout() {
  try {
    await apiRequest("/api/admin/logout", { method: "POST" });
  } catch (_error) {}
  localStorage.removeItem(TOKEN_KEY);
  setAuthMode(false);
  resetForm();
  resetEventForm();
  closeGastronomySelectionPanel();
  adminStoresGrid.innerHTML = "";
  adminEventsGrid.innerHTML = "";
  adminGastronomyList.innerHTML = "";
  window.location.href = "/admin-login";
}

async function loadAdminStores() {
  try {
    setAdminMessage("Carregando lojas...");
    const stores = await apiRequest("/api/admin/stores");
    adminStoresGrid.innerHTML = "";
    stores.forEach((store) => adminStoresGrid.appendChild(createAdminCard(store)));
    if (window.lucide) window.lucide.createIcons();
    setAdminMessage(`${stores.length} loja(s) cadastrada(s).`, "success");
  } catch (error) {
    setAdminMessage(error.message, "error");
  }
}

async function loadAdminEvents() {
  try {
    setEventsMessage("Carregando eventos...");
    const events = await apiRequest("/api/admin/events");
    adminEventsGrid.innerHTML = "";
    events.forEach((event) => adminEventsGrid.appendChild(createAdminEventCard(event)));
    if (window.lucide) window.lucide.createIcons();
    setEventsMessage(`${events.length} evento(s) cadastrado(s).`);
  } catch (error) {
    setAdminMessage(error.message, "error");
    setEventsMessage("Falha ao carregar eventos.", "error");
  }
}

async function loadGastronomySelection() {
  try {
    setGastronomyMessage("Carregando lojas...");
    const stores = await apiRequest("/api/admin/stores");
    const sorted = [...stores].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "pt"));
    adminGastronomyList.innerHTML = "";
    sorted.forEach((store) => adminGastronomyList.appendChild(renderGastronomyStoreRow(store)));
    const selected = stores.filter((s) => Number(s.show_in_gastronomy) === 1).length;
    setGastronomyMessage(`${selected} loja(s) na vitrine de gastronomia (de ${stores.length} cadastradas).`);
  } catch (error) {
    setGastronomyMessage(error.message, "error");
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const payload = {
    email: String(formData.get("email") || "").trim(),
    password: String(formData.get("password") || "")
  };

  try {
    const data = await apiRequest("/api/admin/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    setAuthMode(true);
    adminUserEmail.textContent = data.admin.email;
    setAdminMessage(`Autenticado como ${data.admin.email}.`, "success");
    await loadAdminStores();
    await loadAdminEvents();
  } catch (error) {
    alert(error.message);
  }
});

openGastronomyPanelBtn.addEventListener("click", () => {
  const isOpen = !gastronomySelectionPanel.classList.contains("hidden");
  if (isOpen) {
    closeGastronomySelectionPanel();
    return;
  }
  openGastronomySelectionPanel();
  loadGastronomySelection();
});

saveGastronomySelectionBtn.addEventListener("click", async () => {
  try {
    saveGastronomySelectionBtn.disabled = true;
    const ids = [...adminGastronomyList.querySelectorAll('input[name="gastro_store"]:checked')].map((el) =>
      Number(el.value)
    );
    await apiRequest("/api/admin/gastronomy/selection", {
      method: "PUT",
      body: JSON.stringify({ storeIds: ids })
    });
    setGastronomyMessage("Selecao salva com sucesso.");
    await loadGastronomySelection();
  } catch (error) {
    setGastronomyMessage(error.message, "error");
  } finally {
    saveGastronomySelectionBtn.disabled = false;
  }
});

storeForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const imageFileInput = storeForm.querySelector('[data-store-file-for="imageUrl"]');
  const logoFileInput = storeForm.querySelector('[data-store-file-for="logoUrl"]');
  const submitBtn = storeForm.querySelector('button[type="submit"]');
  const previousSubmitLabel = submitBtn ? submitBtn.textContent : "Salvar loja";

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Processando...";
    }

    if (imageFileInput?.files?.[0]) {
      setAdminMessage("Enviando imagem principal...");
      if (submitBtn) submitBtn.textContent = "Enviando imagem...";
      const cover = await uploadAdminImageFile(imageFileInput.files[0]);
      storeForm.elements.imageUrl.value = cover.url || "";
      imageFileInput.value = "";
      clearImageSoftHintForFileInput(imageFileInput);
    }

    if (logoFileInput?.files?.[0]) {
      setAdminMessage("Enviando logo...");
      if (submitBtn) submitBtn.textContent = "Enviando logo...";
      const logo = await uploadAdminImageFile(logoFileInput.files[0]);
      storeForm.elements.logoUrl.value = logo.url || "";
      logoFileInput.value = "";
      clearImageSoftHintForFileInput(logoFileInput);
    }

    const formData = new FormData(storeForm);
    const id = String(formData.get("id") || "");

    const categories = formData.getAll("categories").map((v) => String(v || "").trim()).filter(Boolean);
    if (!categories.length) {
      setAdminMessage("Marque ao menos uma categoria.", "error");
      return;
    }

    const payload = {
      name: String(formData.get("name") || "").trim(),
      categories,
      floor: String(formData.get("floor") || "").trim(),
      hours: `${String(formData.get("openTime") || "").trim()} - ${String(formData.get("closeTime") || "").trim()}`,
      description: String(formData.get("description") || "").trim(),
      imageUrl: String(formData.get("imageUrl") || "").trim(),
      logoUrl: String(formData.get("logoUrl") || "").trim(),
      whatsappUrl: String(formData.get("whatsappUrl") || "").trim(),
      instagramUrl: String(formData.get("instagramUrl") || "").trim()
    };

    setAdminMessage("Salvando loja...");
    if (submitBtn) submitBtn.textContent = "Salvando...";

    let successMessage = "";
    if (id) {
      await apiRequest(`/api/admin/stores/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      successMessage = "Loja atualizada com sucesso.";
    } else {
      await apiRequest("/api/admin/stores", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      successMessage = "Loja criada com sucesso.";
    }
    resetForm();
    await loadAdminStores();
    await loadGastronomySelection();
    setAdminMessage(successMessage, "success");
  } catch (error) {
    setAdminMessage(error.message || "Erro ao salvar loja.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = previousSubmitLabel;
    }
  }
});

cancelEditBtn.addEventListener("click", resetForm);
openStoreFormBtn.addEventListener("click", () => {
  const isOpen = !storeForm.classList.contains("hidden");
  if (isOpen) {
    resetForm();
    return;
  }
  openStoreForm();
});

eventForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const fileInput = eventForm.querySelector('[data-event-file-for="imageUrl"]');
  const submitBtn = eventForm.querySelector('button[type="submit"]');
  const previousSubmitLabel = submitBtn ? submitBtn.textContent : "Salvar evento";

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Processando...";
    }

    if (fileInput?.files?.[0]) {
      setAdminMessage("Enviando imagem do evento...");
      if (submitBtn) submitBtn.textContent = "Enviando imagem...";
      const uploaded = await uploadAdminImageFile(fileInput.files[0]);
      eventForm.elements.imageUrl.value = uploaded.url || "";
      fileInput.value = "";
      clearImageSoftHintForFileInput(fileInput);
    }

    const formData = new FormData(eventForm);
    const id = String(formData.get("id") || "");
    const payload = {
      title: String(formData.get("title") || "").trim(),
      eventDate: String(formData.get("eventDate") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      imageUrl: String(formData.get("imageUrl") || "").trim(),
      highlight: formData.get("highlight") === "on"
    };

    setAdminMessage("Salvando evento...");
    if (submitBtn) submitBtn.textContent = "Salvando...";

    if (id) {
      await apiRequest(`/api/admin/events/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      setAdminMessage("Evento atualizado com sucesso.", "success");
    } else {
      await apiRequest("/api/admin/events", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setAdminMessage("Evento criado com sucesso.", "success");
    }
    resetEventForm();
    await loadAdminEvents();
  } catch (error) {
    setAdminMessage(error.message, "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = previousSubmitLabel;
    }
  }
});

cancelEventEditBtn.addEventListener("click", resetEventForm);
openEventFormBtn.addEventListener("click", () => {
  const isOpen = !eventForm.classList.contains("hidden");
  if (isOpen) {
    resetEventForm();
    return;
  }
  openEventForm();
});
adminUserMenuBtn.addEventListener("click", () => {
  adminUserDropdown.classList.toggle("hidden");
});
headerLogoutBtn.addEventListener("click", performLogout);
document.addEventListener("click", (event) => {
  if (adminUserMenu.contains(event.target)) return;
  adminUserDropdown.classList.add("hidden");
});

async function bootstrap() {
  const isLoginRoute = window.location.pathname === "/admin-login";
  const token = getToken();
  const payload = decodeJwtPayload(token);
  if (payload?.email) {
    adminUserEmail.textContent = payload.email;
  }

  try {
    const session = await apiRequest("/api/admin/session");
    adminUserEmail.textContent = session?.admin?.email || adminUserEmail.textContent || "Administrador";
    setAuthMode(true);

    if (isLoginRoute) {
      window.location.href = "/admin";
      return;
    }

    await loadAdminStores();
    await loadAdminEvents();
  } catch (_error) {
    setAuthMode(false);
    localStorage.removeItem(TOKEN_KEY);
    if (!isLoginRoute) {
      window.location.href = "/admin-login";
    }
  }
}

setupImageSoftLimitWarnings();
bootstrap();
