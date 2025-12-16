#!/bin/sh
set -eu

node --input-type=module <<'NODE'
import { writeFileSync } from 'node:fs'

const apiUrl = process.env.API_URL

if (!apiUrl) {
  console.error('ERROR: API_URL environment variable is required')
  process.exit(1)
}

const config = `window.__SPACENOTE_CONFIG__ = {\n  API_URL: ${JSON.stringify(apiUrl)}\n};\n`

writeFileSync('/app/dist/runtime-config.js', config, 'utf8')
console.log(`Runtime config created with API_URL: ${apiUrl}`)
NODE

exec "$@"
