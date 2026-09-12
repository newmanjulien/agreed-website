type IndustryNavigationItem = {
  id: string;
  label: string;
  href: string;
};

export const industries: readonly IndustryNavigationItem[] = [
  { id: 'insurance', label: 'Insurance brokers', href: '/industries/insurance' },
  { id: 'law', label: 'Law firms', href: '/industries/law' },
  {
    id: 'government-relations',
    label: 'Government relations',
    href: '/industries/government-relations'
  },
  { id: 'consulting', label: 'Consulting firms', href: '/industries/consulting' },
  { id: 'accounting', label: 'Accounting firms', href: '/industries/accounting' }
];
