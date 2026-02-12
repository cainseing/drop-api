# Drop API - Secure, zero-knowledge, secret sharing API

**Drop API** is the secure storage backend for the Drop ecosystem. It stores encrypted, high-entropy data only, operating under a strict zero-knowledge model.

The server never sees decryption keys and refuses to store low-entropy or plaintext data, ensuring that only properly encrypted secrets are accepted.

---

## 🔐 Security & Design Principles

Drop API is designed around key security principles:

- **Zero-Knowledge Architecture**  
  Encryption keys are never transmitted or stored on the server.

- **High-Entropy Enforcement**  
  Incoming payloads are validated to ensure they are properly encrypted.

- **Ephemeral Storage**  
  Secrets are temporary by default and automatically expire.

- **Burn-on-Read**  
  Secrets are deleted immediately after they are retrieved the allowed number of times.

---

## 🛠️ Requirements

Before installing, ensure you have:

- Node.js (v24+ recommended)
- Redis (v6+ recommended)
- npm

---

## ⚙️ Setup

### 1. Environment Configuration

Create a `.env` file in the project root:

    DEFAULT_TTL=
    HTTP_PORT=
    REDIS_URL=
    MAX_TTL=
    MAX_SIZE=
    MIN_ENTROPY_SCORE=

---

### 2. Installation

Install dependencies:

    npm install

Build the project:

    npm run build

Start the server in production:

    npm run prod

Start the server in development:

    npm run local

---

## 🤝 Contributing

Contributions are welcome via a pull request

---

## 🛡️ Security & Support

- Report security issues **privately**.
- Open issues on GitHub for bugs or feature requests.  

