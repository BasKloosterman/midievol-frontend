#!/bin/bash
docker build --platform linux/amd64 -t dregistry.baskloosterman.nl:5000/midevol .
docker push dregistry.baskloosterman.nl:5000/midevol
ssh baskloosterman.nl "cd dockercompose; docker-compose pull midevol; docker-compose up -d"