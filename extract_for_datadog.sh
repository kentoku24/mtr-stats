#!/bin/bash

# This script extracts time, loss percentage, and host from MTR logs using jq

jq -c '
  select(.report.time != null) |
  {
    "time": .report.time,
    "src": .report.hubs[1].host,
    "dst": .report.hubs[0].host,
    "loss": .report.hubs[1]["Loss%"]
  }
' "$@"
