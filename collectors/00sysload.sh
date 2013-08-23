#!/bin/bash
echo -n "load "
uptime | awk -F" " '{print $8;}' | awk -F"," '{print $1}'
