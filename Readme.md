![Buntralino logo](https://buntralino.github.io/Buntralino.png)

# Buntralino library for the Neutralino side

Buntralino unites Bun and Neutralino.js to make a simpler, lighter alternative to Electron and NW.js. Use Neutralino.js API at client and send harder tasks to Bun while keeping your development process easy.

Buntralino is a hybrid app development framework that lets you use web technologies (HTML, CSS, JavaScript, TypeScript) to make desktop apps. Buntralino applications work by creating a Bun application that launches and manages Neutralino.js windows. Neutralino.js windows can exchange information with Bun and each other in a client-server model through websockets, with you using a nice promise-based API. Bun is a faster alternative to Node.js or Deno, while Neutralino.js uses native OS' browser and augments it with native functions.

## Usage

```sh
bun install --save buntralino-client # or use your package manager of choice
```

```typescript
import * as buntralino from 'buntralino-client'; // Automatically connects to Bun!

// Wait till the connection to Bun is up
await buntralino.ready;

// Call a method added on Bun side with buntralino.registerMethod
const updates = await buntralino.run('loadUpdates');

// Call a method with options (must be a JSON-serializable object)
await buntralino.run('downloadFile', {
    src: 'https://secret.bunnies.io/builds/windows.exe',
    dest: 'dependencies/secretBunnies.exe'
});

// Send an event to all Neutralino instances
buntralino.broadcast('eventName', {
    customData: 'moo'
});
// Send an event to a specific Neutralino window
buntralino.sendEvent('main', 'loginSuccessful', {
    username: 'Doofus3000'
});

// Listen to events through Neutralino API:
Neutralino.events.on('loginSuccessful', e => {
    const {username} = e.detail;
    console.log(`Logged in as ${username}!`);
});

setTimeout(() => {
    // Close ALL windows and exit the Buntralino app
    buntralino.shutdown();
}, 10_000);
```

## Development

```sh
git clone https://github.com/CosmoMyzrailGorynych/buntralino-client.git
cd ./buntralino-client
bun install
# And you're ready to code! Use `bun run build` to compile sources.
```