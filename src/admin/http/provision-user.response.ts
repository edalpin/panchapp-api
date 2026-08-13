export type ProvisionUserResponse = {
  created: boolean;
  user: {
    id: string;
    email: string;
    name: string | null;
    status: string;
  };
};
