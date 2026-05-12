const { createCoreRouter } = require("@strapi/strapi").factories;

// Use Strapi's default router + Users & Permissions role settings.
// Then you control access from the Admin UI:
// Settings → Users & Permissions → Roles → Authenticated → Message: find/findOne/create.
module.exports = createCoreRouter("api::message.message");
