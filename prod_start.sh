#!/bin/bash

echo "start.sh:: setting variables"
DEPHOME=/home/deploy
WEBDIR=/var/www
REPO=shopify

echo "start.sh:: copying config.js from $DEPHOME/$REPO to $WEBDIR/$REPO"
cp $DEPHOME/$REPO/config.js $WEBDIR/$REPO/

#echo "start.sh:: running npm install"
#npm install

echo "start.sh:: calling forever start"
NODE_ENV=production PORT=9001 ./node_modules/forever/bin/forever start -o shopify -e shopify -a --minUptime 1000 --spinSleepTime 1000 --uid shopify app.js

echo "start.sh:: end of script"

echo "start.sh:: NOTICE ** The deploy is complete and nodejs is running. You can now press ctrl+c to close the prompt without issue."