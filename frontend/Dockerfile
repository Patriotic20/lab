# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Tiny image that ships the built dist into a shared volume
FROM alpine:latest

WORKDIR /app
COPY --from=build /app/dist ./dist

# On startup, copy built assets into the volume mounted by the nginx proxy
# at /usr/share/nginx/html, then exit. The proxy nginx serves them directly.
CMD ["sh", "-c", "rm -rf /usr/share/nginx/html/* && cp -r /app/dist/. /usr/share/nginx/html/"]
