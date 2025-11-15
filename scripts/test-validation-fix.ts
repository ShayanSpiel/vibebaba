/**
 * Test script to verify the React event types validation fix
 */

import { validateCode } from '../lib/validation';

async function testValidation() {
  console.log('🧪 Testing TypeScript Validator Fix for React Event Types\n');

  // Test case: React event handlers (previously failed)
  const testFiles = [
    {
      path: 'src/app/page.tsx',
      content: `'use client'

import { useState } from 'react'
import { Mail, User } from 'lucide-react'
import { submitLead, downloadPDF } from '@/lib/api'

export default function Page() {
  const [formData, setFormData] = useState({
    username: '',
    email: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const handleClick = (e: React.MouseEvent) => {
    console.log('clicked')
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="username" value={formData.username} onChange={handleChange} />
      <button onClick={handleClick}>Submit</button>
    </form>
  )
}
`,
    },
    {
      path: 'src/app/layout.tsx',
      content: `import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], weight: ['400', '700'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
`,
    },
    {
      path: 'src/app/globals.css',
      content: `/* Global styles */
body {
  margin: 0;
  padding: 0;
}
`,
    },
  ];

  try {
    console.log('Running validation...\n');
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
    }

    if (result.report.warnings.length > 0) {
      console.log('⚠️  WARNINGS FOUND:');
      result.report.warnings.forEach((warn, idx) => {
        console.log(`  ${idx + 1}. ${warn.message}`);
      });
      console.log('');
    }

    if (result.valid) {
      console.log('✅ SUCCESS: Validator correctly handles React event types!');
      console.log('   • React.ChangeEvent<HTMLInputElement> ✓');
      console.log('   • React.FormEvent ✓');
      console.log('   • React.MouseEvent ✓');
      console.log('');
      console.log('🎉 The fix is working correctly!\n');
      process.exit(0);
    } else {
      console.log('❌ FAILED: Validator still has issues\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testValidation();
