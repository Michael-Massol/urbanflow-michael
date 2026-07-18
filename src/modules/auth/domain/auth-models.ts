export interface Credentials {
  email: string;
  password: string;
}

export interface RegistrationRequest extends Credentials {
  displayName: string;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  requiresEmailConfirmation?: boolean;
}

export interface AuthGateway {
  signIn(credentials: Credentials): Promise<AuthResult>;
  signUp(request: RegistrationRequest): Promise<AuthResult>;
  signOut(): Promise<void>;
}
