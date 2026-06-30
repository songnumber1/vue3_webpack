export function createStudioPaginationPages(currentPage, maxPage) {
  const last = Math.max(1, Number(maxPage) || 1);
  const current = Math.min(Math.max(1, Number(currentPage) || 1), last);

  if (last <= 7) {
    return Array.from({length: last}, (_, index) => ({
      key: `p${index + 1}`,
      value: index + 1,
      label: String(index + 1),
    }));
  }

  const pages = [{key: "p1", value: 1, label: "1"}];
  if (current > 4) pages.push({key: "dots-start", label: "...", ellipsis: true});

  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);
  for (let page = start; page <= end; page += 1) {
    pages.push({key: `p${page}`, value: page, label: String(page)});
  }

  if (current < last - 3) pages.push({key: "dots-end", label: "...", ellipsis: true});
  pages.push({key: `p${last}`, value: last, label: String(last)});
  return pages;
}
