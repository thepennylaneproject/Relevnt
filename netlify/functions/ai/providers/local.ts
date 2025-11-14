export async function processLocal(
  input: unknown,
  _options: Record<string, unknown> = {}
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    return { success: true, data: input };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}