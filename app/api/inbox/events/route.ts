import { sseKeepAlive, subscribeSse } from "@/lib/inbox/sse-hub";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (request.signal.aborted) {
    return new Response(null, { status: 499 });
  }

  let unsubscribe: (() => void) | null = null;
  let keepAlive: ReturnType<typeof setInterval> | null = null;
  let isClosed = false;
  let cleanupFn: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const enqueue = (chunk: string) => {
        controller.enqueue(encoder.encode(chunk));
      };

      const cleanup = () => {
        if (isClosed) return;
        isClosed = true;

        if (keepAlive) {
          clearInterval(keepAlive);
          keepAlive = null;
        }
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
        try {
          controller.close();
        } catch {
          // ignore if already closed
        }
        request.signal.removeEventListener("abort", onAbort);
      };

      cleanupFn = cleanup;

      const onAbort = () => {
        cleanup();
      };

      request.signal.addEventListener("abort", onAbort);

      unsubscribe = subscribeSse(
        (chunk) => {
          try {
            enqueue(chunk);
          } catch {
            cleanup();
          }
        },
        () => {
          cleanup();
        }
      );

      // Send initial keepalive
      try {
        enqueue(sseKeepAlive());
      } catch {
        cleanup();
        return;
      }

      keepAlive = setInterval(() => {
        try {
          enqueue(sseKeepAlive());
        } catch {
          cleanup();
        }
      }, 25000);
    },
    cancel() {
      cleanupFn?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
