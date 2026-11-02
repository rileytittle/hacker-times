import { Suspense } from "react";
import { FrontPage, FrontPageSkeleton } from "@/components/FrontPage";

export default function Home() {
  return (
    <Suspense fallback={<FrontPageSkeleton />}>
      <FrontPage feed="top" />
    </Suspense>
  );
}
