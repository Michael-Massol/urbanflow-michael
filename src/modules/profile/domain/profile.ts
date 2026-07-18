export interface Profile {
  userId: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileRepository {
  findByUserId(userId: string): Promise<Profile | null>;
  updateDisplayName(userId: string, displayName: string): Promise<Profile>;
}
