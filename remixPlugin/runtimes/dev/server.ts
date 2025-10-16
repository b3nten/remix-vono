import mod from "@vonojs/framework/serverEntry"

export default {
	async fetch(req: Request) {
		if (req.headers.get("x-remix-fragment")) {
			const response = await mod.fetch(req)
			if (
				response &&
				response.status !== 404 &&
				(response.headers.get('Content-Type') ?? "").startsWith('text/html')
			) {
				const originalHtml = await response.text()
				const html = originalHtml.match(/<body>(.*?)<\/body>/s)?.[1] || ''
				return cloneResponse(response, {
					body: html,
					headers: {},
				})
			}
			return response
		}

		const response = await mod.fetch(req)

		if (
			response &&
			response.status !== 404 &&
			(response.headers.get('Content-Type') ?? "").startsWith('text/html')
		) {
			const originalHtml = await response.text()
			const html = originalHtml.replace("<head>", "<head><style data-occluder>body { opacity: 0 }</style>")
			return cloneResponse(response, {
				body: html,
				headers: {},
			})
		}

		return response;
	}
}

async function cloneResponse(response: Response, args: {
	body: string,
	headers: Record<string, string>,
}) {
	const headers = new Headers(response.headers)
	for (const [key, value] of Object.entries(args.headers)) {
		headers.set(key, value)
	}
	return new Response(args.body, {
		status: response.status,
		statusText: response.statusText,
		headers: headers,
	})
}