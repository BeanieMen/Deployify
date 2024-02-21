FROM archlinux:latest
RUN pacman --noconfirm -Syy git npm nodejs
WORKDIR /source

# CMD ["sh", "-c", "git clone $LINK ."]
# # CMD git clone $LINK .
# CMD echo 'Cloning completed'
# CMD npm install
# CMD npm run build
