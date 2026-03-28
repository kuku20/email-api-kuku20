# Stage 1: Build the application
FROM node:22.14.0-alpine AS build

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the NestJS application
RUN npm run build

# Stage 2: Run the application
FROM node:22.14.0-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install necessary dependencies for Puppeteer and Chromium
RUN apk update && apk add --no-cache \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ttf-freefont \
  bash \
  && rm -rf /var/cache/apk/*

# Set environment variable to use the installed Chromium binary
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy built application from the previous stage
COPY --from=build /usr/src/app/dist ./dist

# Expose the port the app runs on
ARG PORT
EXPOSE ${PORT:-3000}

# Run the NestJS app
CMD ["node", "dist/main"]