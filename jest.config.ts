import type { Config } from 'jest';

const config: Config = {
  projects: [
    // Node tests (repositories, business logic)
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/repositories/**/*.test.ts', '<rootDir>/src/db/**/*.test.ts'],
      transform: {
        '^.+\\.tsx?$': [
          'ts-jest',
          {
            tsconfig: 'tsconfig.json',
            isolatedModules: true,
          },
        ],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
    // Hook tests (jsdom environment for React hooks)
    {
      displayName: 'hooks',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/hooks/**/*.test.ts'],
      transform: {
        '^.+\\.tsx?$': [
          'ts-jest',
          {
            tsconfig: 'tsconfig.json',
            isolatedModules: true,
          },
        ],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
    // React Native tests (components, screens)
    {
      displayName: 'rn',
      preset: 'jest-expo',
      testMatch: ['<rootDir>/src/components/**/*.test.ts(x)?', '<rootDir>/app/**/*.test.ts(x)?'],
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|native-base|react-native-svg|nativewind|react-native-reanimated)',
      ],
      moduleNameMapper: {
        '\\.svg$': '<rootDir>/__mocks__/svgMock.ts',
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
  ],
};

export default config;
