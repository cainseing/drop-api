# Security Policy

## Security Philosophy
The Drop API is designed as a "Blind Vault." It is responsible for the storage and lifecycle management of encrypted blobs, but it is architecturally prevented from knowing the contents of those blobs.

## Supported Versions
Security updates are applied to the main branch and deployed to production immediately.

| Version | Status                 |
| ------- | --------------------- |
| v0.1.x  | ✅ Active / Production |

## Security Architecture

### 1. Zero-Knowledge Persistence
The API stores blobs in a Key-Value structure:
* **Key:** A random 8 byte hex string (Drop ID) generated at the time of creation.
* **Value:** A Base64-encoded encrypted string.
The API does not accept or store the decryption keys. These keys are managed entirely by the CLI and reside only in the tokens held by the end-user.

### 2. Automated Lifecycle (The Burn)
Security is enforced through strict lifecycle hooks:
* **Burn-on-Read:** Once the `RemainingReads` counter reaches zero, the record is immediately deleted from storage.
* **TTL Enforcement:** An automated background process (sweeper) removes expired drops regardless of read count.

### 3. Rate Limiting & Protection
To prevent brute-force discovery of Drop IDs:
* **Global Rate Limiting:** Applied to all POST/GET endpoints via middleware.
* **Payload Validation:** Requests exceeding 1MB are rejected at the gateway level.
* **No Directory Listing:** It is impossible to "list" drops. Retrieval requires the exact UUID.

## Threat Model
| Threat | Mitigation |
| ------ | ---------- |
| **Server Compromise** | Attacker gains access to encrypted blobs but lacks the keys (stored client-side) to read them. |
| **Database Leak** | Blobs are encrypted with AES-256-GCM; without the CLI-generated keys, the data is useless. |
| **Brute Force** | A random 8 byte hex string provides $2^{64}$ (approximately 18.4 quintillion) possible combinations, making collision or discovery computationally infeasible for most standard use cases.|

## Reporting a Vulnerability
If you discover a security vulnerability, please do not open a public issue. Instead, follow these steps:

1. **Email:** Send a detailed report to security@getdrop.dev.
2. **Details:** Include a proof-of-concept, the version of the CLI, and your OS.
3. **Response:** Acknowledgement of your report will typically occur within 48 hours.

We follow a coordinated disclosure model. We ask that you do not share details about the vulnerability until a fix has been published.