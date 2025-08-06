export interface APIErrorResponse {
  error: string
  detail: string
  status_code: number
}

export class APIError extends Error {
  public readonly error: string
  public readonly statusCode: number

  constructor(response: APIErrorResponse) {
    super(response.detail)
    this.name = "APIError"
    this.error = response.error
    this.statusCode = response.status_code
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NotFoundError"
  }
}
