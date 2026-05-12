module.exports = [
  "strapi::logger",
  "strapi::errors",
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src": [
            "'self'",
            "https:",
            "http:",
            "ws:",
            "wss:",
            "http://localhost:1337",
            "http://127.0.0.1:1337",
            "ws://localhost:1337",
            "ws://127.0.0.1:1337",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
          ],
          "img-src": ["'self'", "data:", "blob:"],
          "media-src": ["'self'", "data:", "blob:"],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: "strapi::cors",
    config: {
      headers: "*",
      origin: [
        "http://localhost:1337",
        "http://127.0.0.1:1337",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ],
    },
  },
  "strapi::poweredBy",
  "strapi::query",
  "strapi::body",
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];
