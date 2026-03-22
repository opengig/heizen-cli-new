/**
 * User profile from GET /users/me - used for token validation.
 */
export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  credits_remaining: number;
  credits_used: number;
  linkedin_profile_url: string | null;
  meeting_credits_remaining: number;
  meeting_credits_used: number;
  created_at: string;
}
