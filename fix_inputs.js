const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix value={newConvenio.field}
  content = content.replace(/value=\{newConvenio\.([a-zA-Z0-9_]+)\}/g, "value={newConvenio.$1 ?? ''}");
  
  // Fix value={editConvenioData.field}
  content = content.replace(/value=\{editConvenioData\.([a-zA-Z0-9_]+)\}/g, "value={editConvenioData.$1 ?? ''}");

  // Fix value={newLinea.field}
  content = content.replace(/value=\{newLinea\.([a-zA-Z0-9_]+)\}/g, "value={newLinea.$1 ?? ''}");

  // Fix value={newVigencia.field}
  content = content.replace(/value=\{newVigencia\.([a-zA-Z0-9_]+)\}/g, "value={newVigencia.$1 ?? ''}");

  // Fix value={editVigenciaData.field}
  content = content.replace(/value=\{editVigenciaData\.([a-zA-Z0-9_]+)\}/g, "value={editVigenciaData.$1 ?? ''}");

  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${filePath}`);
}

fixFile('src/components/VigenciaModule.tsx');
