import { Text, View } from "react-native";
import { AppShell } from "@/components/AppShell";
import { useLocale } from "@/lib/i18n";
import { nepaliTextStyle } from "@/lib/nepali-text";
import {
  LEGAL_UPDATED,
  PRIVACY_INTRO,
  PRIVACY_SECTIONS,
  TERMS_INTRO,
  TERMS_SECTIONS,
  type LegalSection,
} from "@/lib/legal-copy";

function LegalBody({
  intro,
  sections,
}: {
  intro: { ne: string; en: string };
  sections: LegalSection[];
}) {
  const { pick } = useLocale();
  return (
    <View className="gap-8 pb-8">
      <Text className="text-base leading-relaxed text-foreground" style={nepaliTextStyle(16)}>
        {pick(intro.ne, intro.en)}
      </Text>
      {sections.map((section) => (
        <View key={section.heading.en} className="gap-2">
          <Text className="text-lg font-semibold text-foreground" style={nepaliTextStyle(18)}>
            {pick(section.heading.ne, section.heading.en)}
          </Text>
          {section.body.map((para) => (
            <Text
              key={para.en}
              className="text-base leading-relaxed text-muted-foreground"
              style={nepaliTextStyle(15)}
            >
              {pick(para.ne, para.en)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export function PrivacyDocument() {
  const { pick } = useLocale();
  return (
    <AppShell
      title={pick("गोपनीयता नीति", "Privacy Policy")}
      subtitle={pick(`अद्यावधिक: ${LEGAL_UPDATED}`, `Updated: ${LEGAL_UPDATED}`)}
    >
      <LegalBody intro={PRIVACY_INTRO} sections={PRIVACY_SECTIONS} />
    </AppShell>
  );
}

export function TermsDocument() {
  const { pick } = useLocale();
  return (
    <AppShell
      title={pick("प्रयोगका सर्त", "Terms of Use")}
      subtitle={pick(`अद्यावधिक: ${LEGAL_UPDATED}`, `Updated: ${LEGAL_UPDATED}`)}
    >
      <LegalBody intro={TERMS_INTRO} sections={TERMS_SECTIONS} />
    </AppShell>
  );
}
