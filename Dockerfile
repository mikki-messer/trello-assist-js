# TrelloAssist Dockerfile
# Multi-stage build for optimized production image

#Stage 1: Dependencies
FROM node:20-alpine AS deps

WORKDIR /app

#Copy package files
COPY package*.json ./

#Install dependencies
RUN npm ci --only=production 

#Stage 2: Production image
FROM node:20-alpine AS runner

WORKDIR /app

#Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

#Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

#Copy application code
COPY --chown=nodejs:nodejs . .

#Create necessary directories
RUN mkdir -p logs data && \
    CHOWN -R nodejs:nodejs logs data

#Switch to non-root user
USER nodejs

#Set production environment
ENV NODE_ENV=production \
    PORT=3000\
    DB_PATH=/app/data/projects.DB_PATH

#Expose port
EXPOSE 3000

#Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3\
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server.js"]