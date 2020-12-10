# see: publish-release.sh to build/run this

FROM node:15

ENV DEBIAN_FRONTEND=noninteractive

RUN \
  # Setup support for HTTPS apt sources
  apt update -y && \
  apt install -y apt-transport-https ca-certificates && \
  # Setup Yarn apt source
  curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
  echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
  apt update -y && \
  # Setup npm to find the authToken in ${NPM_TOKEN} at docker run time
  # Note the single quotes: this does not leak your NPM_TOKEN
  echo '//registry.npmjs.org/:_authToken=${NPM_TOKEN}' > ~/.npmrc

RUN \
  apt install -y \
    git \
    # Needed for yarn to build gl (see: https://github.com/yarnpkg/yarn/issues/1987)
    node-gyp xserver-xorg-dev libxi-dev libxext-dev libpango1.0-dev \
    yarn

# publish-release-cmd.sh will use `docker run --env NPM_TOKEN` for npm auth
ARG NPM_TOKEN

ADD publish-release-cmd.sh .
CMD bash publish-release-cmd.sh
