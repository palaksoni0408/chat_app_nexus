FROM node:20-bullseye-slim

WORKDIR /srv/app

# Strapi dependencies (sqlite3 + sharp)
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 make g++ \
    libvips-dev \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 1337

CMD ["npm", "run", "develop"]
