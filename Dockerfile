FROM node:8.11.1

WORKDIR /usr/src/chatapp-api

COPY package.json /usr/src/chatapp-api
RUN npm install

COPY . /usr/src/chatapp-api

RUN npm install

 CMD ["sh"]

