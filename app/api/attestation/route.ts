import { NextResponse } from "next/server";

export async function GET() {
  console.log("Fetching attestation report...");

  try {
    const response = await fetch(
      "https://nilai-a779.nillion.network/v1/attestation/report",
      {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer Nillion2025",
        },
      }
    );

    if (!response.ok) {
      console.error("Attestation API error:", {
        status: response.status,
        statusText: response.statusText,
      });
      return NextResponse.json(
        { error: "Failed to fetch attestation" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Attestation report fetched successfully");

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching attestation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
