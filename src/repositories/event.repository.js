class EventRepository {
  constructor(db) {
    this.db = db;
  }

  async listEvents() {
    return this.db.all("SELECT * FROM events ORDER BY highlight DESC, id DESC");
  }

  async getEventById(id) {
    return this.db.get("SELECT * FROM events WHERE id = ?", id);
  }

  async createEvent(payload) {
    const result = await this.db.run(
      `INSERT INTO events (title, event_date, description, image_url, highlight, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      payload.title,
      payload.eventDate,
      payload.description,
      payload.imageUrl || null,
      payload.highlight ? 1 : 0
    );
    return this.getEventById(result.lastID);
  }

  async updateEvent(id, payload) {
    await this.db.run(
      `UPDATE events
       SET title = ?, event_date = ?, description = ?, image_url = ?, highlight = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      payload.title,
      payload.eventDate,
      payload.description,
      payload.imageUrl || null,
      payload.highlight ? 1 : 0,
      id
    );
    return this.getEventById(id);
  }

  async deleteEvent(id) {
    return this.db.run("DELETE FROM events WHERE id = ?", id);
  }
}

module.exports = {
  EventRepository
};
