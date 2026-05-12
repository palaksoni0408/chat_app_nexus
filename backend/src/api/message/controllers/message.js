const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::message.message", ({ strapi }) => ({
  async find(ctx) {
    const { data, meta } = await super.find(ctx);
    return { data, meta };
  },

  async create(ctx) {
    const { id: userId } = ctx.state.user;
    const { text, room, username } = ctx.request.body.data;

    if (!text || !room || !username) {
      return ctx.badRequest("text, room, and username are required");
    }

    const sanitizedText = text.trim().slice(0, 500);

    const entity = await strapi.entityService.create("api::message.message", {
      data: {
        text: sanitizedText,
        room,
        username,
        author: userId,
      },
      populate: ["author"],
    });

    const io = strapi.io;
    if (io) {
      const messagePayload = {
        id: entity.id,
        text: entity.text,
        username: entity.username,
        userId,
        room: entity.room,
        createdAt: entity.createdAt,
      };
      io.to(room).emit("new-message", messagePayload);
    }

    return this.transformResponse(entity);
  },
}));
