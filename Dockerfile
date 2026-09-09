# Multi-stage Dockerfile for Shadow Tracker
# Stage 1: Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production=false

# Stage 2: Build application
FROM deps AS builder
WORKDIR /app
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Production Nginx Server (optimized)
FROM nginx:alpine AS runner
COPY --from=builder /app/out /usr/share/nginx/html

# Custom nginx config for SPA routing + health endpoint
RUN printf 'server {\n\
  listen 80;\n\
  listen [::]:80;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  gzip on;\n\
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;\n\
  add_header X-Frame-Options SAMEORIGIN;\n\
  add_header X-Content-Type-Options nosniff;\n\
  add_header Cache-Control "no-cache" always;\n\
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {\n\
    expires 1y;\n\
    add_header Cache-Control "public, immutable";\n\
  }\n\
  location /health {\n\
    return 200 "OK";\n\
    add_header Content-Type text/plain;\n\
  }\n\
  location / {\n\
    try_files $uri $uri/ $uri.html /index.html;\n\
  }\n\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
