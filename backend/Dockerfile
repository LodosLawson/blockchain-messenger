FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

# Expose the port the app runs on
EXPOSE 3001

# Define the command to run the app
# We use a shell script or direct command. 
# Since the app expects port and url args, we can set defaults or expect env vars.
# For Google Cloud Run, PORT env var is automatically set.
CMD [ "node", "networkNode.js", "3001" ]
