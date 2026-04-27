const express = require("express");

function createPublicRoutes(storeService, eventService, gastronomyService) {
  const router = express.Router();

  router.get("/stores", async (_req, res) => {
    try {
      const stores = await storeService.listStores();
      return res.json(stores);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao listar lojas." });
    }
  });

  router.get("/events", async (_req, res) => {
    try {
      const events = await eventService.listEvents();
      return res.json(events);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao listar eventos." });
    }
  });

  router.get("/gastronomy", async (_req, res) => {
    try {
      const items = await gastronomyService.listItems();
      return res.json(items);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao listar gastronomia." });
    }
  });

  return router;
}

module.exports = {
  createPublicRoutes
};
