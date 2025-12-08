'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient, Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { colors, UicpTheme } from './Themes'

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

export default function App() {
  let view = null
  const [session, setSession] = useState<Session | null>(null)
  const [passkey, setPasskey] = useState<string | null>(null)
  const [action, setAction] = useState<string | null>(null)
  const [theme, setTheme] = useState<'default' | 'dark'>('default')
  const [mounted, setMounted] = useState(false)

  const useFigmaOAuthInterceptor = () => {
    useEffect(() => {
      const originalSignInWithOAuth = supabase.auth.signInWithOAuth

      supabase.auth.signInWithOAuth = async (credentials) => {
        if (credentials.provider === 'figma') {
          const enhancedCredentials = {
            ...credentials,
            options: {
              ...credentials.options,
              scopes: 'current_user:read',
              queryParams: {
                ...credentials.options?.queryParams,
                scope: 'current_user:read',
              },
            },
          }
          return originalSignInWithOAuth.call(
            supabase.auth,
            enhancedCredentials
          )
        }
        return originalSignInWithOAuth.call(supabase.auth, credentials)
      }

      return () => {
        supabase.auth.signInWithOAuth = originalSignInWithOAuth
      }
    }, [])
  }

  useFigmaOAuthInterceptor()

  useEffect(() => {
    setMounted(true)

    const getUrlParams = () => {
      if (typeof window !== 'undefined') {
        return new URLSearchParams(window.location.search)
      }
      return new URLSearchParams()
    }

    const urlParams = getUrlParams()
    const passkey = urlParams.get('passkey') ?? null
    const action = urlParams.get('action') ?? null
    const theme =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'default'

    if (passkey !== null && typeof window !== 'undefined') {
      localStorage.setItem('passkey', passkey)
    }

    setPasskey(passkey)
    setAction(action)
    setTheme(theme)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      //console.log(session)
      const passkey = localStorage.getItem('passkey') || null

      if (session && action === 'sign_out') {
        const { error } = await supabase.auth.signOut({
          scope: 'global',
        })

        if (!error) {
          localStorage.clear()
          sessionStorage.clear()

          const cookies = document.cookie.split(';')
          for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i]
            const eqPos = cookie.indexOf('=')
            const name =
              eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
            document.cookie =
              name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
            document.cookie =
              name +
              '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' +
              window.location.hostname
          }

          setSession(null)

          window.location.href = window.location.pathname
          return
        }
      }

      if (session && passkey !== null) {
        fetch(
          process.env.NODE_ENV === 'development'
            ? `http://localhost:8787/tokens?passkey=${passkey}`
            : `${process.env.NEXT_PUBLIC_WORKER_URL}/tokens?passkey=${passkey}` ||
                '',
          {
            method: 'POST',
            headers: {
              tokens: JSON.stringify(session),
            },
          }
        )
          .then((res) => console.log(res))
          .catch((error) => console.log(error))
      }

      return setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [action, passkey])

  if (!mounted) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.color.UICP['6'].value,
          padding: '16px',
          boxSizing: 'border-box',
        }}
      >
        <p
          style={{
            ...paragraphStyle,
            color:
              theme === 'default'
                ? colors.color.UICP['6'].value
                : colors.color.UICP['source'].value,
          }}
        >
          Loading...
        </p>
      </div>
    )
  }

  if (!session) {
    view = (
      <div
        style={{
          ...mainStyle,
        }}
      >
        <div
          style={{
            ...stackbarStyle,
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 128 128"
            xmlns="http://www.w3.org/2000/svg"
            fill={
              theme === 'default'
                ? colors.color.UICP['6'].value
                : colors.color.UICP['source'].value
            }
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M82 8.00293C93.213 8.02151 99.2141 8.23091 103.896 10.6162C108.411 12.9172 112.083 16.5886 114.384 21.1045C117 26.2384 117 32.9592 117 46.4004V81.5996C117 95.0408 117 101.762 114.384 106.896C112.083 111.411 108.411 115.083 103.896 117.384C99.2141 119.769 93.213 119.978 82 119.996V120H50.4004L50 119.999V120H46V119.995H45.6641C35.6736 119.961 30.0103 119.693 25.5908 117.622L25.1045 117.384C20.7297 115.155 17.1475 111.64 14.8359 107.316L14.6162 106.896C12.0004 101.762 12 95.0408 12 81.5996V46C12.0002 33.2414 12.0245 26.6129 14.3779 21.5908L14.6162 21.1045C16.8453 16.7297 20.3604 13.1475 24.6836 10.8359L25.1045 10.6162C29.5966 8.32741 35.3032 8.04065 45.6641 8.00488L46 8.00391V8H82V8.00293ZM50 111.999C50.1326 111.999 50.2661 112 50.4004 112H78V92H50V111.999ZM88 82V82.4004C88 85.7603 87.9996 87.4402 87.3457 88.7236C86.7705 89.8526 85.8526 90.7705 84.7236 91.3457C84.0111 91.7087 83.1765 91.8696 82 91.9414V111.995C87.0496 111.986 90.741 111.942 93.7119 111.699C97.219 111.413 99.0125 110.893 100.264 110.256C103.274 108.722 105.722 106.274 107.256 103.264C107.893 102.013 108.413 100.219 108.699 96.7119C108.988 93.1818 108.999 88.6345 108.999 82H88ZM20.001 82C20.0013 88.6345 20.0124 93.1818 20.3008 96.7119C20.5873 100.219 21.1066 102.013 21.7441 103.264C23.2781 106.274 25.7257 108.722 28.7363 110.256C29.9875 110.893 31.781 111.413 35.2881 111.699C38.0593 111.926 41.4574 111.98 46 111.994V91.9414C44.8235 91.8696 43.9889 91.7087 43.2764 91.3457C42.1474 90.7705 41.2295 89.8526 40.6543 88.7236C40.0004 87.4402 40 85.7603 40 82.4004V82H20.001ZM20 78H40V50H20V78ZM88 78H109V50H88V78ZM46 16.0049C41.4574 16.0187 38.0593 16.0744 35.2881 16.3008C31.781 16.5873 29.9875 17.1066 28.7363 17.7441C25.7257 19.2781 23.2781 21.7257 21.7441 24.7363C21.1066 25.9875 20.5873 27.781 20.3008 31.2881C20.0124 34.8182 20.0013 39.3655 20.001 46H40V45.5996C40 42.2397 40.0004 40.5598 40.6543 39.2764C41.2295 38.1474 42.1474 37.2295 43.2764 36.6543C43.9889 36.2913 44.8234 36.1295 46 36.0576V16.0049ZM82 36.0576C83.1766 36.1295 84.0111 36.2913 84.7236 36.6543C85.8526 37.2295 86.7705 38.1474 87.3457 39.2764C87.9996 40.5598 88 42.2397 88 45.5996V46H108.999C108.999 39.3655 108.988 34.8182 108.699 31.2881C108.413 27.781 107.893 25.9875 107.256 24.7363C105.722 21.7257 103.274 19.2781 100.264 17.7441C99.0125 17.1066 97.219 16.5873 93.7119 16.3008C90.741 16.058 87.0496 16.0129 82 16.0039V36.0576ZM50 36H78V16H50V36Z"
            />
          </svg>
          <div
            style={{
              ...stackbarStyle,
            }}
          >
            <h1
              style={{
                ...titleStyle,
                color:
                  theme === 'default'
                    ? colors.color.UICP['6'].value
                    : colors.color.UICP['source'].value,
              }}
            >
              Start exploring palettes!
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
              Sign in to UI Color Palette
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
      <div
        style={{
          ...mainStyle,
        }}
      >
        <div
          style={{
            ...stackbarStyle,
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 128 128"
            xmlns="http://www.w3.org/2000/svg"
            fill={
              theme === 'default'
                ? colors.color.UICP['6'].value
                : colors.color.UICP['source'].value
            }
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M82 8.00293C93.213 8.02151 99.2141 8.23091 103.896 10.6162C108.411 12.9172 112.083 16.5886 114.384 21.1045C117 26.2384 117 32.9592 117 46.4004V81.5996C117 95.0408 117 101.762 114.384 106.896C112.083 111.411 108.411 115.083 103.896 117.384C99.2141 119.769 93.213 119.978 82 119.996V120H50.4004L50 119.999V120H46V119.995H45.6641C35.6736 119.961 30.0103 119.693 25.5908 117.622L25.1045 117.384C20.7297 115.155 17.1475 111.64 14.8359 107.316L14.6162 106.896C12.0004 101.762 12 95.0408 12 81.5996V46C12.0002 33.2414 12.0245 26.6129 14.3779 21.5908L14.6162 21.1045C16.8453 16.7297 20.3604 13.1475 24.6836 10.8359L25.1045 10.6162C29.5966 8.32741 35.3032 8.04065 45.6641 8.00488L46 8.00391V8H82V8.00293ZM50 111.999C50.1326 111.999 50.2661 112 50.4004 112H78V92H50V111.999ZM88 82V82.4004C88 85.7603 87.9996 87.4402 87.3457 88.7236C86.7705 89.8526 85.8526 90.7705 84.7236 91.3457C84.0111 91.7087 83.1765 91.8696 82 91.9414V111.995C87.0496 111.986 90.741 111.942 93.7119 111.699C97.219 111.413 99.0125 110.893 100.264 110.256C103.274 108.722 105.722 106.274 107.256 103.264C107.893 102.013 108.413 100.219 108.699 96.7119C108.988 93.1818 108.999 88.6345 108.999 82H88ZM20.001 82C20.0013 88.6345 20.0124 93.1818 20.3008 96.7119C20.5873 100.219 21.1066 102.013 21.7441 103.264C23.2781 106.274 25.7257 108.722 28.7363 110.256C29.9875 110.893 31.781 111.413 35.2881 111.699C38.0593 111.926 41.4574 111.98 46 111.994V91.9414C44.8235 91.8696 43.9889 91.7087 43.2764 91.3457C42.1474 90.7705 41.2295 89.8526 40.6543 88.7236C40.0004 87.4402 40 85.7603 40 82.4004V82H20.001ZM20 78H40V50H20V78ZM88 78H109V50H88V78ZM46 16.0049C41.4574 16.0187 38.0593 16.0744 35.2881 16.3008C31.781 16.5873 29.9875 17.1066 28.7363 17.7441C25.7257 19.2781 23.2781 21.7257 21.7441 24.7363C21.1066 25.9875 20.5873 27.781 20.3008 31.2881C20.0124 34.8182 20.0013 39.3655 20.001 46H40V45.5996C40 42.2397 40.0004 40.5598 40.6543 39.2764C41.2295 38.1474 42.1474 37.2295 43.2764 36.6543C43.9889 36.2913 44.8234 36.1295 46 36.0576V16.0049ZM82 36.0576C83.1766 36.1295 84.0111 36.2913 84.7236 36.6543C85.8526 37.2295 86.7705 38.1474 87.3457 39.2764C87.9996 40.5598 88 42.2397 88 45.5996V46H108.999C108.999 39.3655 108.988 34.8182 108.699 31.2881C108.413 27.781 107.893 25.9875 107.256 24.7363C105.722 21.7257 103.274 19.2781 100.264 17.7441C99.0125 17.1066 97.219 16.5873 93.7119 16.3008C90.741 16.058 87.0496 16.0129 82 16.0039V36.0576ZM50 36H78V16H50V36Z"
            />
          </svg>
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
          <h1
            style={{
              ...titleStyle,
              color:
                theme === 'default'
                  ? colors.color.UICP['6'].value
                  : colors.color.UICP['source'].value,
            }}
          >
            You are authenticated on
            <br />
            UI Color Palette!
          </h1>
        </div>
        <h2
          style={{
            ...subtitleStyle,
            color:
              theme === 'default'
                ? colors.color.UICP['6'].value
                : colors.color.UICP['source'].value,
          }}
        >
          You can close the tab or{' '}
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
            sign out
          </a>
        </h2>
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
