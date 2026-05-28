import { sseKeepAlive, subscribeSse } from "@/lib/inbox/sse-hub";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  let unsubscribe: (() => void) | null = null;
  let keepAlive: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const enqueue = (chunk: string) => controller.enqueue(encoder.encode(chunk));

      unsubscribe = subscribeSse(enqueue, () => controller.close());
      enqueue(sseKeepAlive());

      keepAlive = setInterval(() => {
        try {
          enqueue(sseKeepAlive());
        } catch {
          if (keepAlive) clearInterval(keepAlive);
        }
      }, 25000);
    },
    cancel() {
      if (keepAlive) clearInterval(keepAlive);
      unsubscribe?.();
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
