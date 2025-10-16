import type { Remix } from '@remix-run/dom'

import { routes } from '~/shared/routeDefs.ts'
import { getCurrentUser } from '../utils/context.ts'
import type { User } from '../models/users.ts'
import {clientEntry, css} from "@vonojs/framework/server";

export function Document({
  title = 'Bookstore',
  children,
}: {
  title?: string
  children?: Remix.RemixNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <script type="module" async src={clientEntry} />
				{css.map((href) => <link rel="stylesheet" href={href} />)}
      </head>
      <body>{children}</body>
    </html>
  )
}

export function Layout({ children }: { children?: Remix.RemixNode }) {
  let user: User | null = null
  try {
    user = getCurrentUser()
  } catch {
    // user not authenticated
  }

  return (
    <Document>
      <header>
        <div class="container">
          <h1>
            <a href={routes.home.href()}>📚 Bookstore</a>
          </h1>
          <nav>
            <a href={routes.home.href()}>Home</a>
            <a href={routes.books.index.href()}>Books</a>
            <a href={routes.about.href()}>About</a>
            <a href={routes.contact.index.href()}>Contact</a>
            <a href={routes.cart.index.href()}>Cart</a>
            {user ? (
              <>
                <a href={routes.account.index.href()}>Account</a>
                {user.role === 'admin' ? <a href={routes.admin.index.href()}>Admin</a> : null}
                <form
                  method="POST"
                  action={routes.auth.logout.href()}
                  style={{ display: 'inline' }}
                >
                  <button
                    type="submit"
                    className="btn btn-secondary"
                    style={{ marginLeft: '1rem' }}
                  >
                    Logout
                  </button>
                </form>
              </>
            ) : (
              <>
                <a href={routes.auth.login.index.href()}>Login</a>
                <a href={routes.auth.register.index.href()}>Register</a>
              </>
            )}
          </nav>
        </div>
      </header>
      <main>
        <div className="container">{children}</div>
      </main>
      <footer>
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Bookstore Demo. Built with Remix.</p>
        </div>
      </footer>
    </Document>
  )
}
