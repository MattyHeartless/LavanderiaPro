# ETAPA 1: Construcción (Node.js)
FROM node:22-alpine AS build
WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar código y compilar
COPY . .
RUN npm run build --configuration=production

# ETAPA 2: Servidor (Nginx)
FROM nginx:alpine

# IMPORTANTE: En Angular 19, el build genera una carpeta 'browser' dentro de dist
# Sustituye 'tu-nombre-de-proyecto' por el nombre real que tengas en package.json
COPY --from=build /app/dist/laundr-app/browser /usr/share/nginx/html

# Copiamos nuestra config de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]