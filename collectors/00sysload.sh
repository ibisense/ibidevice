#!/bin/bash
echo -n "load "
awk '{ print $1}' /proc/loadavg 
