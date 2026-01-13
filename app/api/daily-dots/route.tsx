import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { differenceInDays } from "date-fns/differenceInDays";
import { endOfYear } from "date-fns/endOfYear";
import { startOfYear } from "date-fns/startOfYear";
import { getDay } from "date-fns/getDay";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const width = parseInt(searchParams.get("width") || "390", 10);
  const height = parseInt(searchParams.get("height") || "844", 10);
  const dateStr = searchParams.get("date") || new Date().toISOString();

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

  const totalRows = Math.ceil((totalDays + firstDayOfWeek) / 14);

  const availableWidth = cardWidth - padding * 2;
  const availableHeight = cardHeight - padding * 2;

  const cols = 15;
  const uniformGap = Math.min(
    availableWidth / (cols * 4),
    availableHeight / (totalRows * 4)
  );

  const dotSize = uniformGap * 1.5;

  // Generate dots data
  const dots: Array<{
    type: "empty" | "cross" | "today" | "dot" | "gap";
    row: number;
    col: number;
  }> = [];

  // Add empty slots for days before first day of year
  for (let i = 0; i < firstDayOfWeek; i++) {
    const totalOffset = i;
    const row = Math.floor(totalOffset / 14);
    const positionInRow = totalOffset % 14;
    const col = positionInRow < 7 ? positionInRow : positionInRow + 1; // +1 to account for gap column
    dots.push({ type: "empty", row, col });
  }

  // Add gap spacer if first week starts after position 7
  if (firstDayOfWeek >= 7) {
    dots.push({ type: "gap", row: 0, col: 7 });
  }

  // Add all days
  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    const totalOffset = firstDayOfWeek + dayOffset;
    const row = Math.floor(totalOffset / 14);
    const positionInRow = totalOffset % 14;
    const col = positionInRow < 7 ? positionInRow : positionInRow + 1;

    const needsGapBefore = positionInRow === 7;
    if (needsGapBefore) {
      dots.push({ type: "gap", row, col: 7 });
    }

    const isPassed = dayOffset < daysPassed;
    const isToday = dayOffset === daysPassed;

    dots.push({
      type: isPassed ? "cross" : isToday ? "today" : "dot",
      row,
      col,
    });
  }

  // Calculate grid cell size
  const cellWidth = availableWidth / 15;
  const cellHeight = availableHeight / totalRows;

  return new ImageResponse(
    (
      <div
        style={{
          width,
          height,
          backgroundColor: "black",
          display: "flex",
          position: "relative",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: cardWidth,
            height: cardHeight,
            backgroundColor: "#111111",
            borderRadius: Math.min(cardWidth, cardHeight) * 0.04,
            padding,
            position: "absolute",
            top: height * 0.35,
            display: "flex",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexWrap: "wrap",
              position: "relative",
            }}
          >
            {dots.map((dot, index) => {
              const x = dot.col * cellWidth + cellWidth / 2;
              const y = dot.row * cellHeight + cellHeight / 2;

              if (dot.type === "empty" || dot.type === "gap") {
                return null;
              }

              if (dot.type === "cross") {
                const size = dotSize * 1;
                return (
                  <svg
                    key={index}
                    width={size}
                    height={size}
                    viewBox="0 0 10 10"
                    style={{
                      position: "absolute",
                      left: x - size / 2,
                      top: y - size / 2,
                    }}
                  >
                    <line
                      x1="1"
                      y1="1"
                      x2="9"
                      y2="9"
                      stroke="#D9D9D9"
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                    <line
                      x1="9"
                      y1="1"
                      x2="1"
                      y2="9"
                      stroke="#D9D9D9"
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  </svg>
                );
              }

              if (dot.type === "today") {
                const size = dotSize * 1.8;
                return (
                  <svg
                    key={index}
                    width={size}
                    height={size}
                    viewBox="0 0 10 10"
                    style={{
                      position: "absolute",
                      left: x - size / 2,
                      top: y - size / 2,
                    }}
                  >
                    <circle cx="5" cy="5" r="5" fill="#F55E00" />
                  </svg>
                );
              }

              // Regular dot
              return (
                <svg
                  key={index}
                  width={dotSize}
                  height={dotSize}
                  viewBox="0 0 10 10"
                  style={{
                    position: "absolute",
                    left: x - dotSize / 2,
                    top: y - dotSize / 2,
                  }}
                >
                  <circle cx="5" cy="5" r="4" fill="#D9D9D950" />
                </svg>
              );
            })}
          </div>
        </div>
        {/* Bottom label */}
        <div
          style={{
            position: "absolute",
            top: height * 0.35 + cardHeight + cardHeight * 0.025,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#111111",
            padding: "4px 8px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "white",
            fontFamily: "monospace",
            fontSize: Math.min(width, height) * 0.025,
          }}
        >
          <span>{totalDays - daysPassed - 1} days</span>
          <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
          <span style={{ color: "#F55E00" }}>
            {((daysPassed / totalDays) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    ),
    {
      width,
      height,
    }
  );
}
