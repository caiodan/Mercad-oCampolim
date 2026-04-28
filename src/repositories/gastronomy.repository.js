class GastronomyRepository {
  constructor(db) {
    this.db = db;
  }

  async listItems() {
    return this.db.all(
      `SELECT id, name,
              COALESCE(categories #>> '{0}', category) AS cuisine_type,
              floor AS location, description, image_url
       FROM stores
       WHERE COALESCE(show_in_gastronomy, 0) = 1
       ORDER BY id DESC`
    );
  }

  async setGastronomyStoreIds(storeIds) {
    const uniqueRequested = [...new Set(storeIds.map(Number).filter((n) => Number.isFinite(n) && n > 0))];
    await this.db.exec("BEGIN");
    try {
      await this.db.run("UPDATE stores SET show_in_gastronomy = 0");

      if (uniqueRequested.length === 0) {
        await this.db.exec("COMMIT");
        return;
      }

      const placeholders = uniqueRequested.map(() => "?").join(", ");
      const rows = await this.db.all(
        `SELECT id FROM stores WHERE id IN (${placeholders})`,
        ...uniqueRequested
      );
      const existingIds = new Set(rows.map((r) => Number(r.id)));

      for (const id of uniqueRequested) {
        if (!existingIds.has(id)) continue;
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
