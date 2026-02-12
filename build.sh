#!/bin/bash
echo "Enter version number: "

read version

sudo docker buildx build . -t ghcr.io/cainseing/drop-api:$version -t ghcr.io/cainseing/drop-api:latest --platform linux/arm64,linux/amd64 --push
