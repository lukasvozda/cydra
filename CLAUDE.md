# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cydra is an ICP (Internet Computer Protocol) SQLite database management platform built with Rust. It demonstrates the use of ICSQLite - a cloud SQLite database implementation for the Internet Computer that provides SDK for developers to persist data in IC canisters. The ultimate goal of this application is to allow the user to create it's own databases, manage tables, upload data and query data.

## Architecture

### Core Components

- **Backend Canister**: Located in `src/backend/`, this is a Rust-based IC canister that provides SQLite database functionality
- **ICSQLite Library**: Located in `src/backend/ic-sqlite/`, this is a custom SQLite VFS (Virtual File System) implementation for IC stable memory
- **Frontend**: Placeholder directory in `src/frontend/` (not yet implemented)

### Key Technical Details

- Uses IC stable memory for persistent SQLite storage via a custom VFS implementation (`src/backend/ic-sqlite/src/vfs.rs`)
- SQLite operations are exposed through two main canister endpoints:
  - `execute(sql: String)`: For DDL/DML operations (CREATE, INSERT, UPDATE, DELETE)
  - `query(sql: String)`: For SELECT operations (read-only)
- Database file is stored as "main.db" in IC stable memory with 4KB page size and memory journal mode
- Uses `rusqlite-ic` package (IC-compatible fork of rusqlite) with bundled SQLite

## Development Commands

### Starting Local Development
```bash
dfx start --background --clean
```

### Building and Deploying
```bash
dfx deploy
```

### Running Database Tests
```bash
bash run.sh
```
This script demonstrates basic CRUD operations on a "person" table.

### Manual Database Operations
Execute SQL commands directly:
```bash
dfx canister call backend execute 'CREATE TABLE...'
dfx canister call backend query 'SELECT * FROM...'
```

## Project Structure

```
src/
├── backend/           # Main canister implementation
│   ├── lib.rs        # Canister endpoints and logic
│   └── ic-sqlite/    # Custom SQLite VFS for IC
│       ├── src/
│       │   ├── lib.rs    # Main connection and memory management
│       │   └── vfs.rs    # Virtual file system implementation
└── frontend/         # Future frontend implementation

dfx.json              # DFX configuration for IC deployment
can.did               # Candid interface definition
run.sh               # Example database operations script
```

## Key Dependencies

- **DFX**: 0.24.3+ required for IC deployment
- **Rust**: 1.55.0+ for backend compilation
- **ic-cdk**: IC Canister Development Kit
- **rusqlite-ic**: IC-compatible SQLite bindings
- **sqlite-vfs-ic**: Custom VFS implementation for IC stable memory

## Interface Definition

The canister exposes these methods (defined in `can.did`):
- `balance()`: Returns canister balance
- `instruction_counter()`: Returns instruction counter
- `execute(text)`: Execute SQL DDL/DML operations
- `query(text)`: Execute SQL SELECT queries

## Memory Management

- Database is stored in IC stable memory starting at offset 8 bytes
- First 8 bytes store the database size
- Uses WASM page size of 64KB for memory allocation
- Automatic memory growth when database size exceeds current capacity