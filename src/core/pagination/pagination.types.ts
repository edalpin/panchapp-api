export type PageInfoView = {
  hasNextPage: boolean;
  endCursor: string | null;
};

export type ConnectionView<T> = {
  nodes: T[];
  pageInfo: PageInfoView;
};
