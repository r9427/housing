import { marketUrl, proxyJson } from "@/lib/server-api";

export async function POST(request: Request) {
  const body = await request.text();
  return proxyJson(`${marketUrl()}/api/market/what-if`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}
