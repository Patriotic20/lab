# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Same-origin defaults: SPA is served by this container on :3000 and the
# upstream proxy nginx forwards / → frontend:3000 and /api → backend:8000.
ARG VITE_API_URL=/api
ARG VITE_FACE_DETECTION_SERVICE_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_FACE_DETECTION_SERVICE_URL=$VITE_FACE_DETECTION_SERVICE_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve the built SPA with nginx on port 3000
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

RUN printf '%s\n' \
    'server {' \
    '    listen 3000;' \
    '    server_name _;' \
    '    root /usr/share/nginx/html;' \
    '    index index.html;' \
    '' \
    '    gzip on;' \
    '    gzip_types text/plain text/css application/json application/javascript image/svg+xml;' \
    '' \
    '    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot|webp)$ {' \
    '        expires 1y;' \
    '        add_header Cache-Control "public, immutable";' \
    '        try_files $uri =404;' \
    '    }' \
    '' \
    '    location / {' \
    '        try_files $uri $uri/ /index.html;' \
    '    }' \
    '}' \
    > /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
