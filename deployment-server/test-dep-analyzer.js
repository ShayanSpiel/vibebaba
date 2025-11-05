const { analyzeAndFix } = require('./dependency-analyzer.js');
const path = require('path');

const projectPath = path.join(__dirname, 'builds/project-mh9dpn420g3ru91o2z');

analyzeAndFix(projectPath)
  .then(result => {
    console.log('\n✅ Dependency analysis complete!');
    console.log('Fixed:', result.fixed);
    console.log('Added packages:', result.addedPackages);
  })
  .catch(error => {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  });
