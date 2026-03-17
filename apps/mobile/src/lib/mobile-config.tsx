import * as SecureStore from "expo-secure-store";
import {
  type PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import {
  type SocialProvider,
  getAuthSession,
  signInWithEmail,
  signInWithSocial,
  signOutSession,
  signUpWithEmail,
} from "./api";
import type { AuthSessionPayload, AuthUser } from "./types";

const suggestedApiBaseUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  Platform.select({
    android: "http://10.0.2.2:8787",
    ios: "http://127.0.0.1:8787",
    default: "http://localhost:8787",
  }) ||
  "http://localhost:8787";

type MobileConfigContextValue = {
  isReady: boolean;
  apiBaseUrl: string;
  demoMode: boolean;
  organizationId: string;
  authToken: string | null;
  currentUser: AuthUser | null;
  currentSession: AuthSessionPayload | null;
  isAuthenticated: boolean;
  setApiBaseUrl: (value: string) => void;
  setDemoMode: (value: boolean) => void;
  setOrganizationId: (value: string) => void;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signInWithSocial: (provider: SocialProvider) => Promise<void>;
  signUp: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  resetDefaults: () => void;
};

const CONFIG_KEY = "nucleo-mobile-config";
const AUTH_KEY = "nucleo-mobile-auth";

const MobileConfigContext = createContext<MobileConfigContextValue | null>(
  null,
);

export function MobileConfigProvider({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState(suggestedApiBaseUrl);
  const [demoMode, setDemoMode] = useState(true);
  const [organizationId, setOrganizationId] = useState("demo-org");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentSession, setCurrentSession] =
    useState<AuthSessionPayload | null>(null);

  useEffect(() => {
    async function hydrate() {
      const [storedConfigRaw, storedAuthRaw] = await Promise.all([
        SecureStore.getItemAsync(CONFIG_KEY),
        SecureStore.getItemAsync(AUTH_KEY),
      ]);

      if (storedConfigRaw) {
        const storedConfig = JSON.parse(storedConfigRaw) as {
          apiBaseUrl?: string;
          demoMode?: boolean;
          organizationId?: string;
        };
        if (storedConfig.apiBaseUrl) setApiBaseUrl(storedConfig.apiBaseUrl);
        if (typeof storedConfig.demoMode === "boolean") {
          setDemoMode(storedConfig.demoMode);
        }
        if (storedConfig.organizationId) {
          setOrganizationId(storedConfig.organizationId);
        }
      }

      if (storedAuthRaw) {
        const storedAuth = JSON.parse(storedAuthRaw) as {
          authToken?: string | null;
          currentUser?: AuthUser | null;
          currentSession?: AuthSessionPayload | null;
        };
        if (storedAuth.authToken) setAuthToken(storedAuth.authToken);
        if (storedAuth.currentUser) setCurrentUser(storedAuth.currentUser);
        if (storedAuth.currentSession)
          setCurrentSession(storedAuth.currentSession);
      }

      setIsReady(true);
    }

    void hydrate();
  }, []);

  useEffect(() => {
    if (!isReady || !authToken || demoMode) return;
    void (async () => {
      try {
        const session = await getAuthSession(apiBaseUrl, authToken);
        setCurrentSession(session);
        setCurrentUser(session?.user ?? null);
        const activeOrganizationId =
          session?.session?.activeOrganizationId ||
          session?.activeOrganizationId;
        if (activeOrganizationId) {
          setOrganizationId(activeOrganizationId);
        }
      } catch {
        setAuthToken(null);
        setCurrentUser(null);
        setCurrentSession(null);
        setDemoMode(true);
        setOrganizationId("demo-org");
      }
    })();
  }, [apiBaseUrl, authToken, demoMode, isReady]);

  useEffect(() => {
    if (!isReady) return;
    void SecureStore.setItemAsync(
      CONFIG_KEY,
      JSON.stringify({ apiBaseUrl, demoMode, organizationId }),
    );
  }, [apiBaseUrl, demoMode, organizationId, isReady]);

  useEffect(() => {
    if (!isReady) return;
    void SecureStore.setItemAsync(
      AUTH_KEY,
      JSON.stringify({ authToken, currentUser, currentSession }),
    );
  }, [authToken, currentUser, currentSession, isReady]);

  const applyAuthenticatedSession = (
    token: string,
    session: AuthSessionPayload | null,
  ) => {
    const activeOrganizationId =
      session?.session?.activeOrganizationId ||
      session?.activeOrganizationId ||
      organizationId;
    setAuthToken(token);
    setCurrentSession(session);
    setCurrentUser(session?.user ?? null);
    setDemoMode(false);
    if (activeOrganizationId) {
      setOrganizationId(activeOrganizationId);
    }
  };

  const value = useMemo(
    () => ({
      isReady,
      apiBaseUrl,
      demoMode,
      organizationId,
      authToken,
      currentUser,
      currentSession,
      isAuthenticated: Boolean(authToken && currentUser),
      setApiBaseUrl,
      setDemoMode: (value: boolean) => {
        setDemoMode(value);
        if (value) {
          setAuthToken(null);
          setCurrentUser(null);
          setCurrentSession(null);
          setOrganizationId("demo-org");
        }
      },
      setOrganizationId,
      signIn: async ({
        email,
        password,
      }: {
        email: string;
        password: string;
      }) => {
        const result = await signInWithEmail(apiBaseUrl, { email, password });
        applyAuthenticatedSession(result.token, result.session);
      },
      signInWithSocial: async (provider: SocialProvider) => {
        const result = await signInWithSocial(apiBaseUrl, provider);
        applyAuthenticatedSession(result.token, result.session);
      },
      signUp: async ({
        name,
        email,
        password,
      }: {
        name: string;
        email: string;
        password: string;
      }) => {
        const result = await signUpWithEmail(apiBaseUrl, {
          name,
          email,
          password,
        });
        applyAuthenticatedSession(result.token, result.session);
      },
      signOut: async () => {
        if (authToken) {
          await signOutSession(apiBaseUrl, authToken);
        }
        setAuthToken(null);
        setCurrentUser(null);
        setCurrentSession(null);
        setDemoMode(true);
        setOrganizationId("demo-org");
      },
      refreshSession: async () => {
        if (!authToken) return;
        const session = await getAuthSession(apiBaseUrl, authToken);
        setCurrentSession(session);
        setCurrentUser(session?.user ?? null);
        const activeOrganizationId =
          session?.session?.activeOrganizationId ||
          session?.activeOrganizationId;
        if (activeOrganizationId) {
          setOrganizationId(activeOrganizationId);
        }
      },
      resetDefaults: () => {
        setApiBaseUrl(suggestedApiBaseUrl);
        setDemoMode(true);
        setOrganizationId("demo-org");
        setAuthToken(null);
        setCurrentUser(null);
        setCurrentSession(null);
      },
    }),
    [
      apiBaseUrl,
      authToken,
      currentSession,
      currentUser,
      demoMode,
      isReady,
      organizationId,
    ],
  );

  return (
    <MobileConfigContext.Provider value={value}>
      {children}
    </MobileConfigContext.Provider>
  );
}

export function useMobileConfig() {
  const context = useContext(MobileConfigContext);
  if (!context) {
    throw new Error("useMobileConfig must be used within MobileConfigProvider");
  }
  return context;
}
