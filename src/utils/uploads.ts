import { useStorage } from "nitro/runtime";
import {type FileUpload} from "@remix-run/fetch-router";

export async function uploadHandler(file: FileUpload): Promise<string> {
	const ext = file.name.split('.').pop() || 'jpg'
  const key = `${file.fieldName}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

	const dataStorage = useStorage()
	const bytes = await file.bytes()

	// Convert bytes to base64
	const base64Data = btoa(String.fromCharCode(...new Uint8Array(bytes)))

	await dataStorage.setItem(key, {
		name: file.name,
		type: file.type,
		size: bytes.length,
		data: base64Data,
	})

  // Return public URL path
  return `/uploads/${key}`
}
