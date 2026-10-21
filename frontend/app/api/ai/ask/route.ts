
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    const backendUrl =
      process.env.BACKEND_API_URL ??
      "http://127.0.0.1:8000";

    const response = await fetch(
      `${backendUrl}/api/v1/products/ask`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("VisionCart AI proxy failed:", error);

    return NextResponse.json(
      { detail: "Could not connect to the VisionCart backend." },
      { status: 502 },
    );
  }
}
