import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import * as prettier from 'prettier'
import * as sortingPlugin from 'prettier-plugin-tailwindcss'
import * as canonicalPlugin from '../dist/index.js'

test('canonicalizes and sorts on the first use of the official lazy HTML parser', () => {
  // Arrange: a fresh process prevents earlier formats from initializing the factory.
  const script = `
    import { format } from 'prettier';
    import * as sorter from 'prettier-plugin-tailwindcss';
    import * as canonical from './dist/index.js';
    const output = await format('<div class="text-red-500 p-[16px] flex mt-[16px]"></div>', {
      parser: 'html', plugins: [sorter, canonical],
    });
    process.stdout.write(output);
  `

  // Act
  const output = execFileSync(
    process.execPath,
    ['--input-type=module', '-e', script],
    {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
      encoding: 'utf8',
    },
  )

  // Assert
  assert.equal(output, '<div class="mt-4 flex p-4 text-red-500"></div>\n')
})

for (const { parser, input, expected } of [
  {
    parser: 'babel',
    input:
      'const element = <div className="text-red-500 p-[16px] flex mt-[16px]" />',
    expected:
      'const element = <div className="mt-4 flex p-4 text-red-500" />;\n',
  },
  {
    parser: 'typescript',
    input:
      'const element = <div className="text-red-500 p-[16px] flex mt-[16px]" />',
    expected:
      'const element = <div className="mt-4 flex p-4 text-red-500" />;\n',
  },
  {
    parser: 'css',
    input: '.card { @apply text-red-500 p-[16px] flex mt-[16px]; }',
    expected: '.card {\n  @apply mt-4 flex p-4 text-red-500;\n}\n',
  },
  {
    parser: 'vue',
    input:
      '<template><div class="text-red-500 p-[16px] flex mt-[16px]"></div></template>',
    expected:
      '<template><div class="mt-4 flex p-4 text-red-500"></div></template>\n',
  },
]) {
  test(`canonicalizes and sorts ${parser} in one pass and preserves the second pass`, async () => {
    // Arrange
    const options = { parser, plugins: [sortingPlugin, canonicalPlugin] }

    // Act
    const output = await prettier.format(input, options)
    const repeatedOutput = await prettier.format(output, options)

    // Assert
    assert.equal(output, expected)
    assert.equal(repeatedOutput, expected)
  })
}

test('canonicalizes without requiring the sorting plugin', async () => {
  // Arrange
  const input = '<div class="text-red-500 p-[16px] flex mt-[16px]"></div>'

  // Act
  const output = await prettier.format(input, {
    parser: 'html',
    plugins: [canonicalPlugin],
  })

  // Assert
  assert.equal(output, '<div class="text-red-500 p-4 flex mt-4"></div>\n')
})

test('loads both plugins by their CLI-compatible string paths', async () => {
  // Arrange
  const input = '<div class="text-red-500 p-[16px] flex mt-[16px]"></div>'

  // Act
  const output = await prettier.format(input, {
    parser: 'html',
    plugins: [
      'prettier-plugin-tailwindcss',
      fileURLToPath(new URL('../dist/index.js', import.meta.url)),
    ],
  })

  // Assert
  assert.equal(output, '<div class="mt-4 flex p-4 text-red-500"></div>\n')
})

test('forwards custom theme and function options to the official sorter', async () => {
  // Arrange
  const stylesheet = fileURLToPath(
    new URL('./fixtures/theme.css', import.meta.url),
  )
  const input =
    'const element = <div className={cn("text-brand p-[16px] flex xs:mt-[16px]")} />'

  // Act
  const output = await prettier.format(input, {
    parser: 'typescript',
    plugins: [sortingPlugin, canonicalPlugin],
    tailwindStylesheet: stylesheet,
    tailwindcssCanonicalStylesheet: stylesheet,
    tailwindFunctions: ['cn'],
  })

  // Assert
  assert.equal(
    output,
    'const element = <div className={cn("flex p-2 text-brand xs:mt-2")} />;\n',
  )
})

test('keeps comments and unknown classes while sorting repeated and empty lists', async () => {
  // Arrange
  const input =
    '<!-- keep -->\n<div class="custom p-[16px] flex flex"></div>\n<div class=""></div>'

  // Act
  const output = await prettier.format(input, {
    parser: 'html',
    plugins: [sortingPlugin, canonicalPlugin],
  })

  // Assert
  assert.equal(
    output,
    '<!-- keep -->\n<div class="custom flex p-4"></div>\n<div class=""></div>\n',
  )
})

test('keeps range formatting and comments valid after class lengths change', async () => {
  // Arrange
  const input =
    '/* keep */\nconst element = <div className="text-red-500 p-[16px] flex mt-[16px]" />;\nconst untouched=1;\n'

  // Act
  const output = await prettier.format(input, {
    parser: 'typescript',
    plugins: [sortingPlugin, canonicalPlugin],
    rangeStart: input.indexOf('const element'),
    rangeEnd: input.indexOf('p-[16px]'),
  })

  // Assert
  assert.equal(
    output,
    '/* keep */\nconst element = <div className="mt-4 flex p-4 text-red-500" />;\nconst untouched=1;\n',
  )
})

test('keeps concurrent and alternating plugin configurations independent', async () => {
  // Arrange
  const input = '<div class="text-red-500 p-[16px] flex mt-[16px]"></div>'
  const sorted = { parser: 'html', plugins: [sortingPlugin, canonicalPlugin] }
  const canonicalOnly = { parser: 'html', plugins: [canonicalPlugin] }

  // Act
  const outputs = await Promise.all([
    prettier.format(input, sorted),
    prettier.format(input, canonicalOnly),
    prettier.format(input, sorted),
  ])
  const finalOutput = await prettier.format(input, canonicalOnly)

  // Assert
  assert.deepEqual(outputs, [
    '<div class="mt-4 flex p-4 text-red-500"></div>\n',
    '<div class="text-red-500 p-4 flex mt-4"></div>\n',
    '<div class="mt-4 flex p-4 text-red-500"></div>\n',
  ])
  assert.equal(finalOutput, '<div class="text-red-500 p-4 flex mt-4"></div>\n')
})
