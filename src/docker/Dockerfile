FROM archlinux:latest
RUN pacman --noconfirm -Syy git npm nodejs
WORKDIR /

ARG GIT
ENV link $GIT

RUN git clone $link source
WORKDIR /source

RUN npm install
RUN npm run build