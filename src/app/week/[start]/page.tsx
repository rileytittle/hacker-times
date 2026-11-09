import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/StoryList";
import { WeekPage } from "@/components/WeekPage";
import { FIRST_WEEK, isoDate, mondayOf, parseIsoDate, weekRangeLabel } from "@/lib/format";
import { getCurrentWeekStart } from "@/lib/week";

export async function generateMetadata({ params }: PageProps<"/week/[start]">): Promise<Metadata> {
  const t = parseIsoDate((await params).start);
  return { title: t ? `Top of the Week · ${weekRangeLabel(mondayOf(t))}` : "Top of the Week" };
}

async function Content({ params }: Pick<PageProps<"/week/[start]">, "params">) {
  const date = parseIsoDate((await params).start);
  if (date === null) notFound();

  const monday = mondayOf(date);
  const currentMonday = await getCurrentWeekStart();
  if (monday < (parseIsoDate(FIRST_WEEK) ?? 0) || monday > currentMonday) notFound();
  // Canonicalize any day of the week to its Monday, and this week to /week.
  if (monday === currentMonday) redirect("/week");
  if (date !== monday) redirect(`/week/${isoDate(monday)}`);

  return <WeekPage monday={monday} currentMonday={currentMonday} />;
}

export default function Page({ params }: PageProps<"/week/[start]">) {
  return (
    <div className="list-page">
      <Suspense fallback={<ListSkeleton />}>
        <Content params={params} />
      </Suspense>
    </div>
  );
}
