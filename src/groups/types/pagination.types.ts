export type GroupCursor = {
  updatedAt: Date;
  id: string;
};

export type MemberCursor = {
  joinedAt: Date;
  userId: string;
};

export type EncodedGroupCursor = {
  updatedAt: string;
  id: string;
};

export type EncodedMemberCursor = {
  joinedAt: string;
  userId: string;
};
