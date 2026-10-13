# Build:  docker build -t wine-app .
# Run:    docker run --rm -p 5173:80 wine-app   ->  http://localhost:5173/Wine-Recommendations-System/

# -t wine-app дає образу назву.
# . означає, що файли для збірки беруться з поточної папки.
# --rm видаляє контейнер після зупинки.
# -p 5173:80 з'єднує порт 5173 на комп'ютері з портом 80 у контейнері.

# Stage 1: data-builder - build the knowledge graph from the UCI wine dataset
FROM python:3.12-slim AS data
WORKDIR /repo
RUN pip install --no-cache-dir pandas networkx matplotlib
# No screen inside the container: draw graphs straight to PNG files
ENV MPLBACKEND=Agg
COPY data-builder ./data-builder
# Needs to start from the repo root; writes knowledge_base.json and PNGs here
RUN mkdir -p wine-app/public && python data-builder/main.py


# Stage 2: wine-app - build the React app with the fresh knowledge base
FROM node:24 AS build
WORKDIR /repo/wine-app
COPY wine-app/package*.json ./
RUN npm ci
# Спочатку копіюються тільки package.json і package-lock.json, 
# а потім встановлюються залежності. npm ci ставить точно ті версії, що записані в lock-файлі. Порядок тут важливий: 
# Docker кешує кожен крок. Поки список залежностей не змінився, npm ci при повторній збірці не запускається, і збірка йде набагато швидше.
COPY wine-app ./
# Копіює решту коду додатку. node_modules і dist не копіюються, бо вони є в .dockerignore.
COPY --from=data /repo/wine-app/public/knowledge_base.json /repo/wine-app/public/*.png ./public/
# --from=data бере файли з першого етапу: свіжий knowledge_base.json і PNG-картинки. Вони кладуться в public/ і замінюють старі версії з репозиторію.
RUN npm run build


# Stage 3: serve the built app with Nginx
FROM nginx:alpine
# Видаляє стандартну сторінку nginx «Welcome to nginx».
RUN rm -rf /usr/share/nginx/html/*
# Бере зібраний сайт з другого етапу і кладе його туди, звідки nginx роздає файли.
COPY --from=build /repo/wine-app/dist /usr/share/nginx/html/Wine-Recommendations-System
# Цей рядок optional і створює в корені сайту файл index.html з одним HTML-тегом. Тег каже браузеру: «через 0 секунд перейди на /Wine-Recommendations-System/».
# Тому, якщо відкрити просто localhost:5173, ви одразу потрапите в додаток, а не на сторінку 404.
RUN echo '<meta http-equiv="refresh" content="0; url=/Wine-Recommendations-System/">' > /usr/share/nginx/html/index.html
# Позначає, що контейнер слухає порт 80. 
EXPOSE 80
# Команда, яка виконується при старті контейнера. daemon off; змушує nginx працювати на передньому плані. 
# Без цього nginx пішов би у фон, Docker вирішив би, що програма завершилась, і зупинив би контейнер.
CMD ["nginx", "-g", "daemon off;"]
