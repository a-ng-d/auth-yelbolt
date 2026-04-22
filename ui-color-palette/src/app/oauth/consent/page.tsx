'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient, Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { colors, UicpTheme } from '../../Themes'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

const titleStyle = {
  fontSize: '32px',
  fontWeight: '700',
  fontFamily: 'var(--font-martian-mono)',
  margin: '0',
  lineHeight: '1.1',
} as React.CSSProperties

const subtitleStyle = {
  fontSize: '16px',
  fontWeight: '600',
  fontFamily: 'var(--font-lexend)',
  margin: '0',
  lineHeight: '1.5',
} as React.CSSProperties

const paragraphStyle = {
  fontSize: '16px',
  fontWeight: '500',
  fontFamily: 'var(--font-lexend)',
  margin: '0',
  lineHeight: '1.5',
} as React.CSSProperties

const linkStyle = {
  textDecoration: 'underline',
} as React.CSSProperties

const cardStyle = {
  padding: '16px',
  borderRadius: '8px',
  width: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
} as React.CSSProperties

const stackbarStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
} as React.CSSProperties

const mainStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  maxWidth: '496px',
  width: '100%',
  gap: '32px',
} as React.CSSProperties

const buttonStyle = {
  padding: '12px 24px',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: '600',
  fontFamily: 'var(--font-lexend)',
  cursor: 'pointer',
  border: 'none',
  width: '100%',
} as React.CSSProperties

function isSafeRedirectUri(uri: string): boolean {
  try {
    const parsed = new URL(uri)
    return parsed.protocol === 'https:' || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
  } catch {
    return false
  }
}

