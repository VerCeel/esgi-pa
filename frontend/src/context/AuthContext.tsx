import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  getUser,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  twoFactorChallenge as apiTwoFactorChallenge,
  type TwoFactorChallengeInput,
  type User,
} from "@/lib/api"

/**
 * Le login ne connecte plus forcément du premier coup : si le compte a le 2FA actif,
 * il rend un login_token que la page de login doit échanger contre un vrai token.
 */
export type LoginResult =
  | { twoFactorRequired: false }
  | { twoFactorRequired: true; loginToken: string }

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<LoginResult>
  completeTwoFactorLogin: (input: TwoFactorChallengeInput) => Promise<void>
  loginWithToken: (token: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<string>
  logout: () => Promise<void>
  updateUser: (user: User) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setIsLoading(false)
      return
    }

    getUser()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("token")
      })
      .finally(() => setIsLoading(false))
  }, [])

  const establishSession = useCallback(async (token: string) => {
    localStorage.setItem("token", token)
    setUser(await getUser())
  }, [])

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      const response = await apiLogin(email, password)

      if (response.two_factor && response.login_token) {
        // Mot de passe validé, mais pas de session tant que le code n'est pas fourni.
        return { twoFactorRequired: true, loginToken: response.login_token }
      }

      await establishSession(response.token!)
      return { twoFactorRequired: false }
    },
    [establishSession],
  )

  const completeTwoFactorLogin = useCallback(
    async (input: TwoFactorChallengeInput) => {
      const { token } = await apiTwoFactorChallenge(input)
      await establishSession(token)
    },
    [establishSession],
  )

  // Connexion sociale : le token arrive déjà émis par l'API dans l'URL de callback,
  // il ne reste qu'à ouvrir la session avec.
  const loginWithToken = useCallback(
    async (token: string) => {
      await establishSession(token)
    },
    [establishSession],
  )

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<string> => {
      // Pas de session ici : l'API n'en délivre pas tant que l'email n'est pas vérifié.
      // On renvoie le message de confirmation à afficher (« regarde ta boîte mail »).
      const { message } = await apiRegister(name, email, password)
      return message
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } finally {
      localStorage.removeItem("token")
      setUser(null)
    }
  }, [])

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser)
  }, [])

  const refreshUser = useCallback(async () => {
    const userData = await getUser()
    setUser(userData)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      completeTwoFactorLogin,
      loginWithToken,
      register,
      logout,
      updateUser,
      refreshUser,
    }),
    [
      user,
      isLoading,
      login,
      completeTwoFactorLogin,
      loginWithToken,
      register,
      logout,
      updateUser,
      refreshUser,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
