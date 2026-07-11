import { describe, it, expect, beforeEach, vi } from "vitest"
import api, { setClerkToken, getClerkToken, setClerkGetToken } from "@/lib/api-client"

const requestInterceptor = api.interceptors.request.handlers[0].fulfilled
const responseErrorInterceptor = api.interceptors.response.handlers[0].rejected

beforeEach(() => {
  setClerkToken(null)
  setClerkGetToken(null)
})

describe("api-client request interceptor", () => {
  it("attaches Authorization header when token is set", () => {
    setClerkToken("test-jwt-token")
    const config = { headers: {} }
    const result = requestInterceptor(config)
    expect(result.headers.Authorization).toBe("Bearer test-jwt-token")
  })

  it("does not attach Authorization header when no token is set", () => {
    const config = { headers: {} }
    const result = requestInterceptor(config)
    expect(result.headers.Authorization).toBeUndefined()
  })

  it("returns the config object", () => {
    const config = { headers: {}, baseURL: "/api" }
    const result = requestInterceptor(config)
    expect(result).toBe(config)
  })
})

describe("api-client response error interceptor", () => {
  it("attempts token refresh and retries on 401 when getToken is available", async () => {
    setClerkToken("stale-token")
    const freshToken = "refreshed-token"
    const getToken = vi.fn().mockResolvedValue(freshToken)
    setClerkGetToken(getToken)

    const err = {
      response: { status: 401 },
      config: { headers: {}, _retry: false },
    }

    await expect(responseErrorInterceptor(err)).rejects.toThrow()
    expect(getToken).toHaveBeenCalled()
    expect(getClerkToken()).toBe(freshToken)
  })

  it("clears token on 401 when getToken is not available", async () => {
    setClerkToken("my-token")
    setClerkGetToken(null)

    const err = {
      response: { status: 401 },
      config: { headers: {}, _retry: false },
    }

    await expect(responseErrorInterceptor(err)).rejects.toBe(err)
    expect(getClerkToken()).toBeNull()
  })

  it("does NOT clear token on a 403 response", async () => {
    setClerkToken("my-token")
    const err = { response: { status: 403 }, config: { headers: {} } }
    await expect(responseErrorInterceptor(err)).rejects.toBe(err)
    expect(getClerkToken()).toBe("my-token")
  })

  it("does NOT clear token on a 500 response", async () => {
    setClerkToken("my-token")
    const err = { response: { status: 500 }, config: { headers: {} } }
    await expect(responseErrorInterceptor(err)).rejects.toBe(err)
    expect(getClerkToken()).toBe("my-token")
  })

  it("re-rejects the error after handling 401 (does not swallow the error)", async () => {
    setClerkGetToken(null)
    const err = {
      response: { status: 401 },
      config: { headers: {}, _retry: false },
    }
    await expect(responseErrorInterceptor(err)).rejects.toBe(err)
  })

  it("re-rejects when there is no response object (network error)", async () => {
    const err = new Error("Network Error")
    await expect(responseErrorInterceptor(err)).rejects.toBe(err)
  })
})
