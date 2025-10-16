import {Vono} from "@vonojs/framework";
import remix from "./remixPlugin";

// https://github.com/vonojs/framework
export default new Vono(({buildFor, BuildTarget, plugin, nitroConfig}) => {
	plugin(remix())

	buildFor(BuildTarget.Cloudflare, {
		cloudflare: {
			name: "vono-remix-cloudflare",
			deployConfig: true,
			nodeCompat: true
		}
	})

	nitroConfig({
		storage: {
			default: {
				driver: 'cloudflare-kv-binding',
			}
		},
		devStorage: {
			default: {
				driver: 'fs', base: './data/kv'
			}
		}
	})
})