class StoreService {
  constructor(storeRepository) {
    this.storeRepository = storeRepository;
  }

  async listStores() {
    return this.storeRepository.listStores();
  }

  /** Monta lista deduplicada a partir de categories[]. */
  normalizeCategories(payload) {
    let list = [];
    if (Array.isArray(payload.categories)) {
      list = payload.categories.map((c) => String(c || "").trim()).filter(Boolean);
    }
    const seen = new Set();
    const out = [];
    for (const c of list) {
      if (seen.has(c)) continue;
      seen.add(c);
      out.push(c);
    }
    return out;
  }

  validatePayload(payload) {
    const missingName = !payload.name || !String(payload.name).trim();
    const missingFloor = !payload.floor || !String(payload.floor).trim();
    const missingDesc = !payload.description || !String(payload.description).trim();
    const missing = [];
    if (missingName) missing.push("name");
    if (missingFloor) missing.push("floor");
    if (missingDesc) missing.push("description");
    if (missing.length > 0) {
      return `Campos obrigatorios faltando: ${missing.join(", ")}`;
    }
    const categories = this.normalizeCategories(payload);
    if (categories.length === 0) {
      return "Informe ao menos uma categoria.";
    }
    if (!payload.hours || !String(payload.hours).trim()) {
      return "Campo obrigatorio faltando: hours";
    }
    return null;
  }

  buildStoreWritePayload(payload) {
    const categories = this.normalizeCategories(payload);
    return {
      ...payload,
      categories
    };
  }

  async createStore(payload) {
    const error = this.validatePayload(payload);
    if (error) throw new Error(error);
    return this.storeRepository.createStore(this.buildStoreWritePayload(payload));
  }

  async updateStore(id, payload) {
    const existing = await this.storeRepository.getStoreById(id);
    if (!existing) throw new Error("Loja nao encontrada.");

    const error = this.validatePayload(payload);
    if (error) throw new Error(error);

    const merged = {
      ...this.buildStoreWritePayload(payload),
      showInGastronomy:
        payload.showInGastronomy !== undefined ? payload.showInGastronomy : Boolean(existing.show_in_gastronomy)
    };
    return this.storeRepository.updateStore(id, merged);
  }

  async deleteStore(id) {
    const existing = await this.storeRepository.getStoreById(id);
    if (!existing) throw new Error("Loja nao encontrada.");
    await this.storeRepository.deleteStore(id);
  }
}

module.exports = {
  StoreService
};
