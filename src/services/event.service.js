class EventService {
  constructor(eventRepository) {
    this.eventRepository = eventRepository;
  }

  async listEvents() {
    return this.eventRepository.listEvents();
  }

  normalizeImageUrls(payload) {
    if (Array.isArray(payload.imageUrls) && payload.imageUrls.length) {
      return payload.imageUrls.map((item) => String(item || "").trim()).filter(Boolean);
    }
    const single = payload.imageUrl != null ? String(payload.imageUrl).trim() : "";
    return single ? [single] : [];
  }

  buildEventWritePayload(payload) {
    const imageUrls = this.normalizeImageUrls(payload);
    const periodStart = payload.periodStart != null ? String(payload.periodStart).trim() : "";
    const periodEnd = payload.periodEnd != null ? String(payload.periodEnd).trim() : "";
    const recurrenceType = this.normalizeRecurrenceType(payload.recurrenceType);
    const weekdays = this.normalizeWeekdays(payload.weekdays);
    const specificDates = this.normalizeSpecificDates(payload.specificDates);
    const eventDate = this.formatEventPeriodLabel(periodStart, periodEnd);
    return {
      ...payload,
      eventDate,
      periodStart: periodStart || null,
      periodEnd: periodEnd || null,
      recurrenceType,
      weekdays,
      specificDates,
      imageUrls,
      imageUrl: imageUrls[0] || null
    };
  }

  normalizeRecurrenceType(value) {
    const normalized = String(value || "none").trim().toLowerCase();
    return ["none", "weekly", "specific_dates"].includes(normalized) ? normalized : "none";
  }

  normalizeWeekdays(value) {
    if (!Array.isArray(value)) return [];
    const set = new Set();
    value.forEach((item) => {
      const n = Number(item);
      if (Number.isInteger(n) && n >= 0 && n <= 6) set.add(n);
    });
    return [...set].sort((a, b) => a - b);
  }

  normalizeSpecificDates(value) {
    if (!Array.isArray(value)) return [];
    const set = new Set();
    value.forEach((item) => {
      const v = String(item || "").trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) set.add(v);
    });
    return [...set].sort();
  }

  formatEventPeriodLabel(periodStart, periodEnd) {
    const months = [
      "Janeiro",
      "Fevereiro",
      "Marco",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro"
    ];
    const parse = (value) => {
      const parts = String(value || "").split("-");
      if (parts.length !== 3) return null;
      const [year, month, day] = parts.map(Number);
      if (!year || !month || !day) return null;
      return { day, month };
    };
    const start = parse(periodStart);
    const end = parse(periodEnd);
    if (!start || !end) return "";
    if (start.day === end.day && start.month === end.month) {
      return `${start.day} de ${months[start.month - 1]}`;
    }
    if (start.month === end.month) {
      return `${start.day} a ${end.day} de ${months[start.month - 1]}`;
    }
    return `${start.day} de ${months[start.month - 1]} a ${end.day} de ${months[end.month - 1]}`;
  }

  validatePayload(payload) {
    const requiredFields = ["title", "description"];
    const missing = requiredFields.filter((field) => !payload[field] || !String(payload[field]).trim());
    if (missing.length > 0) {
      return `Campos obrigatorios faltando: ${missing.join(", ")}`;
    }
    const hasPeriodStart = Boolean(String(payload.periodStart || "").trim());
    const hasPeriodEnd = Boolean(String(payload.periodEnd || "").trim());
    if (hasPeriodStart !== hasPeriodEnd) {
      return "Para periodo do evento, informe inicio e fim.";
    }
    if (!hasPeriodStart || !hasPeriodEnd) {
      return "Preencha Data Inicio e Data Fim do evento.";
    }
    if (String(payload.periodEnd) < String(payload.periodStart)) {
      return "Data Fim nao pode ser anterior a Data Inicio.";
    }
    if (payload.recurrenceType === "weekly" && (!Array.isArray(payload.weekdays) || !payload.weekdays.length)) {
      return "Selecione ao menos um dia da semana para recorrencia semanal.";
    }
    if (payload.recurrenceType === "specific_dates" && (!Array.isArray(payload.specificDates) || !payload.specificDates.length)) {
      return "Adicione ao menos uma data especifica para este tipo de recorrencia.";
    }
    if (payload.recurrenceType === "specific_dates") {
      const outsidePeriod = payload.specificDates.some(
        (date) => String(date) < String(payload.periodStart) || String(date) > String(payload.periodEnd)
      );
      if (outsidePeriod) {
        return "Datas especificas devem estar dentro do periodo informado.";
      }
    }
    return null;
  }

  async createEvent(payload) {
    const normalized = this.buildEventWritePayload(payload);
    const error = this.validatePayload(normalized);
    if (error) throw new Error(error);
    return this.eventRepository.createEvent(normalized);
  }

  async updateEvent(id, payload) {
    const existing = await this.eventRepository.getEventById(id);
    if (!existing) throw new Error("Evento nao encontrado.");

    const normalized = this.buildEventWritePayload(payload);
    const error = this.validatePayload(normalized);
    if (error) throw new Error(error);
    return this.eventRepository.updateEvent(id, normalized);
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
