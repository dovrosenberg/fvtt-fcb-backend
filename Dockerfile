FROM node:22-alpine

WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker caching
COPY package.json package-lock.json ./

# Install dependencies (including TypeScript)
RUN npm install

# Copy the entire project (including TypeScript files)
COPY . .

# Build TypeScript (compiles `src/` into `dist/`)
RUN npm run build

RUN ls -l dist

# Set the correct start command
CMD ["node", "dist/server.js"]