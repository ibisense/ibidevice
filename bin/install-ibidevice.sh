#!/bin/sh

#Ibideviced install script

PWD="$( cd "$(dirname $0)/.." ; pwd )"
TARGET=/opt/ibidevice

#Create directories
mkdir -p /opt/ibidevice/bin
chown -R pi /opt/ibidevice

#Copy files
cp -r $PWD/* $TARGET
rm -f $TARGET/bin/install-ibidevice.sh

#Install the startup script
cp $PWD/etc/init.d/ibideviced /etc/init.d
update-rc.d ibideviced defaults


 