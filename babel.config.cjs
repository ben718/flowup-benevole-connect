module.exports = {
  presets: [
    ['@babel/preset-env', { 
      targets: { node: 'current' },
      modules: 'auto' // Let Babel detect and handle ES modules
    }],
    ['@babel/preset-react', { runtime: 'automatic' }]
  ]
};
