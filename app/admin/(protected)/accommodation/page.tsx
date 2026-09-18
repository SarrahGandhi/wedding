import Link from "next/link";
import { PageHeader } from "@/app/shared/PageHeader";
import { getLogisticsData } from "../logistics/data";
import { AccommodationWorkspace } from "./AccommodationWorkspace";

export default async function AccommodationPage() {
  const { families } = await getLogisticsData();
  return (
    <div>
      <PageHeader chapter="Chapter VI" title="Accommodation." />
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
          Confirmed families, grouped by where they’re staying. Hotel guests stay together in one group, with room numbers to help you plan shared stays.
        </p>
        <Link href="/admin/logistics" className="text-sm text-accent hover:text-foreground">Manage logistics &rarr;</Link>
      </div>
      <AccommodationWorkspace families={families} />
    </div>
  );
}
