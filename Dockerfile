FROM node:8.11.1

WORKDIR /usr/src/portfolio-api

COPY package.json /usr/src/portfolio-api
RUN npm install

COPY . /usr/src/portfolio-api

RUN npm install

 CMD ["sh"]

