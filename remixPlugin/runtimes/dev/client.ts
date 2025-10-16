import "@vonojs/framework/clientEntry"

import {createFrame} from '@remix-run/dom'

async function resolveFrame(frameUrl: string) {
	let res = await fetch(frameUrl, {
		headers: {
			accept: 'text/html',
			'x-remix-fragment': 'true',
		},
	})
	if (res.ok) {
		const text = await res.text()
		return text
	}
	throw new Error(`Failed to fetch ${frameUrl}`)
}

const root = createFrame(document.body, {
	async loadModule(moduleUrl, name) {
		let mod = await import(/* @vite-ignore */ moduleUrl + '?t=' + Date.now())
		if (!mod) {
			throw new Error(`Unknown module: ${moduleUrl}#${name}`)
		}
		let Component = mod[name]
		if (!Component) {
			throw new Error(`Unknown component: ${moduleUrl}#${name}`)
		}
		return Component
	},
	resolveFrame
})

if (import.meta.hot) {
	import.meta.hot.on('vite:beforeFullReload', (payload) => {
		requestAnimationFrame(() => {
			resolveFrame(location.href).then((html) => {
				root.render(html)
					.then(() => console.debug('[vono] root frame reloaded.'))
					.catch((error) => {
						import.meta.hot!.send("frame-reload-error", { message: error.message })
						location.reload()
					})
			})
		})

		console.debug('[vono] reloading root frame...')
		payload.path = 'prevent-full-reload.html'
	})
}

document.head.querySelector("[data-occluder]")?.remove()
