class EventRepository {
  constructor(db) {
    this.db = db;
  }

  normalizeEventImages(row) {
    if (!row) return [];
    let images = Array.isArray(row.images) ? row.images : [];
    if (!images.length && typeof row.images === "string") {
      try {
        const parsed = JSON.parse(row.images);
        images = Array.isArray(parsed) ? parsed : [];
      } catch (_error) {
        images = [];
      }
    }
    const cleaned = images.map((item) => String(item || "").trim()).filter(Boolean);
    if (cleaned.length) return cleaned;
    const legacy = String(row.image_url || "").trim();
    return legacy ? [legacy] : [];
  }

  normalizeJsonArray(value, mapper = (item) => item) {
    let list = Array.isArray(value) ? value : [];
    if (!list.length && typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        list = Array.isArray(parsed) ? parsed : [];
      } catch (_error) {
        list = [];
      }
    }
    return list.map((item) => mapper(item)).filter((item) => item !== null && item !== undefined && item !== "");
  }

  augmentEventRow(row) {
    if (!row) return row;
    const images = this.normalizeEventImages(row);
    const weekdays = this.normalizeJsonArray(row.weekdays, (item) => {
      const n = Number(item);
      return Number.isInteger(n) && n >= 0 && n <= 6 ? n : null;
    });
    const specificDates = this.normalizeJsonArray(row.specific_dates, (item) => String(item || "").trim());
    return {
      ...row,
      images,
      image_url: images[0] || row.image_url || null,
      recurrence_type: String(row.recurrence_type || "none").trim() || "none",
      weekdays,
      specific_dates: specificDates
    };
  }

  async listEvents() {
    const rows = await this.db.all("SELECT * FROM events ORDER BY highlight DESC, id DESC");
    return rows.map((row) => this.augmentEventRow(row));
  }

  async getEventById(id) {
    const row = await this.db.get("SELECT * FROM events WHERE id = ?", id);
    return this.augmentEventRow(row);
  }

  async createEvent(payload) {
    const result = await this.db.run(
      `INSERT INTO events (title, event_date, period_start, period_end, recurrence_type, weekdays, specific_dates, description, image_url, images, highlight, updated_at)
       VALUES (?, ?, ?, ?, ?, ?::jsonb, ?::jsonb, ?, ?, ?::jsonb, ?, CURRENT_TIMESTAMP)`,
      payload.title,
      payload.eventDate,
      payload.periodStart || null,
      payload.periodEnd || null,
      payload.recurrenceType || "none",
      JSON.stringify(payload.weekdays || []),
      JSON.stringify(payload.specificDates || []),
      payload.description,
      payload.imageUrl || null,
      JSON.stringify(payload.imageUrls || []),
      payload.highlight ? 1 : 0
    );
    return this.getEventById(result.lastID);
  }

  async updateEvent(id, payload) {
    await this.db.run(
      `UPDATE events
       SET title = ?, event_date = ?, period_start = ?, period_end = ?, recurrence_type = ?, weekdays = ?::jsonb, specific_dates = ?::jsonb, description = ?, image_url = ?, images = ?::jsonb, highlight = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      payload.title,
      payload.eventDate,
      payload.periodStart || null,
      payload.periodEnd || null,
      payload.recurrenceType || "none",
      JSON.stringify(payload.weekdays || []),
      JSON.stringify(payload.specificDates || []),
      payload.description,
      payload.imageUrl || null,
      JSON.stringify(payload.imageUrls || []),
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
