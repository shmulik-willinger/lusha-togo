export interface PickerContact {
  id: string;
  name: string;
  displayName?: string;
  company?: string;
  title?: string;
}

interface PickerGroup<T> {
  label: string;
  key: string;
  data: T[];
}

export function groupForPicker<T extends PickerContact>(
  contacts: T[],
): PickerGroup<T>[] {
  const byCompany = new Map<string, T[]>();
  const noCompany: T[] = [];

  for (const c of contacts) {
    if (c.company && c.company.trim()) {
      if (!byCompany.has(c.company)) byCompany.set(c.company, []);
      byCompany.get(c.company)!.push(c);
    } else {
      noCompany.push(c);
    }
  }

  // Only surface companies with >= 3 contacts; rest go into A–Z
  const companyGroups: PickerGroup<T>[] = [];
  const azPile: T[] = [...noCompany];
  for (const [co, rows] of byCompany) {
    if (rows.length >= 3) {
      companyGroups.push({
        label: `FROM ${co.toUpperCase()} · ${rows.length}`,
        key: `co:${co}`,
        data: rows.sort((a, b) => (a.displayName ?? a.name).localeCompare(b.displayName ?? b.name)),
      });
    } else {
      azPile.push(...rows);
    }
  }

  return [
    ...companyGroups.sort((a, b) => b.data.length - a.data.length),
    ...(azPile.length > 0
      ? [{
          label: 'A–Z',
          key: 'az',
          data: azPile.sort((a, b) => (a.displayName ?? a.name).localeCompare(b.displayName ?? b.name)),
        }]
      : []),
  ];
}
