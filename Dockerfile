FROM alpine:latest

RUN apk add --no-cache mtr jq

COPY --chmod=755 entrypoint.sh /
COPY --chmod=755 process_mtr_json.sh /
COPY --chmod=755 transform_mtr_json.sh /

ENTRYPOINT ["/entrypoint.sh"]