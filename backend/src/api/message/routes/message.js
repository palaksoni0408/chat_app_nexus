const { createCoreRouter } = require("@strapi/strapi").factories;

module.exports = createCoreRouter("api::message.message", {
  config: {
    find: {
      auth: { scope: ["plugin::users-permissions.user"] },
    },
    findOne: {
      auth: { scope: ["plugin::users-permissions.user"] },
    },
    create: {
      auth: { scope: ["plugin::users-permissions.user"] },
    },
    update: {
      auth: false,
    },
    delete: {
      auth: false,
    },
  },
});
