FROM node:18-alpine

LABEL name="Cyber Warfare Backend" maintainer="Filip Todorić <ft50626@fer.hr>"

ENV NODEJS_VERSION=18
ENV DATABASE_URL=postgres://postgres:postgres

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]
