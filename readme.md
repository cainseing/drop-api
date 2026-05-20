# Drop API - Secure, zero-knowledge, secret sharing API

[![Tests](https://github.com/cainseing/drop-api/actions/workflows/tests.yml/badge.svg?branch=development)](https://github.com/cainseing/drop-api/actions/workflows/tests.yml) [![Node.js Version](https://img.shields.io/badge/node-%3E%3D24.0.0-brightgreen)](https://nodejs.org/)

**Drop API** is the secure storage backend for the Drop ecosystem. It stores encrypted, high-entropy data only, operating under a strict zero-knowledge model.

The server never sees decryption keys and refuses to store low-entropy or plaintext data, ensuring that only properly encrypted secrets are accepted.

---

## Table of Contents

- [Security & Design Principles](#security--design-principles)
- [Requirements](#requirements)
- [Setup](#setup)
- [Docker](#docker)
- [Testing](#testing)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [Security & Support](#security--support)

---

## Security & Design Principles

- **Zero-Knowledge Architecture**  
  Encryption keys are never transmitted or stored on the server.

- **High-Entropy Enforcement**  
  Incoming payloads are validated to ensure they are properly encrypted.

- **Ephemeral Storage**  
  Secrets are temporary by default and automatically expire.

- **Burn-on-Read**  
  Secrets are deleted immediately after they are retrieved the allowed number of times.

---

## Requirements

- Node.js v24+
- Redis v6+ with [RedisJSON](https://redis.io/docs/data-types/json/) module
- npm

---

## Setup

### 1. Environment Configuration

Create a `.env` file in the project root:

```env
HTTP_PORT=3000
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

DEFAULT_TTL=86400
MAX_TTL=604800
MAX_SIZE=10
MIN_ENTROPY_SCORE=7.5
```

| Variable | Description | Example |
|---|---|---|
| `HTTP_PORT` | Port the server listens on | `3000` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `REDIS_PASSWORD` | Redis password (leave blank if none) | |
| `DEFAULT_TTL` | Default secret lifetime in seconds | `86400` (24h) |
| `MAX_TTL` | Maximum allowed TTL in seconds | `604800` (7d) |
| `MAX_SIZE` | Maximum blob size in megabytes | `10` |
| `MIN_ENTROPY_SCORE` | Minimum entropy score to accept a blob (encrypted data is typically > 7.5) | `7.5` |

### 2. Installation

```bash
npm install
```

### 3. Build & Run

```bash
# Build
npm run build

# Start (production)
npm run prod

# Start (development, with watch)
npm run local
```

---

## Docker

Start a local Redis instance with Docker Compose:

```bash
docker-compose up -d
```

To run the API itself in Docker, build the image after compiling:

```bash
npm run build
docker build -t drop-api .
docker run -p 3000:80 --env-file .env drop-api
```

---

## Testing

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

---

## API Reference

All endpoints (except `/health`) require the following headers:

| Header | Value |
|---|---|
| `x-drop-client` | `drop-cli-v1` |
| `User-Agent` | `DropCLI/v1.0` |

---

### Store a secret

```
POST /blob
```

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `blob` | string | Yes | Base64-encoded encrypted payload (min 128 bytes decoded, high entropy required) |
| `ttl` | number | No | Lifetime in seconds. Min `30`, max `MAX_TTL`. Defaults to `DEFAULT_TTL` |
| `reads` | number | No | Number of times the secret can be read (1–100). Defaults to `1` |
| `sender` | string | No | Identifier for the sender (max 255 chars) |
| `provider` | string | No | Source provider. Accepted values: `github`, `gitlab` |
| `signature` | string | No | Signature for verification (max 255 chars) |

**Response `200`**

```json
{ "id": "a1b2c3d4e5f6a7b8" }
```

**Errors**

| Code | Message | Reason |
|---|---|---|
| `422` | `TTL_TOO_LONG` | `ttl` exceeds `MAX_TTL` |
| `422` | `TTL_TOO_SHORT` | `ttl` is below 30 |
| `422` | `INVALID_READS` | `reads` is not an integer between 1 and 100 |
| `422` | `INVALID_ENCODING` | `blob` is not valid base64 |
| `422` | `BLOB_TOO_SMALL` | Decoded blob is under 128 bytes |
| `413` | `BLOB_TOO_LARGE` | Decoded blob exceeds `MAX_SIZE` MB |
| `422` | `UNENCRYPTED_BLOB_DETECTED` | Blob entropy is below `MIN_ENTROPY_SCORE` |
| `422` | `SENDER_TOO_LONG` | `sender` exceeds 255 characters |
| `422` | `SIGNATURE_TOO_LONG` | `signature` exceeds 255 characters |
| `422` | `INVALID_PROVIDER` | `provider` is not `github` or `gitlab` |

---

### Retrieve a secret

```
GET /blob/:id
```

Returns the secret and decrements the read counter. The secret is deleted once the read count reaches zero.

**Response `200`**

```json
{
  "blob": "<base64-encoded encrypted payload>",
  "remaining_reads": 0,
  "sender": "alice",
  "provider": "github",
  "signature": "abc123"
}
```

**Errors**

| Code | Reason |
|---|---|
| `404` | Secret not found or already consumed |

---

### Delete a secret

```
DELETE /blob/:id
```

Immediately deletes a secret before it is read or expires.

**Response `204`** — No content.

**Errors**

| Code | Reason |
|---|---|
| `404` | Secret not found |

---

### Health check

```
GET /health
```

No authentication required.

**Response `200`**

```json
{
  "message": "Zero-knowledge vault is operational",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

**Response `503`** — Redis is unreachable.

---

## Contributing

Contributions are welcome via a pull request.

---

## Security & Support

- Report security issues **privately**.
- Open issues on GitHub for bugs or feature requests.
