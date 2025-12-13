# Use official Node.js LTS image
FROM node:22-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# If you have build steps for frontend or transpilation, run them here
# RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server.js"]
