FROM node:latest


# Install Chromium.
# RUN \
#   wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
#   echo "deb http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list && \
#   apt-get update && \
#   apt-get install -y google-chrome-stable && \
#   rm -rf /var/lib/apt/lists/*


# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# COPY package.json .
# For npm@5 or later, copy package-lock.json as well
COPY package.json package-lock.json yarn.lock ./

# RUN yarn global add testcafe
RUN yarn install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

RUN npm run build
  