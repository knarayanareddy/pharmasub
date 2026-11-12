import type { Metadata } from "next";
import { InstrumentView } from "@/components/InstrumentView";
import { answerInstrument } from "@/domain/swarm/instrument";
import { buildPersonas } from "@/domain/swarm/personas";
import { getDictionary } from "@/i18n/dictionary";
import { getLang } from "@/i18n/server";
import "./instrument.css";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: getDictionary(lang).meta_instrument };
}

export default function InstrumentPage() {
  const answers = answerInstrument(buildPersonas());
  const abstentions = answers.filter((row) => row.q_unknown === "zeg ik liever niet").length;
  return <InstrumentView abstentions={abstentions} />;
}
