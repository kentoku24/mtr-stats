#!/bin/bash

# Check if both arguments are provided
if [ $# -ne 2 ]; then
    echo "Usage: $0 <timestamp> <host_ip>"
    exit 1
fi

CURRENT_TIME=$1
HOST_IP=$2

# Read from stdin and process with jq
jq -c --arg time "$CURRENT_TIME" --arg orig_src "$HOST_IP" \
    '.timestamp = $time | .original_src = $orig_src | .src = .report.hubs[1].host | .dst = .report.hubs[0].host | .loss = .report.hubs[1]["Loss%"]'
