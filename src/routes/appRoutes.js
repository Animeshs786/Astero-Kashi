const express = require("express");

const adminRoutes = require("./adminRoutes");
const userRoutes = require("./userRoutes");
const asterologerRoutes = require("./asterologerRoutes");
exports.appRoutes = (app) => {
  app.use("/public", express.static("public"));
  app.use("/api/admin", adminRoutes);
  app.use("/api/user",userRoutes)
  app.use("/api/asterologer",asterologerRoutes)
};
