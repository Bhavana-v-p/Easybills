# Dockerfile for EasyBills app
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock if present
COPY package.json package-lock.json* ./

# Install dependencies (including devDeps for nodemon)
RUN npm install --silent

# Copy source
COPY . .

EXPOSE 3000

# Default command
CMD ["npm", "run", "dev"]
