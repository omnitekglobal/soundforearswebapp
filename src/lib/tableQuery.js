/**
 * Build pagination, sort, and filter from searchParams for Prisma queries.
 * URL params: page, limit, sort, dir, filter_<key>
 */

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export function getTableState(searchParams) {
  const page = Math.max(1, parseInt(String(searchParams?.page || 1), 10) || 1);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(String(searchParams?.limit || DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
  );
  const sort = typeof searchParams?.sort === "string" ? searchParams.sort : null;
  const dir = searchParams?.dir === "asc" || searchParams?.dir === "desc" ? searchParams.dir : "desc";
  const filters = {};
  if (searchParams && typeof searchParams === "object") {
    for (const [key, value] of Object.entries(searchParams)) {
      if (key.startsWith("filter_") && typeof value === "string" && value.trim() !== "") {
        filters[key.replace(/^filter_/, "")] = value.trim();
      }
    }
  }
  return { page, limit, sort, dir, filters };
}

export function getSkipTake(searchParams) {
  const { page, limit } = getTableState(searchParams);
  return { skip: (page - 1) * limit, take: limit };
}

/** Build Prisma orderBy from sort/dir. Pass defaultOrderBy when no sort param. */
export function getOrderBy(searchParams, validSortKeys, defaultOrderBy) {
  const { sort, dir } = getTableState(searchParams);
  if (sort && validSortKeys.includes(sort)) {
    return { [sort]: dir };
  }
  return defaultOrderBy;
}

/** Build Prisma where from filters. columnConfig: { key: { type?: 'relation', relationKey?, field? } } - MySQL uses contains without mode. */
export function getWhere(searchParams, columnConfig = {}) {
  const { filters } = getTableState(searchParams);
  if (Object.keys(filters).length === 0) return undefined;
  const and = [];
  for (const [key, value] of Object.entries(filters)) {
    const config = columnConfig[key];
    if (!value) continue;
    const contains = { contains: value };
    if (config?.type === "relation" && config.relationKey && config.field) {
      and.push({ [config.relationKey]: { [config.field]: contains } });
    } else {
      and.push({ [key]: contains });
    }
  }
  return and.length === 0 ? undefined : { AND: and };
}
