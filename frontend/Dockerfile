FROM node:20-bullseye-slim

WORKDIR /srv/app

COPY package*.json ./
# Use `npm install` to avoid strict lockfile sync failures in dev.
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--port", "3000", "--hostname", "0.0.0.0"]
