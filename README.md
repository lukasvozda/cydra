# Cydra

Cydra is an ICP (Internet Computer Protocol) SQLite database management platform built with Rust backend and React frontend. It demonstrates the use of ICSQLite - a cloud SQLite database implementation for the Internet Computer that persist data in IC canisters. The application allows users to create databases, manage tables, upload data and query data through a modern web interface.

The project consists of a Rust canister backend providing SQLite functionality and a React frontend application that provides a complete database management UI with real-time query execution, table browsing, and results visualization.

## Features

- **SQL Editor** with syntax highlighting and autocomplete
- **Query Execution** with both Query Calls (fast, read-only) and Update Calls (powerful, can modify data)
- **Cycle Cost Tracking** for Update Calls with USD conversion
- **Real-time Database Browsing** with table schema and data preview
- **Pagination Support** for large query results
- **Internet Identity Authentication** with extended session management
- **Balance Protection** - prevents expensive operations when cycles are low

## Setup

To build and run this project locally, you will need:

- **Git**
- **[DFX]** version 0.24.3 or later  
- **[Rust]** version 1.55.0 or later
- **[Node.js]** version 16.0.0 or later

### Installation

1. Clone the repository:
```sh
git clone https://github.com/lukasvozda/cydra.git
cd cydra
```

2. Start the local IC replica:
```sh
dfx start --background --clean
```

3. Deploy the backend canister:
```sh
dfx deploy backend
```

4. Start the frontend development server:
```sh
cd src/frontend
npm install
npm run dev
```

Or from the project root (using npm workspaces):
```sh
npm install
npm run dev
```

5. Open your browser and navigate to the frontend URL (typically `http://localhost:5173`)

### Testing the Database

You can test basic database operations using the provided script:
```sh
bash run.sh
```

Or execute SQL commands directly via CLI:
```sh
dfx canister call backend execute 'CREATE TABLE test (id INTEGER, name TEXT);'
dfx canister call backend query 'SELECT * FROM test;'
dfx canister call backend get_database_info
```

## Development

The frontend will be available at `http://localhost:5173` and will automatically reload when you make changes to the code.

For production deployment, build the frontend and deploy to IC:
```sh
npm run build
dfx deploy
```

## Acknowledgments

This project uses the ICSQLite implementation from [FrogLab's open source repository](https://github.com/froghub-io/ic-sqlite), which provides SQLite functionality for the Internet Computer Protocol.