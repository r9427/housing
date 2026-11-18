import { estimatorUrl, proxyJson } from "@/lib/server-api";

export async function GET() {
  return proxyJson(`${estimatorUrl()}/estimates`);
}

export async function POST(request: Request) {
  const body = await request.text();
  return proxyJson(`${estimatorUrl()}/estimates`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}
