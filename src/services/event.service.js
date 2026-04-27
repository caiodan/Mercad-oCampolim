class EventService {
  constructor(eventRepository) {
    this.eventRepository = eventRepository;
  }

  async listEvents() {
    return this.eventRepository.listEvents();
  }

  validatePayload(payload) {
    const requiredFields = ["title", "eventDate", "description"];
    const missing = requiredFields.filter((field) => !payload[field] || !String(payload[field]).trim());
    if (missing.length > 0) {
      return `Campos obrigatorios faltando: ${missing.join(", ")}`;
    }
    return null;
  }

  async createEvent(payload) {
    const error = this.validatePayload(payload);
    if (error) throw new Error(error);
    return this.eventRepository.createEvent(payload);
  }

  async updateEvent(id, payload) {
    const existing = await this.eventRepository.getEventById(id);
    if (!existing) throw new Error("Evento nao encontrado.");

    const error = this.validatePayload(payload);
    if (error) throw new Error(error);
    return this.eventRepository.updateEvent(id, payload);
  }

  async deleteEvent(id) {
    const existing = await this.eventRepository.getEventById(id);
    if (!existing) throw new Error("Evento nao encontrado.");
    await this.eventRepository.deleteEvent(id);
  }
}

module.exports = {
  EventService
};
