import { ConnectionView, PageInfoView } from '@/core/pagination/pagination.types';

export function buildConnectionPage<TNode, TCursor>(
  items: TNode[],
  first: number,
  getCursor: (item: TNode) => TCursor,
  encodeCursor: (cursor: TCursor) => string,
): ConnectionView<TNode> {
  const hasNextPage = items.length > first;
  const nodes = hasNextPage ? items.slice(0, first) : items;
  const lastNode = nodes.at(-1);

  const pageInfo: PageInfoView = {
    hasNextPage,
    endCursor: lastNode ? encodeCursor(getCursor(lastNode)) : null,
  };

  return { nodes, pageInfo };
}
