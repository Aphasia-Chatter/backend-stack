// jest.config.js
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    moduleNameMapper: {
      '^src/(.*)$': '<rootDir>/src/$1', // Maps 'src/' alias to the src folder
    },
  };
  