import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/StoryList";
import { WeekPage } from "@/components/WeekPage";
import { getCurrentWeekStart } from "@/lib/week";

export const metadata: Metadata = { title: "Top of the Week" };

async function CurrentWeek() {
  const monday = await getCurrentWeekStart();
  return <WeekPage monday={monday} currentMonday={monday} />;
}

export default function Page() {
  return (
    <div className="list-page">
      <Suspense fallback={<ListSkeleton />}>
        <CurrentWeek />
      </Suspense>
    </div>
  );
}
