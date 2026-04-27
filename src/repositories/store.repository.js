class StoreRepository {
  constructor(db) {
    this.db = db;
  }

  async listStores() {
    return this.db.all("SELECT * FROM stores ORDER BY id DESC");
  }

  async getStoreById(id) {
    return this.db.get("SELECT * FROM stores WHERE id = ?", id);
  }

  async createStore(payload) {
    const result = await this.db.run(
      `INSERT INTO stores (name, category, floor, description, image_url, logo_url, whatsapp_url, instagram_url, hours, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      payload.name,
      payload.category,
      payload.floor,
      payload.description,
      payload.imageUrl || null,
      payload.logoUrl || null,
      payload.whatsappUrl || null,
      payload.instagramUrl || null,
      payload.hours || "10:00 - 22:00"
    );
    return this.getStoreById(result.lastID);
  }

  async updateStore(id, payload) {
    await this.db.run(
      `UPDATE stores
       SET name = ?, category = ?, floor = ?, description = ?, image_url = ?, logo_url = ?, whatsapp_url = ?, instagram_url = ?, hours = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      payload.name,
      payload.category,
      payload.floor,
      payload.description,
      payload.imageUrl || null,
      payload.logoUrl || null,
      payload.whatsappUrl || null,
      payload.instagramUrl || null,
      payload.hours || "10:00 - 22:00",
      id
    );
    return this.getStoreById(id);
  }

  async deleteStore(id) {
    return this.db.run("DELETE FROM stores WHERE id = ?", id);
  }
}

module.exports = {
  StoreRepository
};
