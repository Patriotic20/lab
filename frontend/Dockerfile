# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Same-origin defaults: SPA is served by the proxy nginx which also routes
# /api → backend and proxies the face-detection host. Override at build time
# only if the SPA needs to talk to a different origin.
ARG VITE_API_URL=/api
ARG VITE_FACE_DETECTION_SERVICE_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_FACE_DETECTION_SERVICE_URL=$VITE_FACE_DETECTION_SERVICE_URL

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
