const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService("api::message.message", ({ strapi }) => ({
  async getMessagesByRoom(room, limit = 50) {
    const messages = await strapi.entityService.findMany("api::message.message", {
      filters: { room },
      sort: { createdAt: "asc" },
      limit,
      populate: ["author"],
    });

    return messages.map((msg) => ({
      id: msg.id,
      text: msg.text,
      username: msg.username,
      userId: msg.author?.id || null,
      room: msg.room,
      createdAt: msg.createdAt,
    }));
  },
}));
