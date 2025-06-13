module.exports = {
  presets: [
    ['@babel/preset-env', { 
      targets: { node: 'current' },
      modules: 'commonjs' // Force CommonJS modules for Jest
    }],
    ['@babel/preset-react', { runtime: 'automatic' }]
  ]
};
