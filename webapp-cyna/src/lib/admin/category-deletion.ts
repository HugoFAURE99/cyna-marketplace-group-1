export function planCategoryDeletion(
  ids: number[],
  productCategoryIds: number[],
) {
  const uniqueIds = [...new Set(ids.filter((id) => Number.isInteger(id) && id > 0))];
  const counts = new Map<number, number>();
  for (const id of productCategoryIds) {
    if (uniqueIds.includes(id)) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const blocked = uniqueIds.flatMap((id) => {
    const productCount = counts.get(id) ?? 0;
    return productCount ? [{ id, productCount }] : [];
  });
  const blockedIds = new Set(blocked.map((item) => item.id));
  return {
    blocked,
    deletableIds: uniqueIds.filter((id) => !blockedIds.has(id)),
  };
}
