import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth) {
      return NextResponse.json(
        { message: "Authorization header is required." },
        { status: 401 },
      );
    }

    const body = (await req.json()) as { url?: string; name?: string };
    const rawUrl = String(body?.url ?? "").trim();
    const name = String(body?.name ?? "attachment").trim() || "attachment";

    if (!rawUrl) {
      return NextResponse.json({ message: "url is required." }, { status: 400 });
    }

    let targetUrl: URL;
    try {
      targetUrl = new URL(rawUrl);
    } catch {
      return NextResponse.json({ message: "Invalid url." }, { status: 400 });
    }

    if (!/^https?:$/.test(targetUrl.protocol)) {
      return NextResponse.json({ message: "Unsupported protocol." }, { status: 400 });
    }

    const upstream = await fetch(targetUrl.toString(), {
      headers: { Authorization: auth },
      cache: "no-store",
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return NextResponse.json(
        { message: text || "Failed to fetch attachment." },
        { status: upstream.status },
      );
    }

    const bytes = await upstream.arrayBuffer();
    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";
    const contentDisposition =
      upstream.headers.get("content-disposition") ||
      `attachment; filename="${encodeURIComponent(name)}"`;

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Unexpected download error." },
      { status: 500 },
    );
  }
}
