function normalizeCategoriesFromRow(row) {
  if (!row) return [];
  const raw = row.categories;
  if (Array.isArray(raw) && raw.length) {
    return raw.map((c) => String(c || "").trim()).filter(Boolean);
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return Object.values(raw)
      .map((c) => String(c || "").trim())
      .filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((c) => String(c || "").trim()).filter(Boolean);
      }
    } catch (_) {
      /* ignore */
    }
  }
  return [];
}

function augmentStoreRow(row) {
  if (!row) return row;
  const categories = normalizeCategoriesFromRow(row);
  const category = categories[0] || "servicos";
  return { ...row, categories, category };
}

class StoreRepository {
  constructor(db) {
    this.db = db;
  }

  async listStores() {
    const rows = await this.db.all("SELECT * FROM stores ORDER BY id DESC");
    return rows.map(augmentStoreRow);
  }

  async getStoreById(id) {
    const row = await this.db.get("SELECT * FROM stores WHERE id = ?", id);
    return augmentStoreRow(row);
  }

  async createStore(payload) {
    const inGastro = payload.showInGastronomy ? 1 : 0;
    const categories = Array.isArray(payload.categories) ? payload.categories : [];
    const categoriesJson = JSON.stringify(categories);
    const result = await this.db.run(
      `INSERT INTO stores (name, categories, floor, description, image_url, logo_url, whatsapp_url, instagram_url, hours, show_in_gastronomy, updated_at)
       VALUES (?, ?::jsonb, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      payload.name,
      categoriesJson,
      payload.floor,
      payload.description,
      payload.imageUrl || null,
      payload.logoUrl || null,
      payload.whatsappUrl || null,
      payload.instagramUrl || null,
      payload.hours || "10:00 - 22:00",
      inGastro
    );
    return this.getStoreById(result.lastID);
  }

  async updateStore(id, payload) {
    const inGastro = payload.showInGastronomy ? 1 : 0;
    const categories = Array.isArray(payload.categories) ? payload.categories : [];
    const categoriesJson = JSON.stringify(categories);
    await this.db.run(
      `UPDATE stores
       SET name = ?, categories = ?::jsonb, floor = ?, description = ?, image_url = ?, logo_url = ?, whatsapp_url = ?, instagram_url = ?, hours = ?, show_in_gastronomy = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      payload.name,
      categoriesJson,
      payload.floor,
      payload.description,
      payload.imageUrl || null,
      payload.logoUrl || null,
      payload.whatsappUrl || null,
      payload.instagramUrl || null,
      payload.hours || "10:00 - 22:00",
      inGastro,
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
