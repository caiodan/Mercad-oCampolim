class GastronomyRepository {
  constructor(db) {
    this.db = db;
  }

  async listItems() {
    return this.db.all("SELECT * FROM gastronomy_items ORDER BY id DESC");
  }

  async getItemById(id) {
    return this.db.get("SELECT * FROM gastronomy_items WHERE id = ?", id);
  }

  async createItem(payload) {
    const result = await this.db.run(
      `INSERT INTO gastronomy_items (name, cuisine_type, location, description, image_url, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      payload.name,
      payload.cuisineType,
      payload.location,
      payload.description,
      payload.imageUrl || null
    );
    return this.getItemById(result.lastID);
  }

  async updateItem(id, payload) {
    await this.db.run(
      `UPDATE gastronomy_items
       SET name = ?, cuisine_type = ?, location = ?, description = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      payload.name,
      payload.cuisineType,
      payload.location,
      payload.description,
      payload.imageUrl || null,
      id
    );
    return this.getItemById(id);
  }

  async deleteItem(id) {
    return this.db.run("DELETE FROM gastronomy_items WHERE id = ?", id);
  }
}

module.exports = {
  GastronomyRepository
};
