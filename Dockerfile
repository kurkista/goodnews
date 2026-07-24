# Static-only image: public/ is pre-rendered by the daily GitHub Actions
# workflow before this image is ever built. No Node runtime in production —
# there is no dynamic logic to run here.
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY public/ /usr/share/nginx/html/
