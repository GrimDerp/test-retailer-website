FROM 533313119160.dkr.ecr.us-west-2.amazonaws.com/alpine-node:16.14.0-master

# Copy all files unless excluded by .dockerignore
COPY ./ .

CMD ["node", "dist/app.js"]
