const express = require("express");
const bcrypt = require("bcryptjs");
const { authAdmin, createToken } = require("../middleware/auth");

function createAdminRoutes(db, storeService, eventService, gastronomyService) {
  const router = express.Router();

  router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email e senha sao obrigatorios." });
    }

    const admin = await db.get("SELECT * FROM admins WHERE email = ?", email);
    if (!admin) return res.status(401).json({ message: "Credenciais invalidas." });

    const validPassword = await bcrypt.compare(password, admin.password_hash);
    if (!validPassword) return res.status(401).json({ message: "Credenciais invalidas." });

    const token = createToken({ id: admin.id, email: admin.email });
    res.setHeader(
      "Set-Cookie",
      `admin_token=${encodeURIComponent(token)}; Path=/; Max-Age=28800; HttpOnly; SameSite=Lax`
    );
    return res.json({
      token,
      admin: { id: admin.id, email: admin.email }
    });
  });

  router.post("/logout", (_req, res) => {
    res.setHeader("Set-Cookie", "admin_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");
    return res.status(204).send();
  });

  router.get("/session", authAdmin, (req, res) => {
    return res.json({
      admin: {
        id: req.admin.id,
        email: req.admin.email
      }
    });
  });

  router.get("/stores", authAdmin, async (_req, res) => {
    try {
      const stores = await storeService.listStores();
      return res.json(stores);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao listar lojas." });
    }
  });

  router.post("/stores", authAdmin, async (req, res) => {
    try {
      const created = await storeService.createStore(req.body);
      return res.status(201).json(created);
    } catch (error) {
      return res.status(400).json({ message: error.message || "Erro ao criar loja." });
    }
  });

  router.put("/stores/:id", authAdmin, async (req, res) => {
    try {
      const updated = await storeService.updateStore(Number(req.params.id), req.body);
      return res.json(updated);
    } catch (error) {
      const status = error.message === "Loja nao encontrada." ? 404 : 400;
      return res.status(status).json({ message: error.message || "Erro ao atualizar loja." });
    }
  });

  router.delete("/stores/:id", authAdmin, async (req, res) => {
    try {
      await storeService.deleteStore(Number(req.params.id));
      return res.status(204).send();
    } catch (error) {
      const status = error.message === "Loja nao encontrada." ? 404 : 400;
      return res.status(status).json({ message: error.message || "Erro ao remover loja." });
    }
  });

  router.get("/events", authAdmin, async (_req, res) => {
    try {
      const events = await eventService.listEvents();
      return res.json(events);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao listar eventos." });
    }
  });

  router.post("/events", authAdmin, async (req, res) => {
    try {
      const created = await eventService.createEvent(req.body);
      return res.status(201).json(created);
    } catch (error) {
      return res.status(400).json({ message: error.message || "Erro ao criar evento." });
    }
  });

  router.put("/events/:id", authAdmin, async (req, res) => {
    try {
      const updated = await eventService.updateEvent(Number(req.params.id), req.body);
      return res.json(updated);
    } catch (error) {
      const status = error.message === "Evento nao encontrado." ? 404 : 400;
      return res.status(status).json({ message: error.message || "Erro ao atualizar evento." });
    }
  });

  router.delete("/events/:id", authAdmin, async (req, res) => {
    try {
      await eventService.deleteEvent(Number(req.params.id));
      return res.status(204).send();
    } catch (error) {
      const status = error.message === "Evento nao encontrado." ? 404 : 400;
      return res.status(status).json({ message: error.message || "Erro ao remover evento." });
    }
  });

  router.get("/gastronomy", authAdmin, async (_req, res) => {
    try {
      const items = await gastronomyService.listItems();
      return res.json(items);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao listar gastronomia." });
    }
  });

  router.post("/gastronomy", authAdmin, async (req, res) => {
    try {
      const created = await gastronomyService.createItem(req.body);
      return res.status(201).json(created);
    } catch (error) {
      return res.status(400).json({ message: error.message || "Erro ao criar item de gastronomia." });
    }
  });

  router.put("/gastronomy/:id", authAdmin, async (req, res) => {
    try {
      const updated = await gastronomyService.updateItem(Number(req.params.id), req.body);
      return res.json(updated);
    } catch (error) {
      const status = error.message === "Item de gastronomia nao encontrado." ? 404 : 400;
      return res.status(status).json({ message: error.message || "Erro ao atualizar item de gastronomia." });
    }
  });

  router.delete("/gastronomy/:id", authAdmin, async (req, res) => {
    try {
      await gastronomyService.deleteItem(Number(req.params.id));
      return res.status(204).send();
    } catch (error) {
      const status = error.message === "Item de gastronomia nao encontrado." ? 404 : 400;
      return res.status(status).json({ message: error.message || "Erro ao remover item de gastronomia." });
    }
  });

  return router;
}

module.exports = {
  createAdminRoutes
};
