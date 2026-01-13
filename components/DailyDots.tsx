import { differenceInDays } from "date-fns/differenceInDays";
import { endOfYear } from "date-fns/endOfYear";
import { startOfYear } from "date-fns/startOfYear";
import { getDay } from "date-fns/getDay";

import React, { useMemo } from "react";
import range from "lodash/range";

interface Props {
  now: Date;
  width?: number;
  height?: number;
}

function DailyDots({ now, width = 390, height = 844 }: Props) {
  const startYear = useMemo(() => startOfYear(now), [now]);
  const endYear = useMemo(() => endOfYear(now), [now]);

  const totalDays = useMemo(
    () => differenceInDays(endYear, startYear) + 1,
    [endYear, startYear]
  );

  // Days passed (not including today)
  const daysPassed = useMemo(
    () => differenceInDays(now, startYear),
    [now, startYear]
  );

  // Calculate empty slots needed to start on Monday
  // getDay returns 0 for Sunday, 1 for Monday, etc.
  // We want Monday = 0, so we adjust: (getDay + 6) % 7
  const firstDayOfWeek = useMemo(() => {
    const day = getDay(startYear);
    return day === 0 ? 6 : day - 1; // Convert Sunday=0 to Monday-based (Mon=0, Sun=6)
  }, [startYear]);

  // Calculate responsive sizes based on width and height
  const cardWidth = width * 0.75;
  const cardHeight = height * 0.48;
  const padding = Math.min(cardWidth, cardHeight) * 0.04;

  // Calculate total rows (365 days / 14 days per row, plus accounting for firstDayOfWeek offset)
  const totalRows = Math.ceil((totalDays + firstDayOfWeek) / 14);

  // Calculate available space for dots
  const availableWidth = cardWidth - padding * 2;
  const availableHeight = cardHeight - padding * 2;

  // Calculate uniform gap - we have 15 columns (7 + 1 gap + 7) and totalRows
  // Gap column counts as 1 column width
  const cols = 15; // 7 + 1 (gap) + 7
  const uniformGap = Math.min(
    availableWidth / (cols * 4), // horizontal spacing
    availableHeight / (totalRows * 4) // vertical spacing
  );

  // Dot size based on gap
  const dotSize = uniformGap * 1.5;

  return (
    <div
      className={"relative bg-black"}
      style={{
        width,
        height,
      }}
    >
      <div
        className="absolute bg-[#111111] -translate-x-[50%] left-[50%]"
        style={{
          width: cardWidth,
          height: cardHeight,
          top: height * 0.35,
          borderRadius: Math.min(cardWidth, cardHeight) * 0.04,
          padding,
        }}
      >
        <div
          className="h-full w-full grid justify-items-center items-center"
          style={{
            gridTemplateColumns: `repeat(7, 1fr) 1fr repeat(7, 1fr)`,
            gap: uniformGap,
          }}
        >
          {/* Empty slots for days before first day of year */}
          {range(firstDayOfWeek).map((i) => (
            <div
              key={`empty-start-${i}`}
              style={{ width: dotSize, height: dotSize }}
            />
          ))}
          {/* Add gap spacer if first week starts after the gap position */}
          {firstDayOfWeek >= 7 && <div key="gap-first" />}

          {range(totalDays).map((dayOffset) => {
            // Calculate position in the 14-column row (0-13)
            const totalOffset = firstDayOfWeek + dayOffset;
            const positionInRow = totalOffset % 14;

            // Add gap spacer before this dot if we're at position 7 (start of second week)
            const needsGapBefore = positionInRow === 7;

            // Check if this day has passed or is today
            const isPassed = dayOffset < daysPassed;
            const isToday = dayOffset === daysPassed;

            return (
              <React.Fragment key={dayOffset}>
                {needsGapBefore && <div className="w-0" />}
                {isPassed ? (
                  <CrossIcon size={dotSize * 1.3} />
                ) : isToday ? (
                  <TodayIcon size={dotSize * 1.8} />
                ) : (
                  <DotIcon size={dotSize} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div
          className="bg-[#111111] px-2 py-1 w-fit absolute top-[102.5%] -translate-x-[50%] left-[50%] flex items-center gap-2 text-white font-mono"
          style={{ fontSize: Math.min(width, height) * 0.025 }}
        >
          <span>{totalDays - daysPassed - 1} days</span>
          <span className="text-white/10">|</span>
          <span className="text-[#F55E00]">
            {((daysPassed / totalDays) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// Cross SVG for passed days
const CrossIcon = ({ size }: { size: number }) => (
  <svg viewBox="0 0 10 10" style={{ width: size, height: size }}>
    <line
      x1="1"
      y1="1"
      x2="9"
      y2="9"
      stroke="#D9D9D9"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="9"
      y1="1"
      x2="1"
      y2="9"
      stroke="#D9D9D9"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// Dot SVG for future days
const DotIcon = ({ size }: { size: number }) => (
  <svg viewBox="0 0 10 10" style={{ width: size, height: size }}>
    <circle cx="5" cy="5" r="4" fill="#D9D9D9" />
  </svg>
);

// Today's dot - larger and orange
const TodayIcon = ({ size }: { size: number }) => (
  <svg viewBox="0 0 10 10" style={{ width: size, height: size }}>
    <circle cx="5" cy="5" r="5" fill="#F55E00" />
  </svg>
);

export default DailyDots;
