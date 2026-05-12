FROM node:20-bullseye-slim

WORKDIR /srv/app

# Strapi dependencies (sqlite3 + sharp)
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 make g++ \
    libvips-dev \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
# `npm ci` fails if package-lock.json isn't perfectly in sync with package.json.
# For local/dev containerization, prefer `npm install` to be more forgiving.
RUN npm install

COPY . .

EXPOSE 1337

CMD ["npm", "run", "develop"]
