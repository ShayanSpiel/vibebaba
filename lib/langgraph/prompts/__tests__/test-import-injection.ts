/**
 * Manual test for shadcn import injection
 * Run: npx tsx lib/langgraph/prompts/__tests__/test-import-injection.ts
 */

import { addShadcnImports } from '../shadcn-component-guide';

console.log('🧪 Testing shadcn import injection...\n');

// Test 1: Button component
const test1 = `'use client';

export default function Page() {
  return <Button variant="primary">Click Me</Button>;
}`;

console.log('Test 1: Button component');
const result1 = addShadcnImports(test1);
console.log(result1.includes('import { Button }') ? '✅ PASS' : '❌ FAIL');
console.log(result1);
console.log('\n---\n');

// Test 2: Multiple Card components
const test2 = `'use client';

export default function Page() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>Content</CardContent>
    </Card>
  );
}`;

console.log('Test 2: Card components');
const result2 = addShadcnImports(test2);
console.log(
  result2.includes('import { Card, CardHeader, CardTitle, CardContent }') ? '✅ PASS' : '❌ FAIL'
);
console.log(result2);
console.log('\n---\n');

// Test 3: Mixed components
const test3 = `'use client';
import { useState } from 'react';

export default function Page() {
  return (
    <Card>
      <CardContent>
        <Input label="Email" type="email" />
        <Button loading={isLoading}>Submit</Button>
      </CardContent>
    </Card>
  );
}`;

console.log('Test 3: Mixed components (Card + Input + Button)');
const result3 = addShadcnImports(test3);
const hasCard = result3.includes('import { Card, CardContent }');
const hasInput = result3.includes('import { Input }');
const hasButton = result3.includes('import { Button }');
console.log(hasCard && hasInput && hasButton ? '✅ PASS' : '❌ FAIL');
console.log(result3);
console.log('\n---\n');

// Test 4: No components
const test4 = `'use client';

export default function Page() {
  return <div>No shadcn components</div>;
}`;

console.log('Test 4: No components (should not add imports)');
const result4 = addShadcnImports(test4);
console.log(!result4.includes('@/components/ui/') ? '✅ PASS' : '❌ FAIL');
console.log(result4);
console.log('\n---\n');

console.log('✅ All tests completed!');
