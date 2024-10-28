FROM node:21-alpine3.19

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /usr/src/app

COPY package*.json ./

RUN pnpm install

COPY . .

EXPOSE 3002