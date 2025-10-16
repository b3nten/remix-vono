import type {VonoPlugin} from "@vonojs/framework";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as process from "node:process";
import {parse} from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import {remixRuntimeDirectory} from "./runtimes";
import consola from "consola";

interface RemixConfig {
	clientMain?: string
	serverMain?: string
	clientDirective?: string
}

export default function remix(config: RemixConfig = {}): VonoPlugin {
	return async ({vitePlugins, virtualFile, runtimes, clientMain, serverMain}) => {

		clientMain(config.clientMain ?? "src/clientMain")
		serverMain(config.serverMain ?? "src/serverMain")

		runtimes(r => {
			r.client.dev = path.join(remixRuntimeDirectory, "dev/client")
			r.client.prod = path.join(remixRuntimeDirectory, "prod/client")
			r.server.dev = path.join(remixRuntimeDirectory, "dev/server")
			r.server.prod = path.join(remixRuntimeDirectory, "prod/server")
		})

		const islands: Record<string, string> = {}

		vitePlugins({
			name: "remix-vite-vono",
			// todo: hot reload without full reload?
			handleHotUpdate(ctx) {
				const resolved =
					ctx.file.split(process.cwd() + "/")[1]
				if(!resolved.startsWith("src")) {
					return
				}
				ctx.server.ws.send({
					type: 'full-reload',
					path: '*',
					triggeredBy:  ctx.file
				})
			},
			configureServer(s) {
				s.hot.on("frame-reload-error", (e) => {
					consola.error("Error reloading root frame in browser.", e.message)
				})
			},
			async configResolved(cfg) {
				if (cfg.mode === "production") {
					const files = await fs.readdir(path.join(process.cwd(), "src/"), {
						recursive: true, withFileTypes: true
					})

					for (const file of files) {
						if (!file.isFile()) continue
						const code = await fs.readFile(path.join(file.parentPath, file.name), "utf-8")
						const absPath = path.join(file.parentPath, file.name)
						const relPath = path.relative(process.cwd(), absPath)
						if (isClientFile(code, config.clientDirective)) {
							islands["/" + relPath] = absPath
						}
					}

					virtualFile("remix-islands", `
						export default {
							${Object.keys(islands).map(key => `"${key}": () => import("${islands[key]}")`).join(",\n")}
						}`)
				}
			},
			// todo: only assign to functions that either return jsx or return a function that returns jsx
			transform(code, id) {
				if (isClientFile(code, config.clientDirective)) {
					const resolvedId = id.split(path.join(process.cwd()))[1]
					const ast = parse(code, {sourceType: "module", plugins: ['typescript', 'jsx']});
					const exports = new Map<string, any>

					traverse(ast, {
						ExportNamedDeclaration(path) {
							if (path.node.declaration) {
								if (path.node.declaration.type === 'VariableDeclaration') {
									path.node.declaration.declarations.forEach((decl: any) => {
										if (decl.id.type === 'Identifier') {
											exports.set(decl.id.name, decl);
										}
									});
								} else if (
									path.node.declaration.type === 'FunctionDeclaration'
									|| path.node.declaration.type === 'ClassDeclaration'
								) {
									if (path.node.declaration.id) {
										exports.set(path.node.declaration.id.name, path.node.declaration);
									}
								}
							}
							else if (path.node.specifiers) {
								path.node.specifiers.forEach((spec: any) => {
									exports.set(spec.exported.name, spec);
								});
							}
						},
						ExportDefaultDeclaration(path) {
							exports.set('default', path.node.declaration);
						}
					})

					// Assign properties to each export
					traverse(ast, {
						ExportNamedDeclaration(path) {
							if (path.node.declaration) {
								const assignProperties = (_node: any, exportName: string) => {
									const properties = [t.assignmentExpression('=', t.memberExpression(t.identifier(exportName), t.identifier('$hydrated')), t.booleanLiteral(true)), t.assignmentExpression('=', t.memberExpression(t.identifier(exportName), t.identifier('$moduleUrl')), t.stringLiteral(resolvedId)), t.assignmentExpression('=', t.memberExpression(t.identifier(exportName), t.identifier('$exportName')), t.stringLiteral(exportName))];

									properties.forEach(prop => {
										path.insertAfter(t.expressionStatement(prop));
									});
								};

								if (path.node.declaration.type === 'VariableDeclaration') {
									path.node.declaration.declarations.forEach((decl: any) => {
										if (decl.id.type === 'Identifier') {
											assignProperties(decl, decl.id.name);
										}
									});
								} else if (path.node.declaration.type === 'FunctionDeclaration' || path.node.declaration.type === 'ClassDeclaration') {
									if (path.node.declaration.id) {
										assignProperties(path.node.declaration, path.node.declaration.id.name);
									}
								}
							}
						},
						ExportDefaultDeclaration(path) {
							// For default exports, we need to handle them differently
							// If it's a named function/class, assign to it before export
							if (
								path.node.declaration.type === 'FunctionDeclaration'
								|| path.node.declaration.type === 'ClassDeclaration'
							) {
								if (path.node.declaration.id) {
									const name = path.node.declaration.id.name;
									const properties = [t.assignmentExpression('=', t.memberExpression(t.identifier(name), t.identifier('$hydrated')), t.booleanLiteral(true)), t.assignmentExpression('=', t.memberExpression(t.identifier(name), t.identifier('$moduleUrl')), t.stringLiteral('todo')), t.assignmentExpression('=', t.memberExpression(t.identifier(name), t.identifier('$exportName')), t.stringLiteral('default'))];
									properties.forEach(prop => {
										path.insertAfter(t.expressionStatement(prop));
									});
								}
							}
						}
					})

					const output = generate(ast, {}, code);

					return {
						code: output.code, map: output.map
					};
				}
			}
		})
	}
}

function isClientFile(code: string, identifier: string = "use client"): boolean {
	const pattern = new RegExp(
		`^\\s*(['"\`])${identifier}\\1`
	);
	return pattern.test(code);
}
