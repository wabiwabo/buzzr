import React from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConfirmActionProps {
  title: string;
  description?: string;
  onConfirm: () => void;
  children?: React.ReactNode;
  buttonLabel?: string;
  buttonType?: 'default' | 'primary' | 'link' | 'text' | 'dashed';
  danger?: boolean;
  loading?: boolean;
}

export const ConfirmAction: React.FC<ConfirmActionProps> = ({
  title,
  description,
  onConfirm,
  children,
  buttonLabel,
  danger = false,
  loading = false,
}) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      {children || (
        <Button
          variant={danger ? 'destructive' : 'outline'}
          size="sm"
          disabled={loading}
        >
          {buttonLabel}
        </Button>
      )}
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Batal</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className={cn(danger && 'bg-destructive text-destructive-foreground hover:bg-destructive/90')}
        >
          Ya
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
