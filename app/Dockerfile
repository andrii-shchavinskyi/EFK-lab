FROM node:18-alpine

WORKDIR /app

COPY app.js ./
RUN npm install prom-client

CMD ["node", "app.js"]
