import { load } from 'cheerio'

type Schema = { [key: string]: string | SchemaList | SchemaFunction }
type SchemaFunction = ($: any, context: any) => any
type SchemaList = any[]

export function parseText ($: any, selector: string, context?: any) {
  return $(selector, context).text().trim()
}

export function parse (schema: Schema = {}, $: any, context?: any) {
  const entries = Object.entries(schema)
  const result: { [key:string]: string } = entries.reduce((obj: any, [key, value]) => {
    let type: string = typeof value
    if (Array.isArray(value)) type = 'array'

    switch (type) {
      case 'string':
        obj[key] = parseText($, value as string, context)
        break

      case 'array':
        const [ listSchema, listContext ] = value as SchemaList
        if (!listSchema) {
          throw new Error('Selector is required')
        }
        if (typeof listSchema === 'string') {
          obj[key] = $(listSchema, context).map((_: any, el: any) => parseText($, el)).get()
        } else {
          if (!listContext) {
            throw new Error('ListSelector with SchemaSelector requires context')
          }
          const matches = $(listContext, context)
          obj[key] = matches.map((_: any, el: any) => {
            const result = parse(listSchema, $, el)
            return result
          }).get()
        }
        break

      case 'function':
        const cb = value as SchemaFunction
        obj[key] = cb($, context)
        break
    }
    return obj
  }, {})
  return result
}

export default function scrape (html: string | Buffer, schema: Schema) {
  if (!html) throw new Error('parse() requires argument html')
  if (!schema) throw new Error('parse() requires argument schema')
  try {
    const cheerioDocument = load(html)
    return parse(schema, cheerioDocument)
  } catch (error)  {
    console.error(error)
  }
}
