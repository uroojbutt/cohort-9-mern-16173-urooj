module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testMatch: ['<rootDir>/tests/**/*.(test|spec).{js,jsx}'],
  transformIgnorePatterns: [
    'node_modules/(?!(axios|@tiptap/core|@tiptap/extension-document|@tiptap/extension-paragraph|@tiptap/extension-text|@tiptap/pm|@tiptap/starter-kit|@tiptap/extension-placeholder)/)'
  ]
};