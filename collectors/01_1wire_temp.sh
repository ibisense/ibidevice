#!/bin/bash
for dir in /sys/bus/w1/drivers/w1_slave_driver/28*
do
 if  ! [[  "$dir"  =~ \*$ ]] ; then 
CH=`echo "$dir" | sed -e "s/.*-//"`
 DATA=`cat $dir/w1_slave`
 if [ `echo $DATA|awk '{print $12;}'` = "YES" ] ; then
   echo $DATA| awk "{print \"$CH \" substr(\$22,3,5)/1000; }"
 fi
fi
done


