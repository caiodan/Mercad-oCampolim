const multer = require("multer");

/** Limite duro no servidor (memoria + proxy). Aviso de 5 MB e so no front. */
const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      cb(null, true);
      return;
    }
    cb(new Error("Apenas arquivos de imagem sao permitidos."));
  }
});

module.exports = {
  uploadImage
};
