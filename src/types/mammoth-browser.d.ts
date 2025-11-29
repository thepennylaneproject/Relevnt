declare module 'mammoth/mammoth.browser' {
  // Very loose typings are fine for now, we just want TS to stop yelling.

  // This matches the way you are calling it in ResumesPage:
  // const result = await mammothModule.convertToHtml({ arrayBuffer })
  // result.value is the HTML string.
  export function convertToHtml(input: {
    arrayBuffer: ArrayBuffer
  }): Promise<{
    value: string
    messages?: Array<{ message: string; type: string }>
  }>

  // Default export shape, for `const mammothModule: any = await import(...)`
  const mammoth: {
    convertToHtml: typeof convertToHtml
    // you can add more mammoth APIs here later if you need them
  }

  export = mammoth
}