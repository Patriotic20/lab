# Stage 1: Build the React application
FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_API_URL=/api
ARG VITE_FACE_DETECTION_SERVICE_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_FACE_DETECTION_SERVICE_URL=$VITE_FACE_DETECTION_SERVICE_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve the built SPA with `serve` (no nginx)
FROM node:22-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 80
CMD ["serve", "-s", "dist", "-l", "80"]
