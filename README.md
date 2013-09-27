ibidevice
=========

Ibidevice is a node.js based simple framework for gathering data from sensors
and sending the data to Ibisense cloud service.

As the first hardware platform, the Ibidevice has been implemented on Raspberry Pi
running Debian Wheezy.

Currently, the ibidevice is our internal effort and has not been documented
in detail. If we see a lot of interested people using this, we'll add
more documentation!

Now the target is to be a plug'n'play  simple measurement appliance.

Data access rights
------------------
Ibisense is a company doing cloud sensor software projects. This service is our
a demonstaration plarform for us and we're providing it for free for community.
We may be adding limited access to the service later on for a small fee
if we see that as a business opportunity. Our plan is to keep publicly
available data free (as in beer), though. We make our living by doing
sensor cloud projects for companies.

Setting up software
-------------------
Download an install our ready SD card image. The image is based in Debian Wheezy and
connects to Ibisense on startup.

OR:

1. Set up node.js:
http://blog.rueedlinger.ch/2013/03/raspberry-pi-and-nodejs-basic-setup/

The nodejs package from Debian repository is a version that is too old for the
libraries used in ibidevice.js. Compiling node.js on RPi can take hours!
node.js must be of version 0.10.6 or newer.

2. run bin/install-ibidevice.sh to copy the files to /opt/ibidevice and /etc/init.d.
The install script also runs update-rc.d to create symlinks in /etc/rc*.d

3. Reboot


Running the software
--------------------
Connect RPi to network and boot it.

See the log:

> tail -f /opt/ibidevice/var/log/ibideviced.log 

In the log you should see how the device registers with ibisense, starts
running the collector scripts and sends the data to Ibisense.

To increase the logging level, edit bin/ibideviced.js and uncomment the
line where the log4js logging level is set to TRACE.

Collectors
----------
We currently provide just two simple pollers:

   00sysload.sh 
Is a simple script that sends the system CPU load to Ibisense.
Since RPi does not have any on-board sensors and we wanted to get some
data running without any effort, we selected the system cpu load as
the first measurement.

    01_1wire_temp.sh
This script reads DS18B20 1-wire temperature sensors connected to RPi. The
script uses the sensor IDs as the channel names, so the channel names
look like 'RPi sensor 000004d488d0' in the HTML5 application. Feel free to
modify the script to give meaningful names for the sensors!

You can order 1wire sensors and stuff from Adafruit. You can also find
information on how to connect the sensors to RPi from the Adafruit
web site:
http://learn.adafruit.com/adafruits-raspberry-pi-lesson-11-ds18b20-temperature-sensing/overview

Some ideas of what can be done:
-Use RS232/RS485 converter and python scripts to connect any device speaking over serial port.
-A customer of ours has used RPi camera board + OpenCV to do a machine vision based measurement
-A laser pointer driven by 74HC4060 1kHz oscillator and received with USB sound card, signal
 processed+detected with python was used to measure remote reflectance of a moving object.
-BMP085 pressure sensor can be used to measure atmospheric pressure.


Data flow
---------
A node.js process called ibideviced.js connects to the Ibisense service. If first
registers the device with ID based on cpu id and mac address.

The ibideviced.js then checks for scripts or programs called collectors from
/opt/ibidevice/collectors. It runs each of these scripts with a period
set in the /opt/ibidevice/etc/ibideviced_config.json parameter process_period (in milliseconds)
The collectors should return lines that contain whitespace separated 
channel name and values.

An example output for a single value representing a room temperature:
   room_temperature 23.0

An example of an 3-axis accelerometer output:
   acc_x 0.02
   acc_y 0.77
   acc_z 0.22

The collectors can run for a period set as parameter process_timeout. After that period
the collector will be killed if it has not exited yet.

Whenever a new channel name is encountered, the ibideviced will create a new
channel under the same sensor in Ibisense. This way all the channels will
be visible under the same page in Ibisense.

The data is accessible at https://rpi.ibisense.net/ by entering the cpuid as the
search keyword.

In Ibisense, there is currently a basic application for showing the data.
In the future we will publish ways to easily create and manage HTML5-based
applications on top of the stored data.

Currently the data in this environment is public to everybody and can be read
by anyone knowing the cpuid or the URL to the application (suid-parameter identifies
your board in the URL).

Registration flow
-----------------
This paragraph describes how the ibideviced registers with the Ibisense service.

First, the scripts fetch cpuid and mac address. These are used to connect to Ibisense
over https to get an API Key, which is the Ibisense way of authenticating requests.
The API Key is stored in the /opt/ibidevice/etc/ibideviced_config.js.

Then, the scripts create an object called Sensor in Ibisense. Sensor is the
basic access control unit in Ibisense and has some metadata. A Sensor can
have many Channels, which are database objects where the measurement data is stored at.


Reusing the SD card
-------------------

If you move the SD card to an another RPi, the card will still have the old
channels IDs and authentication keys. You have to clear them first.

Using an another RPi: clear the SD apikey

Using an another SD card: OK

ID: mac + cpuid

License
-------
This software is licensed under the BSD license, see file LICENSE.

