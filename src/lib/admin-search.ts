export type AdminSearchResult = {
  id: string;
  title: string;
  description?: string;
  section: string;
  to: string;
};

export function searchAdminData(
  query: string,
  data: AdminSearchResult[],
): AdminSearchResult[] {
  const term = query.trim().toLowerCase();

  if (!term) return [];

  return data
    .filter((item) =>
      [
        item.title,
        item.description,
        item.section,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term)),
    )
    .slice(0, 8);
}
