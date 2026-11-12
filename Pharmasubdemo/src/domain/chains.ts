import type { Case, ChainLink, Product, SubstanceTable } from "./types";

const packageSize = (value: string): number => Number(value.match(/[\d]+/)?.[0] || 0);
const routeRank = { nl_geregistreerd: 0, import: 1, bereiding: 2 } as const;

function toLink(product: Product, pkg: string, c: Case): ChainLink | null {
  const route = product.nl_registered ? "nl_geregistreerd" : product.eu_registered ? "import" : "bereiding";
  // An import without a citable foreign registration is still emitted: the gate
  // (P-IMPORT-01) must refuse it visibly instead of silently dropping it.
  // hop = number of clinically relevant changes (strength, form); a pure
  // package change counts as one hop. Two or more changes need explicit review.
  const clinical = Number(product.strength !== c.strength) + Number(product.form !== c.form);
  const hop = (clinical > 0 ? clinical : Number(pkg !== c.package)) as 0 | 1 | 2;
  return {
    substance: product.substance,
    product: product.product,
    strength: product.strength,
    form: product.form,
    package: pkg,
    route,
    foreign_registration: product.foreign_registration,
    hop,
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
