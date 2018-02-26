FROM node:latest

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# COPY package.json .
# For npm@5 or later, copy package-lock.json as well
COPY package.json yarn.lock ./

# RUN yarn global add testcafe
RUN yarn install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

ENV BASE_URL="/%C3%B6vers%C3%A4ttarlexikon/"

RUN npm run build
ENTRYPOINT npm run start
  