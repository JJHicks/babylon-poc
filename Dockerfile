# FROM nginx:alpine
# COPY ./public/ /usr/share/nginx/html

FROM nginx:alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY ./public/ ./

RUN ["build"]

# RUN usermod -u 1000 www-data

# # <your-nginx-build-context>/Dockerfile
# FROM nginx:latest

# # The default nginx.conf DOES NOT include /etc/nginx/sites-enabled/*.conf
# COPY nginx.conf /etc/nginx/
# COPY symfony.conf /etc/nginx/sites-available/

# # Solves 1
# RUN mkdir -p /etc/nginx/sites-enabled/ \
#     && ln -s /etc/nginx/sites-available/symfony.conf /etc/nginx/sites-enabled/symfony.conf \
#     && rm /etc/nginx/conf.d/default.conf

# # Solves 2
# RUN echo "upstream php-upstream { server php:9000; }" > /etc/nginx/conf.d/upstream.conf

# # Solves 3
# #RUN usermod -u 1000 www-data

# CMD ["nginx"]

# EXPOSE 80
# EXPOSE 443