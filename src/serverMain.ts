import { createRouter } from '@remix-run/fetch-router'
import { logger } from '@remix-run/fetch-router/logger-middleware'
import { routes } from '~/shared/routeDefs.ts'
import { storeContext } from './middleware/context.ts'
import { uploadHandler } from './utils/uploads.ts'
import adminHandlers from './routes/admin.tsx'
import accountHandlers from './routes/account.tsx'
import authHandlers from './routes/auth.tsx'
import booksHandlers from './routes/books.tsx'
import cartHandlers from './routes/cart.tsx'
import checkoutHandlers from './routes/checkout.tsx'
import fragmentsHandlers from './routes/fragments.tsx'
import * as marketingHandlers from './routes/marketing.tsx'
import { uploadsHandler } from './routes/uploads.tsx'

const app = createRouter({ uploadHandler })

app.use(storeContext)

if (import.meta.env.DEV) {
	app.use(logger());
}

app.get(routes.uploads, uploadsHandler)

app.map(routes.home, marketingHandlers.home)
app.map(routes.about, marketingHandlers.about)
app.map(routes.contact, marketingHandlers.contact)
app.map(routes.search, marketingHandlers.search)

app.map(routes.fragments, fragmentsHandlers)

app.map(routes.books, booksHandlers)
app.map(routes.auth, authHandlers)
app.map(routes.cart, cartHandlers)
app.map(routes.account, accountHandlers)
app.map(routes.checkout, checkoutHandlers)
app.map(routes.admin, adminHandlers)

export default app