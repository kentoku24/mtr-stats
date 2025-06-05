#!/bin/bash

# Script to process mtr JSON output and format it either in the original way or for DataDog.

# Check if an argument is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <format_type>" >&2
  echo "format_type can be 'original' or 'datadog'" >&2
  exit 1
fi

FORMAT_TYPE="$1"

# Read JSON from stdin and process with jq based on FORMAT_TYPE
if [ "$FORMAT_TYPE" = "original" ]; then
  # Original format jq query
  # Filters for reports with time, source host, destination host, and Loss%
  # Then structures the output as: { "time": { "src_host": { "dst_host": Loss% } } }
  jq '
    select(.report.time != null and
           .report.hubs[1].host != null and
           .report.hubs[0].host != null and
           .report.hubs[1]["Loss%"] != null) |
    {
      (.report.time): {
        (.report.hubs[1].host): {
          (.report.hubs[0].host): (.report.hubs[1]["Loss%"])
        }
      }
    }
  '
elif [ "$FORMAT_TYPE" = "datadog" ]; then
  # DataDog format jq query
  # Filters for reports with time
  # Then structures the output for DataDog: { "time": ..., "src": ..., "dst": ..., "loss": ... }
  jq '
    select(.report.time != null) |
    {
      "time": .report.time,
      "src": .report.hubs[1].host,
      "dst": .report.hubs[0].host,
      "loss": .report.hubs[1]["Loss%"]
    }
  '
else
  echo "Invalid format_type: $FORMAT_TYPE" >&2
  echo "Usage: $0 <format_type>" >&2
  echo "format_type can be 'original' or 'datadog'" >&2
  exit 1
fi
