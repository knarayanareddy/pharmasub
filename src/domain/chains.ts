import type { Case, ChainLink, Product, SubstanceTable } from "./types";

const packageSize = (value: string): number => Number(value.match(/[\d]+/)?.[0] || 0);
const routeRank = { nl_geregistreerd: 0, import: 1, bereiding: 2 } as const;

function toLink(product: Product, pkg: string, c: Case): ChainLink | null {
  const route = product.nl_registered ? "nl_geregistreerd" : product.eu_registered ? "import" : "bereiding";
  if (route === "import" && !product.foreign_registration) return null;
  const changed = product.strength !== c.strength || product.form !== c.form || pkg !== c.package;
  return {
    substance: product.substance,
    product: product.product,
    strength: product.strength,
    form: product.form,
    package: pkg,
    route,
    foreign_registration: product.foreign_registration,
    hop: changed ? 1 : 0,
    source: product.source,
  };
}

export function generateChains(c: Case, table: SubstanceTable): ChainLink[] {
  const substance = table[c.substance];
  if (!substance || c.therapeutic_need) return [];
  const links = substance.products.flatMap((product) =>
    product.packages.map((pkg) => toLink(product, pkg, c)).filter((link): link is ChainLink => link !== null),
  );
  return links.sort((a, b) =>
    a.hop - b.hop ||
    Math.abs(packageSize(a.package) - packageSize(c.package)) - Math.abs(packageSize(b.package) - packageSize(c.package)) ||
    routeRank[a.route] - routeRank[b.route] ||
    a.product.localeCompare(b.product, "nl"),
  );
}
