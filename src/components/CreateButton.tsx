import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode;
}

/**
 * CreateButton - A reusable button component for "Create" actions
 * Provides consistent gradient styling across the application
 */
export function CreateButton({
  children,
  className,
  ...props
}: CreateButtonProps) {
  return (
    <Button
      className={cn(
        'cursor-pointer bg-gradient-to-br from-primary to-secondary hover:from-primary/90 hover:to-secondary/90',
        className
      )}
      {...props}
    >
      <Plus className="w-4 h-4 mr-2" />
      {children}
    </Button>
  );
}
