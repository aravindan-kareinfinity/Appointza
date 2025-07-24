const fs = require('fs');
const path = require('path');

// List of screen files that need SafeAreaView
const screenFiles = [
  'src/screens/timing/timing.screen.tsx',
  'src/screens/servicesavailable/service.screen.tsx',
  'src/screens/userappointment/userappointment.screen.tsx',
  'src/screens/organisation/organisation.screen.tsx',
  'src/screens/otpverification/otpverification.screen.tsx',
  'src/screens/launch/launch.screen.tsx',
  'src/screens/chat/chat.screen.tsx',
  'src/screens/events/servicelist.screen.tsx',
  'src/screens/bussinessdashboard/bussinessdashboard.screen.tsx',
  'src/screens/group/group.screen.tsx',
  'src/screens/bussinessappoinment/bussinessappoinment.screen.tsx',
  'src/screens/account/account.screen.tsx',
  'src/screens/addlocation/addlocation.screen.tsx',
  'src/screens/addedaccountsdetails/addedaccountsdetails.screen.tsx',
  'src/screens/appoinmentfixing/appoinmentbooking.screen.tsx',
  'src/screens/addedaccounts/addedaccounts.screen.tsx'
];

function addSafeAreaView(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if SafeAreaView is already imported
    if (content.includes('SafeAreaView')) {
      console.log(`✓ ${filePath} already has SafeAreaView`);
      return;
    }
    
    // Add SafeAreaView to import statement
    const importRegex = /import\s*{([^}]+)}\s*from\s*['"]react-native['"];?/g;
    let match = importRegex.exec(content);
    
    if (match) {
      const imports = match[1].split(',').map(imp => imp.trim());
      if (!imports.includes('SafeAreaView')) {
        imports.push('SafeAreaView');
        const newImports = imports.join(', ');
        content = content.replace(match[0], `import {${newImports}} from 'react-native';`);
      }
    }
    
    // Find the return statement and wrap it with SafeAreaView
    const returnRegex = /return\s*\(\s*<([^>]+)/;
    match = returnRegex.exec(content);
    
    if (match) {
      const firstTag = match[1];
      // Wrap the return statement with SafeAreaView
      content = content.replace(
        /return\s*\(\s*</,
        'return (\n    <SafeAreaView style={{ flex: 1 }}>\n      <'
      );
      
      // Find the closing tag and add SafeAreaView closing tag
      const lines = content.split('\n');
      let braceCount = 0;
      let returnFound = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('return (')) {
          returnFound = true;
        }
        
        if (returnFound) {
          if (line.includes('{')) braceCount++;
          if (line.includes('}')) braceCount--;
          
          if (braceCount === 0 && returnFound) {
            // Insert SafeAreaView closing tag before the closing brace
            lines.splice(i, 0, '    </SafeAreaView>');
            break;
          }
        }
      }
      
      content = lines.join('\n');
    }
    
    // Write the modified content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Added SafeAreaView to ${filePath}`);
    
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

// Process all screen files
console.log('Adding SafeAreaView to all screens...\n');

screenFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    addSafeAreaView(filePath);
  } else {
    console.log(`✗ File not found: ${filePath}`);
  }
});

console.log('\nCompleted! Please review the changes and test the app.'); 