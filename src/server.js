const path = require("path");
const express = require("express");
const { initDb } = require("./db");
const { StoreRepository } = require("./repositories/store.repository");
const { EventRepository } = require("./repositories/event.repository");
const { GastronomyRepository } = require("./repositories/gastronomy.repository");
const { StoreService } = require("./services/store.service");
const { EventService } = require("./services/event.service");
const { GastronomyService } = require("./services/gastronomy.service");
const { createPublicRoutes } = require("./routes/public.routes");
const { createAdminRoutes } = require("./routes/admin.routes");

async function bootstrap() {
  const app = express();
  const port = process.env.PORT || 3000;
  const db = await initDb();

  const storeRepository = new StoreRepository(db);
  const eventRepository = new EventRepository(db);
  const gastronomyRepository = new GastronomyRepository(db);
  const storeService = new StoreService(storeRepository);
  const eventService = new EventService(eventRepository);
  const gastronomyService = new GastronomyService(gastronomyRepository);

  app.use(express.json());
  app.use(express.static(path.join(__dirname, "..", "public")));

  app.use("/api/public", createPublicRoutes(storeService, eventService, gastronomyService));
  app.use("/api/admin", createAdminRoutes(db, storeService, eventService, gastronomyService));

  app.get("/admin-login", (_req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "admin.html"));
  });

  app.get("/admin", (_req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "admin.html"));
  });

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: "Erro interno inesperado." });
  });

  app.listen(port, () => {
    console.log(`Servidor online em http://localhost:${port}`);
    console.log("Admin: admin@mercado.local / Admin@123");
  });
}

bootstrap();
