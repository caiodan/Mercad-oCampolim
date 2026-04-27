class GastronomyService {
  constructor(gastronomyRepository) {
    this.gastronomyRepository = gastronomyRepository;
  }

  async listItems() {
    return this.gastronomyRepository.listItems();
  }

  async setGastronomyStoreSelection(storeIds) {
    const list = Array.isArray(storeIds) ? storeIds : [];
    return this.gastronomyRepository.setGastronomyStoreIds(list);
  }
}

module.exports = {
  GastronomyService
};
