#!/bin/sh

#Ibideviced install script

PWD="$( cd "$(dirname $0)/.." ; pwd )"
TARGET=/opt/ibisense

#Create directories
mkdir /opt/ibisense/bin
chown -R pi /opt/ibisense

#Copy files
cp -r $PWD/* $TARGET
rm -f $TARGET/bin/install-ibidevice.sh

#Install the startup script
cp $PWD/etc/init.d/ibideviced /etc/init.d
update-rc.d ibideviced defaults


 