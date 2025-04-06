#!/bin/bash

# This script transforms MTR JSON output by adding timestamp and source IP, and extracting key metrics

# Check if both arguments are provided
if [ $# -ne 2 ]; then
    echo "Usage: $0 <timestamp> <host_ip>"
    exit 1
fi

CURRENT_TIME=$1
HOST_IP=$2

# Read from stdin and process with jq
jq -c \
  --arg time "$CURRENT_TIME" \
  --arg orig_src "$HOST_IP" \
  '
  # Add timestamp and original source IP
  .timestamp = $time |
  .src = $orig_src |
  
  # Extract source, destination and loss percentage from hubs
  .router = .report.hubs[0] |
  .dst = .report.hubs[-1] |
  .router_loss = .report.hubs[0]["Loss%"] |
  .dst_loss = .report.hubs[-1]["Loss%"]
  '
