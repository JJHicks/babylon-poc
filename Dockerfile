FROM nginx:alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY ./public/ ./

RUN mkdir /usr/src
COPY ./public/index.html /usr/src

WORKDIR /usr/src
COPY ./src . 

COPY package.json .
COPY webpack.common.js .
COPY webpack.prod.js .
COPY tsconfig.json .
COPY tsconfig.prod.json .

LABEL name="Bridge"

RUN apk add --update nodejs npm
RUN npm install --no-package-lock && npm run build && npm prune --production
RUN rm -r node_modules/*

WORKDIR /usr/share/nginx/html

ENV NODE_ENV production
