/**
 * Simple JavaScript (Node.js) Simulation of the Dining Philosophers Problem.
 *
 * NOTE: This is an ASYNCHRONOUS SIMULATION using setTimeout/async/await
 * to mimic concurrent execution and time delays. It DOES NOT use actual
 * multi-threading, Semaphores, or Mutexes, as standard JavaScript (Node.js)
 * is single-threaded. The focus is on the logic of resource (fork) contention.
 */

// --- 1. Setup: Define the Resources and Entities ---

// The number of philosophers at the table
const NUM_PHILOSOPHERS = 5;

// An array representing the 5 forks on the table.
// 'true' means the fork is AVAILABLE, 'false' means it is IN USE.
// Fork 0 is to the right of Philosopher 0.
const forks = [true, true, true, true, true];

// A simple function to pause the execution for a given time (in milliseconds)
function delay(ms) {
    // This returns a promise that resolves after 'ms' milliseconds, simulating time passing.
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- 2. The Philosopher's Life Cycle ---

// The main function that defines what a philosopher does forever.
async function philosopherLife(id) {
    // A loop so the philosopher continuously thinks and eats.
    while (true) {
        // Philosopher 'id' is thinking.
        console.log(`[P${id}]  is thinking...`);
        // Simulate thinking time.
        await delay(Math.random() * 500 + 500); // Wait between 0.5 and 1 second.

        // Time to eat! Philosophers must grab two forks: left and right.
        const leftForkIndex = id;
        // The right fork is the one with the next index (circularly).
        const rightForkIndex = (id + 1) % NUM_PHILOSOPHERS;

        // *** CRITICAL SECTION START: Attempt to acquire resources ***

        console.log(`[P${id}]  wants to eat and needs F${leftForkIndex} (Left) and F${rightForkIndex} (Right).`);

        // --- PROBLEM/DEADLOCK TRIGGER ---
        // This is the classic, unsafe method: Grab the left fork first, then the right.
        // If all philosophers grab their left fork simultaneously, the system deadlocks.

        // 1. Try to pick up the LEFT fork
        if (forks[leftForkIndex]) {
            forks[leftForkIndex] = false; // Mark the left fork as IN USE.
            console.log(`[P${id}]  grabbed F${leftForkIndex} (Left). Waiting for F${rightForkIndex} (Right)...`);
            // Add a small delay here to maximize the chance of a deadlock when testing.
            await delay(10);
        } else {
            // If the left fork is not available, the philosopher can't even start.
            // In a real system, this would involve blocking/waiting.
            console.log(`[P${id}]  F${leftForkIndex} (Left) is in use. Will try again later.`);
            continue; // Skip the rest of the loop and start thinking again.
        }

        // 2. Try to pick up the RIGHT fork
        // Check if the right fork is available *while* holding the left fork.
        if (forks[rightForkIndex]) {
            forks[rightForkIndex] = false; // Mark the right fork as IN USE.

            // --- Eating ---
            console.log(`[P${id}] 🍴 grabbed F${rightForkIndex} (Right). EATING!`);
            // Simulate eating time.
            await delay(Math.random() * 500 + 500); // Wait between 0.5 and 1 second.
            console.log(`[P${id}]  is done eating.`);

            // --- Releasing Resources (Forks) ---
            forks[leftForkIndex] = true; // Put down the left fork.
            forks[rightForkIndex] = true; // Put down the right fork.
            console.log(`[P${id}]  released F${leftForkIndex} and F${rightForkIndex}.`);

        } else {
            // If the right fork is NOT available, this philosopher is holding the left fork
            // and cannot proceed. THIS is the state that leads to **DEADLOCK** if all
            // philosophers are stuck here!

            console.log(`[P${id}] ⚠️ F${rightForkIndex} (Right) is in use. Must release F${leftForkIndex}!`);

            // RELEASE THE HELD RESOURCE (Left Fork) to prevent a permanent block.
            // This is how a proper synchronization mechanism would handle a failure to acquire.
            forks[leftForkIndex] = true;
            console.log(`[P${id}]  released F${leftForkIndex} and will try to eat again later.`);
        }

        // *** CRITICAL SECTION END ***
    }
}

// --- 3. Start the Simulation ---

console.log('--- Dining Philosophers Simulation Started ---');

// Create and start all 5 philosophers.
for (let i = 0; i < NUM_PHILOSOPHERS; i++) {
    // Run each philosopher's life cycle in the background.
    philosopherLife(i);
}

// Instructions for running:
// 1. Save this code as a file, e.g., 'philosophers.js'.
// 2. Open your terminal and run: node philosophers.js
// 3. Watch for a state where many philosophers release their single held fork (Deadlock Prevention logic) or get stuck.