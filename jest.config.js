module.exports = {
    // Habilita la recolección de cobertura
    collectCoverage: true,
    // Especifica los archivos de los cuales se recogerá la cobertura,
    // excluyendo los archivos de prueba
    collectCoverageFrom: [
      "src/**/*.{js,jsx}",            // Incluye todos los archivos JS y JSX en src
      "!src/**/*.{test,spec}.{js,jsx}", // Excluye archivos con extensión .test.js, .spec.js, etc.
      "!src/**/__tests__/**"           // Excluye carpetas __tests__
    ],
    // Reportes de cobertura a generar
    coverageReporters: ["json", "lcov", "text", "clover"],
    // Extensiones de archivos a resolver
    moduleFileExtensions: ["js", "jsx", "json", "node"],
    // Usa jsdom como entorno de pruebas (ideal para aplicaciones React)
    testEnvironment: "jsdom"
  };
  