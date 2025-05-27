const path = require("path");
const sharp = require("sharp");
const deleteOldFiles = require("../utils/deleteOldFiles");

const validateImageDimensions = (rules) => {
  return async (req, res, next) => {
    try {
      if (!req.files)
        return res.status(400).json({ message: "No files uploaded" });

      for (const fieldName in rules) {
        const rule = rules[fieldName];

        const files = req.files[fieldName];

        if (!files) continue;

        for (const file of files) {
          const filePath = path.join("public", rule.folder, file.filename);

          const metadata = await sharp(filePath).metadata();

          const { width, height } = metadata;
          console.log("widht", width, "height", height);

          if (width > rule.minWidth || height > rule.minHeight) {
            await deleteOldFiles(filePath).catch((err) => {
              console.log("Failed to delete old files");
            });
            return res.status(400).json({
              message: `${fieldName}' exceeds the allowed dimensions of ${rule.minWidth}x${rule.minHeight}px`,
            });
          }
        }
      }

      next();
    } catch (err) {
      console.error("Error validating image dimensions:", err);
      res.status(500).json({ message: "Error validating image dimensions" });
    }
  };
};

module.exports = validateImageDimensions;
