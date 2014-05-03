#!/bin/bash
/sbin/wpa_cli signal_poll|grep RSSI|awk -F '=' '{print "wifi_rssi " $2}'

