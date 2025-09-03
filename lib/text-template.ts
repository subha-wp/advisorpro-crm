export function renderTemplate(body: string, vars: Record<string, string | number | null | undefined>) {
  return body.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => {
    const v = vars[key] as any
    return v === undefined || v === null ? "" : String(v)
  })
}
