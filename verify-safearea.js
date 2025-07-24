const fs = require('fs');
const path = require('path');

// List of all screen files
const screenFiles = [
  'src/screens/signup/signup.screen.tsx',
  'src/screens/login/login.screen.tsx',
  'src/screens/home/home.screen.tsx',
  'src/screens/userdashboard/userdashboard.screen.tsx',
  'src/screens/profile/profile.screen.tsx',
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

function verifySafeAreaView(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    const hasImport = content.includes('SafeAreaView');
    const hasOpeningTag = content.includes('<SafeAreaView');
    const hasClosingTag = content.includes('</SafeAreaView>');
    
    if (hasImport && hasOpeningTag && hasClosingTag) {
      console.log(`✓ ${filePath} - SafeAreaView properly implemented`);
      return true;
    } else {
      console.log(`✗ ${filePath} - Missing SafeAreaView implementation`);
      if (!hasImport) console.log('  - Missing SafeAreaView import');
      if (!hasOpeningTag) console.log('  - Missing SafeAreaView opening tag');
      if (!hasClosingTag) console.log('  - Missing SafeAreaView closing tag');
      return false;
    }
    
  } catch (error) {
    console.error(`✗ ${filePath} - Error reading file:`, error.message);
    return false;
  }
}

// Verify all screen files
console.log('Verifying SafeAreaView implementation in all screens...\n');

let successCount = 0;
let totalCount = 0;

screenFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    totalCount++;
    if (verifySafeAreaView(filePath)) {
      successCount++;
    }
  } else {
    console.log(`✗ ${filePath} - File not found`);
  }
});

console.log(`\nSummary:`);
console.log(`✓ Successfully implemented: ${successCount}/${totalCount} screens`);
console.log(`✗ Needs attention: ${totalCount - successCount} screens`);

if (successCount === totalCount) {
  console.log('\n🎉 All screens have SafeAreaView properly implemented!');
} else {
  console.log('\n⚠️  Some screens need manual attention. Please review the files marked with ✗');
} 