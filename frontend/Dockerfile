FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 5173

# Vite command for Docker with host mapping
CMD ["npm", "run", "dev", "--", "--host"]
