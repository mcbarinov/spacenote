export class APIError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = "APIError"
    this.status = status
  }

  static async fromResponse(response: Response): Promise<APIError> {
    let message: string
    try {
      const data = (await response.json()) as Record<string, unknown>
      message = (data.detail ?? data.message ?? `Request failed: ${response.status.toString()}`) as string
    } catch {
      message = `Request failed: ${response.status.toString()}`
    }
    return new APIError(message, response.status)
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NotFoundError"
  }
}
