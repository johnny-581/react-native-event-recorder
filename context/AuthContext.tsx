import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getCurrentUser, 
  signIn, 
  signUp, 
  confirmSignUp, 
  signOut, 
  AuthUser,
  resendSignUpCode,
} from 'aws-amplify/auth';

interface LoginResult {
  isSignedIn: boolean;
  nextStep?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (email: string, password: string) => Promise<{ isSignUpComplete: boolean; nextStep: string }>;
  confirmRegistration: (email: string, code: string) => Promise<void>;
  resendConfirmationCode: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string): Promise<LoginResult> {
    const result = await signIn({ username: email, password });
    
    if (result.isSignedIn) {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      return { isSignedIn: true };
    }
    
    // Handle different next steps
    const nextStep = result.nextStep?.signInStep;
    
    if (nextStep === 'CONFIRM_SIGN_UP') {
      // User needs to confirm their email
      return { isSignedIn: false, nextStep: 'CONFIRM_SIGN_UP' };
    }
    
    if (nextStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
      throw new Error('You need to set a new password. Please contact support.');
    }
    
    return { isSignedIn: false, nextStep };
  }

  async function register(email: string, password: string) {
    const result = await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
        },
      },
    });
    return {
      isSignUpComplete: result.isSignUpComplete,
      nextStep: result.nextStep.signUpStep,
    };
  }

  async function confirmRegistration(email: string, code: string) {
    await confirmSignUp({ username: email, confirmationCode: code });
  }

  async function resendConfirmationCode(email: string) {
    await resendSignUpCode({ username: email });
  }

  async function logout() {
    await signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        confirmRegistration,
        resendConfirmationCode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

