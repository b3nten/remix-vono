import type { InferRouteHandler } from '@remix-run/fetch-router'

import { routes } from '~/shared/routeDefs.ts'
import { useStorage } from "nitro/runtime";

export let uploadsHandler: InferRouteHandler<typeof routes.uploads> = async ({ params }) => {
	const dataStorage = useStorage()

  let file = await dataStorage.get(params.key) as {
		name: string
		type: string
		size: number
		data: string
	}

  if (!file) {
    return new Response('File not found', { status: 404 })
  }

	const binaryString = atob(file.data)
	const bytes = new Uint8Array(binaryString.length)
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i)
	}

	const resolvedFile = new File([bytes], file.name, { type: file.type })

  return new Response(resolvedFile, {
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'Content-Length': file.size.toString(),
      'Cache-Control': 'public, max-age=31536000',
    },
  })
}