export default function OAuthConsent() {
  let view = null
  const [session, setSession] = useState<Session | null>(null)
  const [authCode, setAuthCode] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [redirectUri, setRedirectUri] = useState<string | null>(null)
  const [oauthState, setOauthState] = useState<string | null>(null)
  const [scope, setScope] = useState<string | null>(null)
  const [theme, setTheme] = useState<'default' | 'dark'>('default')
  const [mounted, setMounted] = useState(false)

  const useFigmaOAuthInterceptor = () => {
    useEffect(() => {
      const originalSignInWithOAuth = supabase.auth.signInWithOAuth

      supabase.auth.signInWithOAuth = async (credentials) => {
        const redirectTo = `${window.location.origin}/oauth/consent`
        if (credentials.provider === 'figma') {
          return originalSignInWithOAuth.call(supabase.auth, {
            ...credentials,
            options: {
              ...credentials.options,
              redirectTo,
              scopes: 'current_user:read',
              queryParams: {
                ...credentials.options?.queryParams,
                scope: 'current_user:read',
              },
            },
          })
        }
        return originalSignInWithOAuth.call(supabase.auth, {
          ...credentials,
          options: { ...credentials.options, redirectTo },
        })
      }

      return () => {
        supabase.auth.signInWithOAuth = originalSignInWithOAuth
      }
    }, [])
  }

  useFigmaOAuthInterceptor()

  useEffect(() => {
    setMounted(true)

    const urlParams = new URLSearchParams(window.location.search)
    const themeVal = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default'

    // Persist OAuth params across the Supabase social-provider redirect
    const authCodeVal = urlParams.get('auth_code') ?? localStorage.getItem('oauth_auth_code')
    const clientIdVal = urlParams.get('client_id') ?? localStorage.getItem('oauth_client_id')
    const redirectUriVal = urlParams.get('redirect_uri') ?? localStorage.getItem('oauth_redirect_uri')
    const stateVal = urlParams.get('state') ?? localStorage.getItem('oauth_state')
    const scopeVal = urlParams.get('scope') ?? localStorage.getItem('oauth_scope')

    if (authCodeVal) localStorage.setItem('oauth_auth_code', authCodeVal)
    if (clientIdVal) localStorage.setItem('oauth_client_id', clientIdVal)
    if (redirectUriVal) localStorage.setItem('oauth_redirect_uri', redirectUriVal)
    if (stateVal) localStorage.setItem('oauth_state', stateVal)
    if (scopeVal) localStorage.setItem('oauth_scope', scopeVal)

    setAuthCode(authCodeVal)
    setClientId(clientIdVal)
    setRedirectUri(redirectUriVal)
    setOauthState(stateVal)
    setScope(scopeVal)
    setTheme(themeVal)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleApprove = () => {
    if (!redirectUri || !authCode || !isSafeRedirectUri(redirectUri)) return

    localStorage.removeItem('oauth_auth_code')
    localStorage.removeItem('oauth_client_id')
    localStorage.removeItem('oauth_redirect_uri')
    localStorage.removeItem('oauth_state')
    localStorage.removeItem('oauth_scope')

    const target = new URL(redirectUri)
    target.searchParams.set('code', authCode)
    if (oauthState) target.searchParams.set('state', oauthState)

    window.location.href = target.toString()
  }

  const handleDeny = () => {
    if (!redirectUri || !isSafeRedirectUri(redirectUri)) return

    localStorage.removeItem('oauth_auth_code')
    localStorage.removeItem('oauth_client_id')
    localStorage.removeItem('oauth_redirect_uri')
    localStorage.removeItem('oauth_state')
    localStorage.removeItem('oauth_scope')

    const target = new URL(redirectUri)
    target.searchParams.set('error', 'access_denied')
    target.searchParams.set('error_description', 'The user denied access')
    if (oauthState) target.searchParams.set('state', oauthState)

    window.location.href = target.toString()
  }

  if (!mounted) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.color.UICP['1'].value,
          padding: '16px',
          boxSizing: 'border-box',
        }}
      />
    )
  }

  if (!session) {
    view = (
      <div style={mainStyle}>
        <div style={stackbarStyle}>
          <div style={stackbarStyle}>
            <h1
              style={{
                ...titleStyle,
                color:
                  theme === 'default'
                    ? colors.color.UICP['6'].value
                    : colors.color.UICP['source'].value,
              }}
            >
              Sign in to continue
            </h1>
            <h2
              style={{
                ...subtitleStyle,
                color:
                  theme === 'default'
                    ? colors.color.UICP['6'].value
                    : colors.color.UICP['source'].value,
              }}
            >
              {clientId
                ? `${clientId} is requesting access to UI Color Palette`
                : 'An application is requesting access to UI Color Palette'}
            </h2>
          </div>
        </div>
        <div
          style={{
            ...cardStyle,
            backgroundColor:
              theme === 'default'
                ? colors.color.UICP['2'].value
                : colors.color.UICP['5'].value,
            border: `2px solid ${
              theme === 'default'
                ? colors.color.UICP['3'].value
                : colors.color.UICP['4'].value
            }`,
          }}
        >
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: UicpTheme,
            }}
            localization={{
              variables: {
                sign_in: {
                  social_provider_text: 'Continue with {{provider}}',
                },
              },
            }}
            theme={theme}
            providers={['figma', 'google', 'github']}
            providerScopes={{
              figma: 'current_user:read',
            }}
            magicLink={true}
            view="magic_link"
            showLinks={false}
          />
        </div>
        <p
          style={{
            ...paragraphStyle,
            color:
              theme === 'default'
                ? colors.color.UICP['6'].value
                : colors.color.UICP['source'].value,
          }}
        >
          By continuing, you agree with our{' '}
          <a
            href="https://uicp.ylb.lt/terms"
            style={{
              ...linkStyle,
              color:
                theme === 'default'
                  ? colors.color.UICP['5'].value
                  : colors.color.UICP['4'].value,
            }}
          >
            Terms and Conditions
          </a>{' '}
          and our{' '}
          <a
            href="https://uicp.ylb.lt/privacy"
            style={{
              ...linkStyle,
              color:
                theme === 'default'
                  ? colors.color.UICP['5'].value
                  : colors.color.UICP['4'].value,
            }}
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
    )
  } else {
    view = (
      <div style={mainStyle}>
        <div style={stackbarStyle}>
          <h1
            style={{
              ...titleStyle,
              color:
                theme === 'default'
                  ? colors.color.UICP['6'].value
                  : colors.color.UICP['source'].value,
            }}
          >
            Authorize access
          </h1>
          <h2
            style={{
              ...subtitleStyle,
              color:
                theme === 'default'
                  ? colors.color.UICP['6'].value
                  : colors.color.UICP['source'].value,
            }}
          >
            {clientId
              ? `${clientId} is requesting access to your UI Color Palette account`
              : 'An application is requesting access to your UI Color Palette account'}
          </h2>
        </div>

        {scope && (
          <div
            style={{
              ...cardStyle,
              backgroundColor:
                theme === 'default'
                  ? colors.color.UICP['2'].value
                  : colors.color.UICP['5'].value,
              border: `2px solid ${
                theme === 'default'
                  ? colors.color.UICP['3'].value
                  : colors.color.UICP['4'].value
              }`,
            }}
          >
            <p
              style={{
                ...subtitleStyle,
                color:
                  theme === 'default'
                    ? colors.color.UICP['6'].value
                    : colors.color.UICP['source'].value,
              }}
            >
              Requested permissions
            </p>
            {scope.split(' ').map((s) => (
              <p
                key={s}
                style={{
                  ...paragraphStyle,
                  color:
                    theme === 'default'
                      ? colors.color.UICP['5'].value
                      : colors.color.UICP['4'].value,
                }}
              >
                · {s}
              </p>
            ))}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '100%',
          }}
        >
          <button
            onClick={handleApprove}
            style={{
              ...buttonStyle,
              backgroundColor: colors.color.UICP['6'].value,
              color: colors.color.UICP['1'].value,
            }}
          >
            Authorize
          </button>
          <button
            onClick={handleDeny}
            style={{
              ...buttonStyle,
              backgroundColor: 'transparent',
              color:
                theme === 'default'
                  ? colors.color.UICP['5'].value
                  : colors.color.UICP['4'].value,
              border: `2px solid ${
                theme === 'default'
                  ? colors.color.UICP['3'].value
                  : colors.color.UICP['4'].value
              }`,
            }}
          >
            Deny
          </button>
        </div>

        <p
          style={{
            ...paragraphStyle,
            color:
              theme === 'default'
                ? colors.color.UICP['5'].value
                : colors.color.UICP['4'].value,
          }}
        >
          Signed in as {session.user.email ?? session.user.id}.{' '}
          <a
            href="?action=sign_out"
            style={{
              ...linkStyle,
              color:
                theme === 'default'
                  ? colors.color.UICP['5'].value
                  : colors.color.UICP['4'].value,
            }}
          >
            Use a different account
          </a>
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor:
          theme === 'default'
            ? colors.color.UICP['1'].value
            : colors.color.UICP['6'].value,
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      {view}
    </div>
  )
}
