import DailyDots from "@/components/DailyDots";
import { useMemo } from "react";

export default function Home() {
  const now = useMemo(() => new Date(), []);

  return <DailyDots now={now} />;
}
