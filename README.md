# RoboFleet

A blockchain-powered decentralized physical infrastructure network (DePIN) for autonomous delivery robots, enabling secure collaboration, data sharing, and verifiable operations in logistics and last-mile delivery — all on-chain. This solves real-world problems like centralized vulnerabilities in robot fleets, data tampering in supply chains, and inefficient coordination among multi-vendor robots by providing transparent, tamper-proof logs and incentive mechanisms for participants.

---

## Overview

RoboFleet consists of four main smart contracts that together form a decentralized, secure, and efficient ecosystem for managing autonomous delivery robots:

1. **Robot Registry Contract** – Registers and manages robot identities and capabilities.
2. **Data Sharing Oracle Contract** – Handles secure sharing and verification of operational data via oracles.
3. **Task Coordination Contract** – Coordinates delivery tasks, assignments, and incentives.
4. **Audit Log Contract** – Maintains verifiable, immutable logs for operations and disputes.

---

## Features

- **Decentralized robot registration** with verifiable identities and specs  
- **Secure data sharing** for routes, status, and environmental data among robots  
- **Task assignment and incentives** via token rewards for efficient deliveries  
- **Immutable audit logs** for compliance, dispute resolution, and performance tracking  
- **Integration with off-chain oracles** for real-time robot telemetry and verification  

---

## Smart Contracts

### Robot Registry Contract
- Registers robots with unique IDs, owner details, and capabilities (e.g., battery life, payload capacity)
- Updates robot status (active/inactive) and handles ownership transfers
- Query functions for fleet discovery and compatibility checks

### Data Sharing Oracle Contract
- Integrates with external oracles to fetch and validate off-chain data like GPS routes or sensor readings
- Enables secure, permissioned data sharing between registered robots
- Enforces data integrity checks and timestamps for shared information

### Task Coordination Contract
- Posts and assigns delivery tasks with smart contract-based bidding or allocation
- Distributes token incentives automatically upon task completion verification
- Manages escrow for payments and penalties in case of failures

### Audit Log Contract
- Records all operational events (e.g., task starts, completions, data shares) immutably
- Provides queryable logs for audits, with cryptographic proofs for verification
- Handles dispute resolution by referencing on-chain evidence

---

## Installation

1. Install [Clarinet CLI](https://docs.hiro.so/clarinet/getting-started)
2. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/robofleet.git
   ```
3. Run tests:
    ```bash
    npm test
    ```
4. Deploy contracts:
    ```bash
    clarinet deploy
    ```

## Usage

Each smart contract operates independently but integrates with others for a complete decentralized delivery ecosystem. Refer to individual contract documentation for function calls, parameters, and usage examples. For instance, register a robot via the Registry Contract before sharing data or coordinating tasks.

## License

MIT License