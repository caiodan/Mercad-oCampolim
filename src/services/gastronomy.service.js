class GastronomyService {
  constructor(gastronomyRepository) {
    this.gastronomyRepository = gastronomyRepository;
  }

  async listItems() {
    return this.gastronomyRepository.listItems();
  }

  validatePayload(payload) {
    const requiredFields = ["name", "cuisineType", "location", "description"];
    const missing = requiredFields.filter((field) => !payload[field] || !String(payload[field]).trim());
    if (missing.length > 0) {
      return `Campos obrigatorios faltando: ${missing.join(", ")}`;
    }
    return null;
  }

  async createItem(payload) {
    const error = this.validatePayload(payload);
    if (error) throw new Error(error);
    return this.gastronomyRepository.createItem(payload);
  }

  async updateItem(id, payload) {
    const existing = await this.gastronomyRepository.getItemById(id);
    if (!existing) throw new Error("Item de gastronomia nao encontrado.");

    const error = this.validatePayload(payload);
    if (error) throw new Error(error);
    return this.gastronomyRepository.updateItem(id, payload);
  }

  async deleteItem(id) {
    const existing = await this.gastronomyRepository.getItemById(id);
    if (!existing) throw new Error("Item de gastronomia nao encontrado.");
    await this.gastronomyRepository.deleteItem(id);
  }
}

module.exports = {
  GastronomyService
};
