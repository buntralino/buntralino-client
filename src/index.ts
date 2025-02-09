import listeners from './listeners';

const getUid = () => Date.now().toString(36) + Math.random().toString(36);

let bunToken: string, bunPort: number, bunWs: WebSocket;
let readyResolve: (value: void | PromiseLike<void>) => void,
    readyReject: (reason?: Error) => void;
const readyPromise = new Promise<void>((resolve, reject) => {
    readyResolve = resolve;
    readyReject = reject;
});

let bunCheckEnabled = true;
export const disableBunCheck = () => {
    bunCheckEnabled = false;
};

(async () => {
    const Neutralino = window.Neutralino ?? (await import('@neutralinojs/lib')).default;
    Neutralino.events.on('ready', async () => {
        // Firstly check that this window was opened with Buntralino
        if (bunCheckEnabled &&
            window.NL_RESMODE === 'bundle' &&
            !window.NL_ARGS.some(a => a.startsWith('--buntralino-name='))
        ) {
            // Open the actual Buntralino app and exit
            const config = await Neutralino.app.getConfig();
            let execPath = `${window.NL_CWD}/${config.cli.binaryName}`;
            if (window.NL_OS === 'Windows') {
                execPath += '.exe';
            }
            try {
                // Check if the file exists
                Neutralino.filesystem.getStats(execPath);
                // Run the proper executable and detach it
                await Neutralino.os.execCommand(`"${execPath}"`, {
                    background: true,
                    cwd: window.NL_CWD
                });
                Neutralino.app.exit();
            } catch (error) {
                window.alert('"neutralino" is not the main executable! Please run the other one.');
                Neutralino.app.exit();
            } finally {
                return;
            }
        }

        // Try connecting to Buntralino
        try {
            const match1 = window.NL_ARGS.find(a => a.startsWith('--buntralino-port=')),
                  match2 = window.NL_ARGS.find(a => a.startsWith('--buntralino-name='));
            if (!match1 || !match2) {
                return;
            }
            const [, port] = match1.split('=');
            const [, name] = match2.split('=');
            const neuToken = window.NL_TOKEN || sessionStorage.NL_TOKEN;
            bunWs = new WebSocket(`ws://127.0.0.1:${port}`);
            bunWs.onopen = () => {
                // eslint-disable-next-line no-console
                console.debug('⚛️ Announcing ourself to Buntralino…');
                bunWs.send(JSON.stringify({
                    command: 'announceSelf',
                    name,
                    NL_PORT: window.NL_PORT,
                    NL_TOKEN: neuToken
                }));
            };

            const listener = (payload: {
                detail: {
                    token: string,
                    port: number
                }
            }) => {
                Neutralino.events.off('buntralinoRegisterParent', listener);
                if (!payload.detail.token || !payload.detail.port) {
                    return;
                }
                bunToken = payload.detail.token;
                bunPort = payload.detail.port;
                bunWs = new WebSocket(`ws://127.0.0.1:${bunPort}`);
                bunWs.onopen = () => {
                    listeners(bunToken, bunWs);
                    // eslint-disable-next-line no-console
                    console.log('⚛️🥟 Buntralino connected on port', bunPort);
                    readyResolve();
                };
            };
            Neutralino.events.on('buntralinoRegisterParent', listener);
        } catch (error) {
            readyReject(error);
            console.error('⚛️ Buntralino failed with', error);
        }
    });
    // Initialize Neutralino just in case the app developer didn't do it themselves
    Neutralino.init();
})();

/**
 * Runs a method registered through registerMethod or registerMethodMap on Bun side.
 * Payload can be any JSON serializable value.
 * Returns a Promise that resolves with the result of the method or rejects with an Error.
 *
 * Example:
 * ```js
 * await buntralino.run('downloadFile', {
 *     src: 'https://secret.bunnies.io/builds/windows.exe',
 *     dest: 'dependencies/secretBunnies.exe'
 * });
 * ```
 */
export const run = async (methodName: string, payload?: unknown): Promise<unknown> => {
    await readyPromise;
    const awaitedResponseId = getUid();
    bunWs.send(JSON.stringify({
        token: bunToken,
        command: 'run',
        method: methodName,
        id: awaitedResponseId,
        payload
    }));
    return new Promise<unknown>((resolve, reject) => {
        const listener = (event: CustomEvent<{
            id: string,
            returnValue?: unknown,
            error?: string | null,
            stack?: string | null
        }>) => {
            const {id, returnValue, error, stack} = event.detail;
            if (id === awaitedResponseId) {
                Neutralino.events.off('buntralinoExecResult', listener);
                if ('error' in event.detail) {
                    reject(new Error(error ?? 'Unknown error', {
                        cause: stack ? new Error(stack) : null
                    }));
                }
                resolve(returnValue);
            }
        };
        Neutralino.events.on('buntralinoExecResult', listener);
    });
};

/**
 * Fully shuts down the Buntralino app.
 */
export const shutdown = () => {
    bunWs.send(JSON.stringify({
        token: bunToken,
        command: 'shutdown'
    }));
};

/**
 * Sends an event with additional event.detail value to all the Neutralino instances.
 *
 * Example:
 * ```js
 * buntralino.broadcast('newUpdate', {
 *     version: '1.4.2'
 * });
 * ```
 */
export const broadcast = (eventName: string, payload: unknown) => {
    bunWs.send(JSON.stringify({
        token: bunToken,
        command: 'broadcast',
        event: eventName,
        payload
    }));
};
/**
 * Sends an event with additional event.detail value to a specific named Neutralino instance.
 *
 * Example:
 * ```js
 * buntralino.sendEvent('main', 'loginSuccessful', {
 *     username: 'Doofus3000'
 * });
 * ```
 */
export const sendEvent = (target: string, eventName: string, payload?: unknown) => {
    bunWs.send(JSON.stringify({
        token: bunToken,
        command: 'sendEvent',
        event: eventName,
        target,
        payload
    }));
};

/**
 * A Promise that resolves when the Buntralino client is ready to accept commands.
 */
export const ready = readyPromise;

export default {
    run,
    ready,
    shutdown,
    broadcast,
    sendEvent
};
