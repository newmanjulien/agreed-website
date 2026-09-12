type IndustryNavigationItem = {
  id: string;
  label: string;
  href: string;
};

export const plugins: readonly IndustryNavigationItem[] = [
  { id: "salesforce", label: "Salesforce", href: "/plugins/salesforce" },
  { id: "hubspot", label: "Hubspot", href: "/plugins/hubspot" },
  {
    id: "conga",
    label: "Conga",
    href: "/plugins/conga",
  },
  {
    id: "ironclad",
    label: "Ironclad",
    href: "/plugins/ironclad",
  },
  {
    id: "juro",
    label: "Juro",
    href: "/plugins/juro",
  },
];
