import { NextRequest } from "next/server";
import { differenceInDays } from "date-fns/differenceInDays";
import { endOfYear } from "date-fns/endOfYear";
import { startOfYear } from "date-fns/startOfYear";
import { getDay } from "date-fns/getDay";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const width = parseInt(searchParams.get("width") || "390", 10);
  const height = parseInt(searchParams.get("height") || "844", 10);
  const dateStr = searchParams.get("date") || new Date().toISOString();
  const format = searchParams.get("format") || "png"; // "svg" or "png"

  const now = new Date(dateStr);
  const startYear = startOfYear(now);
  const endYear = endOfYear(now);

  const totalDays = differenceInDays(endYear, startYear) + 1;
  const daysPassed = differenceInDays(now, startYear);

  const firstDayOfWeek = (() => {
    const day = getDay(startYear);
    return day === 0 ? 6 : day - 1;
  })();

  // Calculate responsive sizes
  const cardWidth = width * 0.75;
  const cardHeight = height * 0.48;
  const padding = Math.min(cardWidth, cardHeight) * 0.04;
  const borderRadius = Math.min(cardWidth, cardHeight) * 0.04;

  const totalRows = Math.ceil((totalDays + firstDayOfWeek) / 14);

  const availableWidth = cardWidth - padding * 2;
  const availableHeight = cardHeight - padding * 2;

  const cols = 15;
  const uniformGap = Math.min(
    availableWidth / (cols * 4),
    availableHeight / (totalRows * 4)
  );

  const dotSize = uniformGap * 1.5;

  // Calculate grid cell size
  const cellWidth = availableWidth / 15;
  const cellHeight = availableHeight / totalRows;

  // Card position
  const cardX = (width - cardWidth) / 2;
  const cardY = height * 0.35;

  // Build SVG elements
  const svgElements: string[] = [];

  // Add empty slots for days before first day of year
  for (let i = 0; i < firstDayOfWeek; i++) {
    // Empty slots don't need rendering
  }

  // Add all days
  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    const totalOffset = firstDayOfWeek + dayOffset;
    const row = Math.floor(totalOffset / 14);
    const positionInRow = totalOffset % 14;
    const col = positionInRow < 7 ? positionInRow : positionInRow + 1;

    const isPassed = dayOffset < daysPassed;
    const isToday = dayOffset === daysPassed;

    const x = cardX + padding + col * cellWidth + cellWidth / 2;
    const y = cardY + padding + row * cellHeight + cellHeight / 2;

    if (isPassed) {
      // Cross
      const size = dotSize;
      const offset = size * 0.4;
      svgElements.push(
        `<line x1="${x - offset}" y1="${y - offset}" x2="${x + offset}" y2="${
          y + offset
        }" stroke="#D9D9D9" stroke-width="${
          size * 0.2
        }" stroke-linecap="round"/>`,
        `<line x1="${x + offset}" y1="${y - offset}" x2="${x - offset}" y2="${
          y + offset
        }" stroke="#D9D9D9" stroke-width="${
          size * 0.2
        }" stroke-linecap="round"/>`
      );
    } else if (isToday) {
      // Today dot (larger, orange)
      const radius = dotSize * 0.9;
      svgElements.push(
        `<circle cx="${x}" cy="${y}" r="${radius}" fill="#F55E00"/>`
      );
    } else {
      // Future dot (semi-transparent)
      const radius = dotSize * 0.4;
      svgElements.push(
        `<circle cx="${x}" cy="${y}" r="${radius}" fill="#D9D9D9" fill-opacity="0.3"/>`
      );
    }
  }

  // Label position
  const labelY = cardY + cardHeight + cardHeight * 0.025 + 12;
  const fontSize = Math.min(width, height) * 0.025;
  const daysLeft = totalDays - daysPassed - 1;
  const percentage = ((daysPassed / totalDays) * 100).toFixed(1);

  // SVG without text for PNG (text will be rendered via JSX)
  const svgWithoutText = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="black"/>
  <rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" rx="${borderRadius}" fill="#111111"/>
  ${svgElements.join("\n  ")}
</svg>`;

  // Full SVG with text for SVG format
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="black"/>
  <rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" rx="${borderRadius}" fill="#111111"/>
  ${svgElements.join("\n  ")}
  <text x="${
    width / 2
  }" y="${labelY}" text-anchor="middle" font-family="monospace" font-size="${fontSize}" fill="white">
    <tspan>${daysLeft} days</tspan>
    <tspan fill="rgba(255,255,255,0.1)"> | </tspan>
    <tspan fill="#F55E00">${percentage}%</tspan>
  </text>
</svg>`;

  if (format === "svg") {
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=60",
      },
    });
  }

  // Convert to PNG using ImageResponse with embedded SVG as background
  const svgBase64 = Buffer.from(svgWithoutText).toString("base64");
  const svgDataUri = `data:image/svg+xml;base64,${svgBase64}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundImage: `url("${svgDataUri}")`,
          backgroundSize: "cover",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: labelY - fontSize,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontFamily: "monospace",
            fontSize,
          }}
        >
          <span style={{ color: "white" }}>{daysLeft} days</span>
          <span style={{ color: "rgba(255,255,255,0.1)", margin: "0 4px" }}>
            |
          </span>
          <span style={{ color: "#F55E00" }}>{percentage}%</span>
        </div>
      </div>
    ),
    { width, height }
  );
}
