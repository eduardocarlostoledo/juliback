FROM node:20.18-alpine3.20

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia el archivo package.json y package-lock.json para instalar dependencias
COPY package*.json ./

# Instala solo las dependencias de producción
RUN npm install --only=production

# Copia el resto de la aplicación al contenedor
COPY . .

# # Copia el archivo .env si lo necesitas en el entorno del contenedor
# COPY .env .env

# Expone el puerto en el que corre tu aplicación (usualmente el 3000 para Express)
EXPOSE 3000

# Define el comando por defecto para iniciar el servidor
CMD ["node", "index.js"]
