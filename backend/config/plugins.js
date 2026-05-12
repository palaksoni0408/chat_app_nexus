module.exports = ({ env }) => ({
  "users-permissions": {
    config: {
      jwt: {
        expiresIn: "7d",
      },
      jwtSecret: env("JWT_SECRET", "a-very-long-jwt-secret-for-dev-use-only"),
    },
  },
});
