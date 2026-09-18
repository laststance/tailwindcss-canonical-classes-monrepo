import assert from 'node:assert/strict'
import { test } from 'node:test'
import { format } from 'prettier'
import { parsers as htmlParsers } from 'prettier/plugins/html'
import * as canonicalPlugin from '../dist/index.js'

for (const lazy of [false, true]) {
  test(`runs canonicalization before ${lazy ? 'lazy asynchronous' : 'synchronous'} delegate hooks exactly once`, async () => {
    // Arrange
    const calls = []
    const delegate = {
      ...htmlParsers.html,
      preprocess(text, options) {
        assert.equal(this, delegate)
        assert.equal(options.parser, 'html')
        calls.push(['preprocess', text])
        const processed = text.replace('before', 'after')
        return lazy ? Promise.resolve(processed) : processed
      },
      parse(text, options) {
        assert.equal(this, delegate)
        assert.equal(options.originalText, text)
        calls.push(['parse', text])
        return htmlParsers.html.parse(text, options)
      },
      locStart(node) {
        assert.equal(this, delegate)
        return htmlParsers.html.locStart(node)
      },
      locEnd(node) {
        assert.equal(this, delegate)
        return htmlParsers.html.locEnd(node)
      },
    }
    const entry = lazy
      ? async () => {
          calls.push(['factory'])
          return delegate
        }
      : delegate

    // Act
    const output = await format('<!-- before --><div class="p-[16px]"></div>', {
      parser: 'html',
      plugins: [{ parsers: { html: entry } }, canonicalPlugin],
    })

    // Assert
    assert.equal(output, '<!-- after -->\n<div class="p-4"></div>\n')
    assert.deepEqual(calls, [
      ...(lazy ? [['factory']] : []),
      ['preprocess', '<!-- before --><div class="p-4"></div>'],
      ['parse', '<!-- after --><div class="p-4"></div>'],
    ])
  })
}

test('selects the last earlier parser and skips copied canonical wrappers', async () => {
  // Arrange
  const earlier = {
    parsers: {
      html: {
        ...htmlParsers.html,
        parse() {
          throw new Error('wrong precedence')
        },
      },
    },
  }
  const selected = {
    parsers: {
      html: {
        ...htmlParsers.html,
        preprocess: (text) => text.replace('before', 'selected'),
      },
    },
  }
  const copied = { parsers: { ...canonicalPlugin.parsers } }

  // Act
  const output = await format('<!-- before --><div class="p-[16px]"></div>', {
    parser: 'html',
    plugins: [earlier, selected, copied, canonicalPlugin],
  })

  // Assert
  assert.equal(output, '<!-- selected -->\n<div class="p-4"></div>\n')
})

test('uses parsers exported through a module default object', async () => {
  // Arrange
  const wrapped = {
    default: {
      parsers: {
        html: {
          ...htmlParsers.html,
          preprocess: (text) => text.replace('before', 'wrapped'),
        },
      },
    },
  }

  // Act
  const output = await format('<!-- before --><div class="p-[16px]"></div>', {
    parser: 'html',
    plugins: [wrapped, canonicalPlugin],
  })

  // Assert
  assert.equal(output, '<!-- wrapped -->\n<div class="p-4"></div>\n')
})

for (const lazy of [false, true]) {
  test(`skips ${lazy ? 'lazy' : 'ordinary'} delegates with an incompatible AST format`, async () => {
    // Arrange
    const incompatible = {
      ...htmlParsers.html,
      astFormat: 'incompatible-html',
      preprocess() {
        throw new Error('Incompatible preprocessing must not run')
      },
      parse() {
        throw new Error('Incompatible AST must not reach the HTML printer')
      },
    }
    const entry = lazy ? async () => incompatible : incompatible

    // Act
    const output = await format('<div class="p-[16px]"></div>', {
      parser: 'html',
      plugins: [{ parsers: { html: entry } }, canonicalPlugin],
    })

    // Assert
    assert.equal(output, '<div class="p-4"></div>\n')
  })
}

for (const stage of ['factory', 'preprocess', 'parse']) {
  test(`reports a delegate ${stage} failure and allows a later format to recover`, async () => {
    // Arrange
    const error = new Error(`delegate ${stage} failed`)
    const delegate = { ...htmlParsers.html }
    let shouldFail = true
    const failure = async (text, options) => {
      if (shouldFail) {
        shouldFail = false
        throw error
      }
      if (stage === 'factory') return delegate
      if (stage === 'preprocess') return text
      return htmlParsers.html.parse(text, options)
    }
    if (stage !== 'factory') delegate[stage] = failure
    const failingPlugin = {
      parsers: { html: stage === 'factory' ? failure : delegate },
    }

    // Act / Assert
    await assert.rejects(
      format('<div></div>', {
        parser: 'html',
        plugins: [failingPlugin, canonicalPlugin],
      }),
      (actual) => actual === error,
    )
    const output = await format('<div class="p-[16px]"></div>', {
      parser: 'html',
      plugins: [failingPlugin, canonicalPlugin],
    })
    assert.equal(output, '<div class="p-4"></div>\n')
  })
}
