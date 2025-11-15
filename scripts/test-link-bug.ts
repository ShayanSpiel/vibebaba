/**
 * Test script to verify the Link component validation fix
 */

import { validateCode } from '../lib/validation';

async function testLinkValidation() {
  console.log('🧪 Testing Link Component Validation Fix\n');

  // This is the EXACT code that was failing
  const testFiles = [
    {
      path: 'src/app/layout.tsx',
      content: `import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600']
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={\`\${inter.className} bg-gradient-to-br from-cream-50 to-teal-50 min-h-screen\`}>
        <div className="container mx-auto px-4 py-8">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-primary">CRM Reports</h1>
            <nav className="flex gap-4">
              <Link href="/" className="text-primary hover:text-primary/80 transition-colors">Home</Link>
              <Link href="/reports" className="text-primary hover:text-primary/80 transition-colors">2025 Reports</Link>
              <Link href="/reports/2024" className="text-primary hover:text-primary/80 transition-colors">2024 Reports</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}`,
    },
  ];

  try {
    console.log('Running validation on layout.tsx with Link components...\n');
    const result = await validateCode(testFiles, {
      autoFix: false,
      strict: false,
      isMultiPage: false,
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 VALIDATION RESULTS:');
    console.log(`✅ Valid: ${result.valid}`);
    console.log(`❌ Errors: ${result.report.errors.length}`);
    console.log(`⚠️  Warnings: ${result.report.warnings.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (result.report.errors.length > 0) {
      console.log('❌ ERRORS FOUND:');
      result.report.errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. [${err.type}] ${err.message}`);
        console.log(`     File: ${err.file}, Line: ${err.line}`);
      });
      console.log('');
      console.log('❌ FAILED: The fix did not work!\n');
      process.exit(1);
    }

    if (result.valid) {
      console.log('✅ SUCCESS: Link components validated correctly!');
      console.log('   • <Link> components are NOT treated as self-closing ✓');
      console.log('   • <nav> and </nav> match correctly ✓');
      console.log('   • No false positive JSX errors ✓');
      console.log('');
      console.log('🎉 The fix is working!\n');
      process.exit(0);
    } else {
      console.log('❌ FAILED: Validation still failing\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testLinkValidation();
