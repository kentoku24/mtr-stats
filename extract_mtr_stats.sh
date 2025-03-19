#!/bin/bash

# This script extracts time, loss percentage, and host from MTR logs using jq

jq -c '
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
' "$@"
