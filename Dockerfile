FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY dist/ /app/src/
CMD ["node", "/app/src/server.js"]
