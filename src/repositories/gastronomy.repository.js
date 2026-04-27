class GastronomyRepository {
  constructor(db) {
    this.db = db;
  }

  async listItems() {
    return this.db.all(
      `SELECT id, name, category AS cuisine_type, floor AS location, description, image_url
       FROM stores
       WHERE COALESCE(show_in_gastronomy, 0) = 1
       ORDER BY id DESC`
    );
  }

  async setGastronomyStoreIds(storeIds) {
    const clean = [...new Set(storeIds.map(Number).filter((n) => Number.isFinite(n) && n > 0))];
    await this.db.exec("BEGIN");
    try {
      await this.db.run("UPDATE stores SET show_in_gastronomy = 0");
      for (const id of clean) {
        await this.db.run("UPDATE stores SET show_in_gastronomy = 1 WHERE id = ?", id);
      }
      await this.db.exec("COMMIT");
    } catch (error) {
      await this.db.exec("ROLLBACK");
      throw error;
    }
  }
}

module.exports = {
  GastronomyRepository
};
