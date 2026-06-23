export async function fetcher(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const maxRetries = 3

  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(url, init)

      if (
        ![502, 503, 504].includes(response.status) ||
        attempt >= maxRetries
      ) {
        return response
      }
    } catch (error) {
      if (attempt >= maxRetries) {
        throw error
      }
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 150 * 2 ** attempt),
    )
  }
}
