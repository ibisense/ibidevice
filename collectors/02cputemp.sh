#!/bin/bash
/opt/vc/bin/vcgencmd measure_temp|sed -e 's/temp=/cpu_temp /' -e "s/'C//"
