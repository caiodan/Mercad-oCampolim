const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "mercado_local_secret";

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

function extractTokenFromRequest(req) {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  const cookieHeader = req.headers.cookie || "";
  const tokenCookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("admin_token="));

  if (!tokenCookie) return null;
  return decodeURIComponent(tokenCookie.slice("admin_token=".length));
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function authAdmin(req, res, next) {
  const token = extractTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ message: "Token nao informado." });
  }

  try {
    const decoded = verifyToken(token);
    req.admin = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalido ou expirado." });
  }
}

module.exports = {
  createToken,
  authAdmin,
  extractTokenFromRequest,
  verifyToken
};
