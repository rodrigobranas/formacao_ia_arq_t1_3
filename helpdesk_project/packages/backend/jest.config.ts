import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  collectCoverageFrom: [
    "src/index.ts",
    "src/agents/**/*.ts",
    "src/data/authMiddleware.ts",
    "src/routes/authRoutes.ts",
    "src/routes/organizationRoutes.ts",
    "src/routes/ticketTypeRoutes.ts",
    "src/routes/userRoutes.ts",
    "src/services/authService.ts",
    "src/services/organizationService.ts",
    "src/services/ticketTypeService.ts",
    "src/services/userService.ts",
    "src/data/testHelper.ts",
    "src/data/database.ts",
    "!src/**/*.test.ts",
  ],
};

export default config;
