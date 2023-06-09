FROM node:18-alpine

LABEL name="CS Wargame Backend" maintainer="Filip Todorić <ft50626@fer.hr>"

ENV NODEJS_VERSION=18
# set env database_url for prod deploy

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]
