# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cydra is an ICP (Internet Computer Protocol) SQLite database management platform built with Rust backend and React frontend. It demonstrates the use of ICSQLite - a cloud SQLite database implementation for the Internet Computer that provides SDK for developers to persist data in IC canisters. The application allows users to create databases, manage tables, upload data and query data through a modern web interface.

The project consists of a Rust canister backend providing SQLite functionality and a React frontend application that provides a complete database management UI with real-time query execution, table browsing, and results visualization.

## Architecture

### Core Components

- **Backend Canister**: Located in `src/backend/`, this is a Rust-based IC canister that provides SQLite database functionality
- **ICSQLite Library**: Located in `src/backend/ic-sqlite/`, this is a custom SQLite VFS (Virtual File System) implementation for IC stable memory
- **React Frontend**: Located in `src/frontend/`, a modern React application providing database management UI with TypeScript, Tailwind CSS, and shadcn/ui components

### Key Technical Details

**Backend:**
- Uses IC stable memory for persistent SQLite storage via a custom VFS implementation (`src/backend/ic-sqlite/src/vfs.rs`)
- SQLite operations are exposed through main canister endpoints:
  - `execute(sql: String)`: For DDL/DML operations (CREATE, INSERT, UPDATE, DELETE)
  - `query(sql: String)`: For SELECT operations (read-only)
  - `get_database_info()`: Returns database metadata (tables, schemas, row counts)
- Database file is stored as "main.db" in IC stable memory with 4KB page size and memory journal mode
- Uses `rusqlite-ic` package (IC-compatible fork of rusqlite) with bundled SQLite

**Frontend:**
- React 19 with TypeScript for type safety and modern React features
- Vite for fast development and optimized builds
- Tailwind CSS v3 for styling with custom design system
- shadcn/ui component library for polished UI components
- React Router for navigation
- TanStack Query for efficient backend state management and caching
- CodeMirror for SQL editor with syntax highlighting and autocomplete
- Real-time query execution with performance timing

## Development Commands

### Starting Local Development
1. **Start IC replica**:
```bash
dfx start --background --clean
```

2. **Deploy backend canister**:
```bash
dfx deploy
```

3. **Start frontend development server**:
```bash
cd src/frontend
npm run dev
```
Or from project root (using npm workspaces):
```bash
npm run dev
```

The frontend will be available at http://localhost:5173

### Building and Deploying

**Backend:**
```bash
dfx deploy
```

**Frontend:**
```bash
npm run build
```

### Running Database Tests
```bash
bash run.sh
```
This script demonstrates basic CRUD operations on a "person" table.

### Manual Database Operations
Execute SQL commands directly via CLI:
```bash
dfx canister call backend execute 'CREATE TABLE...'
dfx canister call backend query 'SELECT * FROM...'
dfx canister call backend get_database_info
```

Or use the web interface at http://localhost:5173 for interactive database management.

## Project Structure

```
src/
├── backend/           # Rust canister implementation
│   ├── lib.rs        # Canister endpoints and logic
│   └── ic-sqlite/    # Custom SQLite VFS for IC
│       ├── src/
│       │   ├── lib.rs    # Main connection and memory management
│       │   └── vfs.rs    # Virtual file system implementation
├── frontend/         # React frontend application
│   ├── components/   # React components
│   │   ├── ui/      # shadcn/ui base components
│   │   ├── DatabasePanel.tsx  # Main database view and query results
│   │   ├── SqlEditor.tsx      # SQL editor with syntax highlighting
│   │   └── TableSidebar.tsx   # Database tables navigation
│   ├── hooks/       # React hooks for backend integration
│   │   └── useCanister.ts    # Backend API hooks
│   ├── lib/         # Utility libraries
│   │   ├── canister.ts       # Backend service layer
│   │   └── utils.ts          # General utilities
│   ├── pages/       # Application pages
│   │   └── Index.tsx         # Main database management page
│   ├── package.json          # Frontend dependencies
│   ├── vite.config.ts        # Vite configuration
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   └── tsconfig.json         # TypeScript configuration
├── declarations/     # Generated IC interface bindings
│   └── backend/     # Backend canister declarations
└── node_modules/    # Frontend dependencies

package.json          # Workspace root configuration
tsconfig.json        # Root TypeScript configuration
dfx.json             # DFX configuration for IC deployment
can.did              # Candid interface definition
canister_ids.json    # Local and mainnet canister IDs
run.sh              # Example database operations script
```

## Key Dependencies

**Development Tools:**
- **DFX**: 0.24.3+ required for IC deployment
- **Node.js**: 16.0.0+ for frontend development
- **npm**: 7.0.0+ for package management

**Backend (Rust):**
- **Rust**: 1.55.0+ for backend compilation
- **ic-cdk**: IC Canister Development Kit
- **rusqlite-ic**: IC-compatible SQLite bindings
- **sqlite-vfs-ic**: Custom VFS implementation for IC stable memory

**Frontend (React):**
- **React**: 19.x with TypeScript
- **Vite**: 6.x for build tooling and development server
- **TanStack Query**: For backend state management and caching
- **React Router**: For client-side routing
- **Tailwind CSS**: v3 for styling
- **shadcn/ui**: Component library built on Radix UI
- **CodeMirror**: SQL editor with syntax highlighting
- **@dfinity/agent**: IC agent for backend communication
- **vite-plugin-environment**: Environment variable handling

## Interface Definition

The canister exposes these methods (defined in `can.did`):
- `balance()`: Returns canister balance
- `instruction_counter()`: Returns instruction counter
- `execute(text)`: Execute SQL DDL/DML operations (CREATE, INSERT, UPDATE, DELETE)
- `query(text)`: Execute SQL SELECT queries (read-only)
- `get_database_info()`: Returns comprehensive database metadata including tables, schemas, and row counts

## Frontend Features

The React frontend provides a complete database management interface:

**SQL Editor:**
- Full-featured SQL editor with syntax highlighting
- Autocomplete for SQL keywords, table names, and column names
- Real-time syntax error detection
- Query execution with performance timing
- Query history and templates

**Database Browser:**
- Live database table listing with row counts
- Automatic refresh of database metadata
- Table selection for detailed view
- Real-time database size monitoring

**Query Results:**
- Tabular display of SELECT query results
- Success/error status indicators
- Execution time tracking (millisecond precision)
- Support for both read (SELECT) and write (DDL/DML) operations
- Query result caching and state management

**UI/UX:**
- Dark theme optimized for database work
- Responsive design for various screen sizes
- Loading states and error handling
- Smooth animations and transitions

## Memory Management

- Database is stored in IC stable memory starting at offset 8 bytes
- First 8 bytes store the database size
- Uses WASM page size of 64KB for memory allocation
- Automatic memory growth when database size exceeds current capacity