# FROM nginx:alpine
# COPY ./public/ /usr/share/nginx/html

FROM nginx:alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY ./public/ ./

COPY ./public build

# WORKDIR /usr
# COPY ./src src 
COPY ./src ./src
WORKDIR /usr/share/nginx/html/src
COPY package.json .
COPY webpack.common.js .
COPY webpack.prod.js .
COPY tsconfig.json .
COPY tsconfig.prod.json .

LABEL name="Bridge"

RUN apk add --update nodejs npm
RUN npm install --no-package-lock && npm run build && npm prune --production

WORKDIR /usr/share/nginx/html

ENV NODE_ENV production
