# Cydra
Cydra is an ICP (Internet Computer Protocol) SQLite database management platform built with Rust. It demonstrates the use of ICSQLite - a cloud SQLite database implementation for the Internet Computer that provides SDK for developers to persist data in IC canisters. The ultimate goal of this application is to allow the user to create it's own databases, manage tables, upload data and query data.

Initial version of the project will be just a proof of concept. A single canister (backend) application with a frontend allowing to interact with SQLite database.

## Summary
Common Test Example of using ICSQLite in IC Canister

## Setup

To build and install this code, you will need:

- Git
- [DFX] version 0.9.0
- [Rust] version 1.55.0 or later

```sh
git clone https://github.com/froghub-io/ic-sqlite.git
cd examples/common 
```

To start the local replica before installing the canister:

```sh
dfx start --background --clean
```

Register, build and deploy the project.
```sh
dfx deploy
```

Run run scripts
```sh
bash run.sh
```