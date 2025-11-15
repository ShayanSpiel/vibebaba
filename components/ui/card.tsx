import * as React from 'react';

import { cn } from '@/lib/utils';

const ShadcnCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border bg-background-raised text-card-foreground shadow-sm',
        className
      )}
      {...props}
    />
  )
);
ShadcnCard.displayName = 'ShadcnCard';

const ShadcnCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
ShadcnCardHeader.displayName = 'ShadcnCardHeader';

const ShadcnCardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
ShadcnCardTitle.displayName = 'ShadcnCardTitle';

const ShadcnCardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm text-text-secondary', className)} {...props} />
));
ShadcnCardDescription.displayName = 'ShadcnCardDescription';

const ShadcnCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
ShadcnCardContent.displayName = 'ShadcnCardContent';

const ShadcnCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
ShadcnCardFooter.displayName = 'ShadcnCardFooter';

export {
  ShadcnCard as Card,
  ShadcnCardHeader as CardHeader,
  ShadcnCardFooter as CardFooter,
  ShadcnCardTitle as CardTitle,
  ShadcnCardDescription as CardDescription,
  ShadcnCardContent as CardContent,
};
