export interface User {
  id: number | null;
  username: string | null;
  token: string | null;
  status: string | null;
  photo?: string | null;
  language: string | null;
  sentFriendRequestsList?: number[];
  receivedFriendRequestsList?: number[];
  friendsList?: number[];

}
