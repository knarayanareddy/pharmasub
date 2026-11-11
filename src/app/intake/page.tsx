import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionary";
import { getLang } from "@/i18n/server";
import IntakeForm from "./IntakeForm";
import "./intake.css";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: getDictionary(lang).meta_intake };
}

export default function IntakePage() { return <IntakeForm />; }
