#!/bin/bash

sleep 10
echo -n "load " 
uptime|awk '{print $10;}'
