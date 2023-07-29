# First stage: install dependencies and build the application
FROM node:alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY ./src ./src
COPY ./.env ./.env

# Second stage: copy the built application and install production dependencies
FROM node:alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY --from=build /app/package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy the built application from the first stage
COPY --from=build /app .

# Create upload directory
RUN mkdir -p /app/data/uploads

# Create a user to run the application
RUN addgroup -S app && adduser -S app -G app
RUN chown -R app:app /app && chmod -R 755 /app
USER app

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "start"]