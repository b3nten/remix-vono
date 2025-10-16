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
				return new Response(html, {
					headers: {
						'Content-Type': 'text/html',
					},
					status: 200,
				})
			}
			return response
		}
		return mod.fetch(req)
	}
}