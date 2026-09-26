#!/bin/sh
# Swap the placeholder domain for yours in canonical tags, Open Graph, schema, sitemap and robots.
# Usage:  ./set-domain.sh https://yourdomain.com
set -e
[ -n "$1" ] || { echo "Usage: $0 https://yourdomain.com"; exit 1; }
D=$(printf '%s' "$1" | sed 's:/*$::')
for f in site/index.html site/privacy.html site/robots.txt site/sitemap.xml; do
  sed -i.bak "s#https://YOUR-DOMAIN.com#$D#g" "$f" && rm -f "$f.bak"
done
echo "Domain set to $D"
