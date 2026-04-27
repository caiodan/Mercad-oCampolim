class StoreService {
  constructor(storeRepository) {
    this.storeRepository = storeRepository;
  }

  async listStores() {
    return this.storeRepository.listStores();
  }

  validatePayload(payload) {
    const requiredFields = ["name", "category", "floor", "description"];
    const missing = requiredFields.filter((field) => !payload[field] || !payload[field].trim());
    if (missing.length > 0) {
      return `Campos obrigatorios faltando: ${missing.join(", ")}`;
    }
    if (!payload.hours || !String(payload.hours).trim()) {
      return "Campo obrigatorio faltando: hours";
    }
    return null;
  }

  async createStore(payload) {
    const error = this.validatePayload(payload);
    if (error) throw new Error(error);
    return this.storeRepository.createStore(payload);
  }

  async updateStore(id, payload) {
    const existing = await this.storeRepository.getStoreById(id);
    if (!existing) throw new Error("Loja nao encontrada.");

    const error = this.validatePayload(payload);
    if (error) throw new Error(error);

    return this.storeRepository.updateStore(id, payload);
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
