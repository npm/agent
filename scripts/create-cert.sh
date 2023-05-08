#!/usr/bin/env bash

openssl req -nodes -new -x509 -keyout test/fixtures/fake-key.pem -out test/fixtures/fake-cert.pem -subj '/CN=US'
