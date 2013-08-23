#!/bin/bash
for dir in /sys/bus/w1/drivers/w1_slave_driver/28*
do
 CH=`echo "$dir" | sed -e "s/.*-//"`
 cat $dir/w1_slave | grep 't=' | awk "{print \"$CH \" substr(\$10,3,5)/1000; }"
done

