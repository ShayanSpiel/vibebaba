/**
 * Test suite for shadcn import injection
 * Verifies that components are detected and imports are added correctly
 */

import { addShadcnImports } from '../shadcn-component-guide';

describe('addShadcnImports', () => {
  it('should detect Button usage and add import', () => {
    const code = `
'use client';

export default function Page() {
  return (
    <div>
      <Button variant="primary">Click Me</Button>
    </div>
  );
}
`;

    const result = addShadcnImports(code);
    expect(result).toContain('import { Button } from "@/components/ui/button"');
  });

  it('should detect Card components and add import', () => {
    const code = `
'use client';

export default function Page() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>Content</CardContent>
    </Card>
  );
}
`;

    const result = addShadcnImports(code);
    expect(result).toContain('import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"');
  });

  it('should detect Input and add import', () => {
    const code = `
'use client';

export default function Page() {
  return <Input label="Email" type="email" />;
}
`;

    const result = addShadcnImports(code);
    expect(result).toContain('import { Input } from "@/components/ui/input"');
  });

  it('should detect multiple different components', () => {
    const code = `
'use client';

export default function Page() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Form</CardTitle>
      </CardHeader>
      <CardContent>
        <Input label="Name" />
        <Button>Submit</Button>
      </CardContent>
    </Card>
  );
}
`;

    const result = addShadcnImports(code);
    expect(result).toContain('import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"');
    expect(result).toContain('import { Input } from "@/components/ui/input"');
    expect(result).toContain('import { Button } from "@/components/ui/button"');
  });

  it('should insert imports after "use client" directive', () => {
    const code = `'use client';

import { useState } from 'react';

export default function Page() {
  return <Button>Click</Button>;
}
`;

    const result = addShadcnImports(code);
    const lines = result.split('\n');
    const useClientIndex = lines.findIndex(l => l.includes('use client'));
    const buttonImportIndex = lines.findIndex(l => l.includes('import { Button }'));
    const reactImportIndex = lines.findIndex(l => l.includes('import { useState }'));

    expect(useClientIndex).toBeLessThan(buttonImportIndex);
    expect(buttonImportIndex).toBeLessThan(reactImportIndex);
  });

  it('should not add imports if components are not used', () => {
    const code = `
'use client';

export default function Page() {
  return <div>No components here</div>;
}
`;

    const result = addShadcnImports(code);
    expect(result).not.toContain('@/components/ui/');
  });

  it('should handle Dialog components', () => {
    const code = `
export default function Page() {
  return (
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Title</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
`;

    const result = addShadcnImports(code);
    expect(result).toContain('import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"');
  });

  it('should handle Select components', () => {
    const code = `
export default function Page() {
  return (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Choose" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1">Option 1</SelectItem>
      </SelectContent>
    </Select>
  );
}
`;

    const result = addShadcnImports(code);
    expect(result).toContain('import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"');
  });
});
