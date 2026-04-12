import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Navigate, Outlet } from "react-router";
import type { AuthUser } from "@/types/types";

const AUTH_TOKEN_STORAGE_KEY = "auth.token";
const AUTH_USER_STORAGE_KEY = "auth.user";

type SigninResponse = {
  token: string;
  user: {
    userId: number;
    name: string;
    admin: boolean;
    organizationName: string;
  };
};

type DecodedToken = {
  userId: number;
  organizationId: number;
  admin: boolean;
};

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  signin: (email: string, password: string) => Promise<void>;
  signout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function decodeBase64Url(value: string) {
  const normalizedValue = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalizedValue.length % 4)) % 4;
  return atob(normalizedValue.padEnd(normalizedValue.length + paddingLength, "="));
}

function decodeToken(token: string): DecodedToken | null {
  try {
    const [, payload] = token.split(".");

    if (!payload) {
      return null;
    }

    const parsedPayload = JSON.parse(decodeBase64Url(payload)) as Partial<DecodedToken>;

    const userId = parsedPayload.userId;
    const organizationId = parsedPayload.organizationId;

    if (
      userId === undefined ||
      organizationId === undefined ||
      !Number.isInteger(userId) ||
      !Number.isInteger(organizationId) ||
      typeof parsedPayload.admin !== "boolean"
    ) {
      return null;
    }

    return {
      userId,
      organizationId,
      admin: parsedPayload.admin,
    };
  } catch {
    return null;
  }
}

function readStoredUserProfile() {
  try {
    const value = localStorage.getItem(AUTH_USER_STORAGE_KEY);

    if (!value) {
      return null;
    }

    const parsedValue = JSON.parse(value) as Partial<Pick<AuthUser, "name" | "organizationName">>;

    if (
      typeof parsedValue.name !== "string" ||
      typeof parsedValue.organizationName !== "string"
    ) {
      return null;
    }

    return {
      name: parsedValue.name,
      organizationName: parsedValue.organizationName,
    };
  } catch {
    return null;
  }
}

function buildUserFromToken(token: string, profile?: Pick<AuthUser, "name" | "organizationName">) {
  const decodedToken = decodeToken(token);

  if (!decodedToken) {
    return null;
  }

  return {
    ...decodedToken,
    name: profile?.name ?? "",
    organizationName: profile?.organizationName ?? "",
  };
}

function restoreSession() {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

  if (!token) {
    return { token: null, user: null };
  }

  const user = buildUserFromToken(token, readStoredUserProfile() ?? undefined);

  if (!user) {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);

    return { token: null, user: null };
  }

  return { token, user };
}

async function readErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { error?: string; message?: string };
    return body.error ?? body.message ?? "Unable to sign in.";
  } catch {
    return "Unable to sign in.";
  }
}

function redirectToSignin() {
  if (window.location.pathname === "/signin") {
    return;
  }

  window.history.pushState({}, "", "/signin");
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function toAbsoluteRequestInfo(input: RequestInfo | URL): RequestInfo | URL {
  if (typeof input === "string") {
    return new URL(input, window.location.origin).toString();
  }

  if (input instanceof URL) {
    return new URL(input.toString(), window.location.origin);
  }

  return input;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const initialSession = useMemo(() => restoreSession(), []);
  const [token, setToken] = useState<string | null>(initialSession.token);
  const [user, setUser] = useState<AuthUser | null>(initialSession.user);
  const tokenRef = useRef(token);
  const signoutRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const setSession = useCallback((nextToken: string, nextUser: AuthUser) => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, nextToken);
    localStorage.setItem(
      AUTH_USER_STORAGE_KEY,
      JSON.stringify({
        name: nextUser.name,
        organizationName: nextUser.organizationName,
      }),
    );
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const signout = useCallback(() => {
    clearSession();
    redirectToSignin();
  }, [clearSession]);

  signoutRef.current = signout;

  const signin = useCallback(async (email: string, password: string) => {
    const response = await fetch("/api/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    const data = (await response.json()) as SigninResponse;
    const decodedToken = decodeToken(data.token);

    if (!decodedToken) {
      throw new Error("Unable to restore the authenticated session.");
    }

    setSession(data.token, {
      userId: decodedToken.userId,
      organizationId: decodedToken.organizationId,
      admin: decodedToken.admin,
      name: data.user.name,
      organizationName: data.user.organizationName,
    });
  }, [setSession]);

  useLayoutEffect(() => {
    const baseFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(toAbsoluteRequestInfo(input), init);
      const activeToken = tokenRef.current;
      const isApiRequest = request.url.startsWith(window.location.origin)
        ? new URL(request.url).pathname.startsWith("/api")
        : request.url.startsWith("/api");

      if (isApiRequest && activeToken && !request.headers.has("Authorization")) {
        request.headers.set("Authorization", `Bearer ${activeToken}`);
      }

      const response = await baseFetch(request);

      if (
        isApiRequest &&
        response.status === 401 &&
        !new URL(request.url, window.location.origin).pathname.endsWith("/signin")
      ) {
        signoutRef.current();
      }

      return response;
    };

    return () => {
      window.fetch = baseFetch;
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      signin,
      signout,
    }),
    [signin, signout, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export function ProtectedRoute() {
  const { token, user } = useAuth();

  if (!token || !user) {
    return <Navigate replace to="/signin" />;
  }

  return <Outlet />;
}
