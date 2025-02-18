let bunWs: WebSocket,
    bunToken: string;

const evalHandler = async (payload: {
    detail: {
        js: string,
        requestId: string
    }
}) => {
    try {
        // eslint-disable-next-line no-eval
        const val = await (0, eval)(payload.detail.js);
        // ⬆️ (0, eval) is used to execute the code in global scope
        bunWs.send(JSON.stringify({
            token: bunToken,
            command: 'execResult',
            id: payload.detail.requestId,
            returnValue: val
        }));
    } catch (e) {
        bunWs.send(JSON.stringify({
            token: bunToken,
            command: 'execResult',
            id: payload.detail.requestId,
            error: e.message,
            stack: e.stack
        }));
    }
};

export default async (
    neutralino: Awaited<typeof import('@neutralinojs/lib')>,
    token: string,
    ws: WebSocket
) => {
    bunWs = ws;
    bunToken = token;
    neutralino.events.on('buntralinoEval', evalHandler);
    neutralino.events.on('buntralinoNavigate', (event: {
        detail: {
            url: string
        }
    }) => {
        window.location.href = event.detail.url;
    });
    neutralino.events.on('buntralinoReload', () => {
        window.location.reload();
    });
};
