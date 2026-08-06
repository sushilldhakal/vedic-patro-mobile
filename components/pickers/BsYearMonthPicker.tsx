import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { PatroYearDateNav } from "@/components/patro-date/PatroYearDateNav";
import { getCurrentBs } from "@/lib/bs-calendar";
import { useLocale } from "@/lib/i18n";

/** @deprecated Use {@link usePatroYearBrowse} from `@/lib/use-patro-year-browse`. */
export function useBsYear(initial?: number) {
  const [year, setYear] = useState(initial ?? getCurrentBs().year);
  return { year, setYear };
}

/** @deprecated Use {@link PatroYearDateNav} from `@/components/patro-date`. */
export function BsYearPicker({
  year,
  onYearChange,
}: {
  year: number;
  onYearChange: (y: number) => void;
  min?: number;
  max?: number;
}) {
  return <PatroYearDateNav year={year} onYearChange={onYearChange} />;
}

export function BsMonthPicker({
  month,
  onMonthChange,
}: {
  month: number;
  onMonthChange: (m: number) => void;
}) {
  const { pick, digits } = useLocale();
  const labels = [
    pick("बैशाख", "Baisakh"),
    pick("जेष्ठ", "Jestha"),
    pick("आषाढ", "Ashadh"),
    pick("श्रावण", "Shrawan"),
    pick("भाद्र", "Bhadra"),
    pick("आश्विन", "Ashwin"),
    pick("कार्तिक", "Kartik"),
    pick("मंसिर", "Mangsir"),
    pick("पौष", "Poush"),
    pick("माघ", "Magh"),
    pick("फाल्गुन", "Falgun"),
    pick("चैत्र", "Chaitra"),
  ];
  return (
    <View className="mb-3 flex-row items-center justify-between rounded-xl border border-border bg-card px-3 py-2">
      <Button label="‹" variant="outline" size="sm" onPress={() => onMonthChange(month <= 1 ? 12 : month - 1)} />
      <Text className="text-base font-semibold text-foreground">
        {labels[month - 1]} ({digits(month)})
      </Text>
      <Button label="›" variant="outline" size="sm" onPress={() => onMonthChange(month >= 12 ? 1 : month + 1)} />
    </View>
  );
}

export function useBsMonth(initial = 1) {
  const [month, setMonth] = useState(initial);
  return { month, setMonth };
}
