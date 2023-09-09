import scrape, { parse }  from '../src/index'
import * as cheerio from 'cheerio'

const html = `<!doctype html>
<head>
  <title>Site title</title>
</head>
<body>
  <main>
    <div class="item item-1">
      <h1>Title of item-1</h1>
      <p class="lead">Lead paragraph of item-1</p>
      <p>Second paragraph of item-1</p>
      <p>Third paragraph of item-1</p>
    </div>
    <div class="item item-2">
      <h1>Title of item-2</h1>
      <p class="lead">Lead paragraph of item-2</p>
      <p>Second paragraph of item-2</p>
      <p>Third paragraph of item-2</p>
    </div>
    <div class="item item-3">
      <h1>Title of item-3</h1>
      <p class="lead">Lead paragraph of item-3</p>
      <p>Second paragraph of item-3</p>
      <p>Third paragraph of item-3</p>
    </div>
  </main>
</body>`

const htmlCheerio = cheerio.load(html)

describe('scrape', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('throws without html', () => {
    // @ts-ignore
    expect(() => scrape(undefined, undefined)).toThrow()
  })

  it('throws with html without schema', () => {
    // @ts-ignore
    expect(() => scrape(html, undefined)).toThrow()
  })

  it('loads html with cheerio', () => {
    const load = jest.spyOn(cheerio, 'load')
    scrape(html, {})
    expect(load).toBeCalledWith(html)
  })
})

describe('parse', () => {
  let $: any
  $ = jest.spyOn(cheerio, 'load')
  $.mockImplementation((sel: any, ctx: any) => htmlCheerio(sel, ctx))
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('parses string selector', () => {
    const result = parse({ title: 'title' }, $)
    expect(result).toEqual({ title: 'Site title' })
  })

  it('throws array without selector', () => {
    expect(() => parse({ headings: [] }, $)).toThrow()
  })

  it('parses array string selector', () => {
    const headings = [
      'Title of item-1',
      'Title of item-2',
      'Title of item-3',
    ]
    const result = parse({ headings: ['h1'] }, $)
    expect(result).toEqual({ headings })
  })

  it('throws array schema selector without context', () => {
    expect(() => parse({ headings: [ { heading: 'h1' } ] }, $)).toThrow()
  })

  it('parses array schema selector with context', () => {
    const items = [
      { heading: 'Title of item-1', lead: 'Lead paragraph of item-1' },
      { heading: 'Title of item-2', lead: 'Lead paragraph of item-2' },
      { heading: 'Title of item-3', lead: 'Lead paragraph of item-3' },
    ]

    const listSchema = { heading: 'h1', lead: 'p.lead' }

    const resultAll = parse({ items: [ listSchema, '.item' ] }, $)
    expect(resultAll).toEqual({ items })

    const resultOne = parse({ items: [ listSchema, '.item-1' ] }, $)
    expect(resultOne).toEqual({ items: [ items[0] ] })
  })

  it('parses function selector', () => {
    const headings = [
      'Title of replaced-1',
      'Title of replaced-2',
      'Title of replaced-3',
    ]
    function fn (_$: any) {
      const tags = _$('h1')
      const replaced = tags.map((_: any, el: any) => {
        const text = _$(el).text().trim()
        return text.replace('item', 'replaced')
      }).get()
      return replaced
    }
    const result = parse({ headings: fn }, $)
    expect(result).toEqual({ headings })
  })
})
