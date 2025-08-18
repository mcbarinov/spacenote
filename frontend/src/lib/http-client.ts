import ky from "ky"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3100"

export const httpClient = ky.create({
  prefixUrl: API_BASE_URL,
  hooks: {
    beforeRequest: [
      (request) => {
        const authToken = localStorage.getItem("auth_token")
        if (authToken) {
          request.headers.set("X-Auth-Token", authToken)
        }
      },
    ],
  },
})
