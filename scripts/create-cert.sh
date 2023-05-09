#!/usr/bin/env bash
# if you start getting errors about an expired certificate, run this script and commit the changes

openssl req -nodes -new -x509 -keyout test/fixtures/fake-key.pem -out test/fixtures/fake-cert.pem -subj '/CN=US'
