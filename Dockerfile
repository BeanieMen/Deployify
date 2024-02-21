FROM archlinux:latest
RUN pacman --noconfirm -Syy git yarn nodejs
WORKDIR /source
