import Link from "next/link";
import { getDictionary } from "@/i18n/dictionary";
import { getLang } from "@/i18n/server";

export default async function NotFound() {
  const lang = await getLang();
  const d = getDictionary(lang);
  return <div className="page"><div className="panel panel-body"><div className="eyebrow">{d.notfound_eyebrow}</div><h1 className="page-title">{d.notfound_h1}</h1><p className="page-intro">{d.notfound_p}</p><Link className="btn primary" href="/">{d.notfound_btn}</Link></div></div>;
}
