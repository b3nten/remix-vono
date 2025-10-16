import { createFrame } from '@remix-run/dom'
import islands from "virtual:vono/remix-islands"
import "@vonojs/framework/clientEntry"

const resolveFrame = async (frameUrl: string) => {
	let res = await fetch(frameUrl)
	if (res.ok) {
		return res.text()
	}
	throw new Error(`Failed to fetch ${frameUrl}`)
}

createFrame(document.body, {
	async loadModule(moduleUrl, name) {
		const importer = islands[moduleUrl]
		if(!importer) throw new Error(
			`Unknown module: ${moduleUrl}#${name}`
		)
		const module = await importer()
		return module[name]
	},
	resolveFrame,
})