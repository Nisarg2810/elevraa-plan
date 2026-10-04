#!/bin/sh
# Usage: ./new-brand.sh <folder-name>   e.g. ./new-brand.sh acme
set -e
cd "$(dirname "$0")"
slug=$(echo "$1" | tr '[:upper:] ' '[:lower:]-')
[ -z "$slug" ] && { echo "Usage: ./new-brand.sh <folder-name>"; exit 1; }
[ -e "$slug" ] && { echo "Folder '$slug' already exists"; exit 1; }
cp -R _template "$slug"
echo "Created $slug/. Fill in $slug/data.json, then commit and push."
echo "Link: https://nisarg2810.github.io/elevraa-plan/$slug/"
