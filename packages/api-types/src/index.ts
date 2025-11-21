import type { components } from "./openapi.gen";

// Core models
export type User = components["schemas"]["UserView"];

// Request/Response types
export type LoginRequest = components["schemas"]["LoginRequest"];
export type LoginResponse = components["schemas"]["LoginResponse"];
