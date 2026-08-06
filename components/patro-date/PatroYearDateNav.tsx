import { PatroDateNav } from "./PatroDateNav";
import { usePatroYearBrowse } from "@/lib/use-patro-year-browse";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";
import { stepPatroBrowseYear } from "@/lib/patro-year-browse-step";
import type { PatroBrowseEra } from "@/lib/patro-era";

type Props = {
  era?: PatroBrowseEra;
  onEraChange?: (era: PatroBrowseEra) => void;
  year: number;
  onYearChange: (year: number) => void;
  className?: string;
};

/** Year-only browse bar — wraps {@link PatroDateNav} mode `year`. */
export function PatroYearDateNav({
  era: eraProp,
  onEraChange: onEraChangeProp,
  year,
  onYearChange,
  className,
}: Props) {
  const browse = usePatroYearBrowse(year);
  const era = eraProp ?? browse.era;
  const setEra = onEraChangeProp ?? browse.setEra;
  const { location, setLocation } = usePanchangaLocation();

  return (
    <PatroDateNav
      className={className}
      mode="year"
      era={era}
      onEraChange={setEra}
      year={year}
      onYearChange={onYearChange}
      location={location}
      onLocationChange={setLocation}
      onPrev={() => onYearChange(stepPatroBrowseYear(era, year, "prev"))}
      onNext={() => onYearChange(stepPatroBrowseYear(era, year, "next"))}
    />
  );
}
