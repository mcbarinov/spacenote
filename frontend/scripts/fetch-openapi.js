#!/usr/bin/env node

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const API_URL = process.env.VITE_API_URL || "http://localhost:3101"
const OPENAPI_ENDPOINT = `${API_URL}/openapi.json`
const OUTPUT_FILE = path.join(__dirname, "..", "openapi.json")

async function fetchOpenAPISchema() {
  console.log(`Fetching OpenAPI schema from ${OPENAPI_ENDPOINT}...`)

  try {
    const response = await fetch(OPENAPI_ENDPOINT)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const schema = await response.json()

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(schema, null, 2))
    console.log(`✅ OpenAPI schema saved to ${OUTPUT_FILE}`)
  } catch (error) {
    console.error(`❌ Failed to fetch OpenAPI schema: ${error.message}`)
    console.error("Make sure the backend server is running on port 3101")
    console.error("You can start it with: just b-agent-start")
    process.exit(1)
  }
}

fetchOpenAPISchema()
