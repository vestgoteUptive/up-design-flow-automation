/**
 * Local development server
 * Wraps the Lambda handler in an Express server so it can be run without SAM/Docker.
 * Usage: tsx src/dev-server.ts
 */

import express from 'express'
import type { APIGatewayProxyEvent } from 'aws-lambda'
import { handler } from './index'

const app = express()
app.use(express.json())
app.use(express.text())

// CORS for local development
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }
  next()
})

const PORT = process.env.API_PORT || 3001

// Adapt every incoming Express request into a Lambda APIGatewayProxyEvent
app.all('*splat', async (req, res) => {
  const pathParameters: Record<string, string> = {}

  // Extract path parameters from common route patterns
  const patterns: Array<{ re: RegExp; params: (m: RegExpMatchArray) => Record<string, string> }> = [
    {
      re: /^\/projects\/([^/]+)\/ingestion\/([^/]+)$/,
      params: (m) => ({ projectId: m[1], componentId: m[2] }),
    },
    {
      re: /^\/projects\/([^/]+)\/components\/([^/]+)\/regenerate$/,
      params: (m) => ({ projectId: m[1], componentId: m[2] }),
    },
    {
      re: /^\/projects\/([^/]+)\/ideas\/([^/]+)\/iterate$/,
      params: (m) => ({ projectId: m[1], ideaId: m[2] }),
    },
    {
      re: /^\/projects\/([^/]+)\/ideas\/([^/]+)$/,
      params: (m) => ({ projectId: m[1], ideaId: m[2] }),
    },
    {
      re: /^\/projects\/([^/]+)\/ideas$/,
      params: (m) => ({ projectId: m[1] }),
    },
    {
      re: /^\/projects\/([^/]+)\/ingestion$/,
      params: (m) => ({ projectId: m[1] }),
    },
    {
      re: /^\/projects\/([^/]+)\/ingestion\/select$/,
      params: (m) => ({ projectId: m[1] }),
    },
    {
      re: /^\/projects\/([^/]+)\/ingestion\/session$/,
      params: (m) => ({ projectId: m[1] }),
    },
    {
      re: /^\/projects\/([^/]+)\/ingestion\/generate$/,
      params: (m) => ({ projectId: m[1] }),
    },
    {
      re: /^\/projects\/([^/]+)\/ingestion\/seed$/,
      params: (m) => ({ projectId: m[1] }),
    },
    {
      re: /^\/projects\/([^/]+)\/components\/needs-update$/,
      params: (m) => ({ projectId: m[1] }),
    },
    {
      re: /^\/projects\/([^/]+)\/components$/,
      params: (m) => ({ projectId: m[1] }),
    },
    {
      re: /^\/projects\/([^/]+)\/tokens$/,
      params: (m) => ({ projectId: m[1] }),
    },
    {
      re: /^\/projects\/([^/]+)$/,
      params: (m) => ({ projectId: m[1] }),
    },
    {
      re: /^\/ideas\/([^/]+)\/promote$/,
      params: (m) => ({ ideaId: m[1] }),
    },
    {
      re: /^\/ideas\/([^/]+)\/promotion$/,
      params: (m) => ({ ideaId: m[1] }),
    },
    {
      re: /^\/ideas\/([^/]+)\/publish\/history$/,
      params: (m) => ({ ideaId: m[1] }),
    },
  ]

  for (const { re, params } of patterns) {
    const match = req.path.match(re)
    if (match) {
      Object.assign(pathParameters, params(match))
      break
    }
  }

  const event: APIGatewayProxyEvent = {
    httpMethod: req.method,
    path: req.path,
    headers: req.headers as Record<string, string>,
    multiValueHeaders: {},
    queryStringParameters: Object.keys(req.query).length
      ? (req.query as Record<string, string>)
      : null,
    multiValueQueryStringParameters: null,
    pathParameters: Object.keys(pathParameters).length ? pathParameters : null,
    stageVariables: null,
    requestContext: {} as APIGatewayProxyEvent['requestContext'],
    resource: req.path,
    body: req.body ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) : null,
    isBase64Encoded: false,
  }

  try {
    const result = await handler(event)
    res
      .status(result.statusCode)
      .set(result.headers as Record<string, string>)
      .send(result.body)
  } catch (err) {
    console.error('Handler error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(PORT, () => {
  console.log(`API dev server running at http://localhost:${PORT}`)
  console.log(`DynamoDB endpoint: ${process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000'}`)
})
