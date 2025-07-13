import { createActor, canisterId } from 'declarations/backend';
import { building } from '$app/environment';
import { HttpAgent } from '@dfinity/agent';

function dummyActor() {
    return new Proxy({}, { get() { throw new Error("Canister invoked while building"); } });
}

const buildingOrTesting = building || process.env.NODE_ENV === "test";

// Create agent with Safari-compatible settings
function createSafariCompatibleActor() {
    const agent = new HttpAgent({
        host: process.env.DFX_NETWORK === "ic" ? "https://ic0.app" : "http://127.0.0.1:8000",
        // Add credentials: 'include' for Safari compatibility
        fetchOptions: {
            credentials: 'include'
        }
    });

    // Fetch root key for certificate validation during development
    if (process.env.DFX_NETWORK !== "ic") {
        agent.fetchRootKey().catch((err) => {
            console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
            console.error(err);
        });
    }

    return createActor(canisterId, { agent });
}

export const backend = buildingOrTesting
    ? dummyActor()
    : createSafariCompatibleActor();
