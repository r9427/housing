import { estimatorUrl, proxyJson } from "@/lib/server-api";

export async function POST(request: Request) {
  const body = await request.text();
  return proxyJson(`${estimatorUrl()}/estimates/compare`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}
