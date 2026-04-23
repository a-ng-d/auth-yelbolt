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

export default function OAuthConsent() {
  let view = null
  const [session, setSession] = useState<Session | null>(null)
  const [authorizationId, setAuthorizationId] = useState<string | null>(null)
  const [authDetails, setAuthDetails] = useState<{
    client: { name: string }
    scope: string
  } | null>(null)
  const [theme, setTheme] = useState<'default' | 'dark'>('default')
  const [mounted, setMounted] = useState(false)

  // Ensure social-provider redirects land back on /oauth/consent
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

  // Persist authorization_id across the social-provider redirect
  useEffect(() => {
    setMounted(true)
    const urlParams = new URLSearchParams(window.location.search)
    const themeVal = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'default'
    const authIdVal =
      urlParams.get('authorization_id') ??
      localStorage.getItem('oauth_authorization_id')

    if (authIdVal) localStorage.setItem('oauth_authorization_id', authIdVal)

    setAuthorizationId(authIdVal)
    setTheme(themeVal)
  }, [])

  // Track Supabase session
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

  // Fetch authorization details once we have both session and authorizationId
  useEffect(() => {
    if (!session || !authorizationId) return

    supabase.auth.oauth
      .getAuthorizationDetails(authorizationId)
      .then(({ data, error }) => {
        if (!error && data)
          setAuthDetails(data as { client: { name: string }; scope: string })
      })
      .catch(() => undefined)
  }, [session, authorizationId])

  const handleApprove = async () => {
    if (!authorizationId) return

    const { data, error } = await supabase.auth.oauth.approveAuthorization(
      authorizationId,
      { skipBrowserRedirect: true }
    )
    if (error || !data?.redirect_url) return

    localStorage.removeItem('oauth_authorization_id')
    window.location.href = data.redirect_url
  }

  const handleDeny = async () => {
    if (!authorizationId) return

    const { data, error } = await supabase.auth.oauth.denyAuthorization(
      authorizationId,
      { skipBrowserRedirect: true }
    )
    if (error || !data?.redirect_url) return

    localStorage.removeItem('oauth_authorization_id')
    window.location.href = data.redirect_url
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setAuthDetails(null)
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
              An application is requesting access to UI Color Palette
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
            {authDetails?.client?.name
              ? `${authDetails.client.name} is requesting access to your UI Color Palette account`
              : 'An application is requesting access to your UI Color Palette account'}
          </h2>
        </div>

        {authDetails?.scope && authDetails.scope.trim() && (
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
            {authDetails.scope.split(' ').map((s) => (
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
            disabled={!authorizationId}
            style={{
              ...buttonStyle,
              backgroundColor: colors.color.UICP['6'].value,
              color: colors.color.UICP['1'].value,
              opacity: authorizationId ? 1 : 0.5,
              cursor: authorizationId ? 'pointer' : 'not-allowed',
            }}
          >
            Authorize
          </button>
          <button
            onClick={handleDeny}
            disabled={!authorizationId}
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
              opacity: authorizationId ? 1 : 0.5,
              cursor: authorizationId ? 'pointer' : 'not-allowed',
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
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handleSignOut()
            }}
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
