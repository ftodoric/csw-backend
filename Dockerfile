FROM node:18-alpine

LABEL name="hesoyam" maintainer="ftodoric"

ENV NODE_ENV=production
ENV NODEJS_VERSION=18
ENV DATABASE_URL=postgres://postgres:postgres

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

RUN npm install --production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]
