import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import type { Recipient } from '@prisma/client';
import { SigningStatus } from '@prisma/client';
import { UserPen } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import type { TDocumentMany as TDocumentRow } from '@documenso/lib/types/document';
import { trpc } from '@documenso/trpc/react';
import { Button } from '@documenso/ui/primitives/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@documenso/ui/primitives/dialog';
import { DropdownMenuItem } from '@documenso/ui/primitives/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@documenso/ui/primitives/form/form';
import { Input } from '@documenso/ui/primitives/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';
import { useToast } from '@documenso/ui/primitives/use-toast';

const ZEditRecipientFormSchema = z.object({
  recipientId: z.coerce.number().min(1, { message: 'Please select a recipient' }),
  email: z.string().email({ message: 'Please enter a valid email address' }).toLowerCase(),
  name: z.string().optional(),
});

type TEditRecipientFormSchema = z.infer<typeof ZEditRecipientFormSchema>;

export type DocumentEditRecipientDialogProps = {
  document: Pick<TDocumentRow, 'id' | 'status' | 'userId' | 'teamId'>;
  recipients: Recipient[];
};

export const DocumentEditRecipientDialog = ({
  document,
  recipients,
}: DocumentEditRecipientDialogProps) => {
  const { _ } = useLingui();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const pendingRecipients = recipients.filter(
    (r) => r.signingStatus === SigningStatus.NOT_SIGNED,
  );

  const isDisabled = document.status !== 'PENDING' || pendingRecipients.length === 0;

  const { mutateAsync: updateRecipient } = trpc.recipient.updateDocumentRecipient.useMutation();
  const { mutateAsync: resendDocument } = trpc.document.redistribute.useMutation();

  const form = useForm<TEditRecipientFormSchema>({
    resolver: zodResolver(ZEditRecipientFormSchema),
    defaultValues: {
      recipientId: pendingRecipients[0]?.id ?? 0,
      email: pendingRecipients[0]?.email ?? '',
      name: pendingRecipients[0]?.name ?? '',
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    setValue,
    watch,
  } = form;

  const selectedRecipientId = watch('recipientId');

  const onRecipientChange = (idStr: string) => {
    const id = Number(idStr);
    const recipient = pendingRecipients.find((r) => r.id === id);
    if (recipient) {
      setValue('recipientId', id);
      setValue('email', recipient.email);
      setValue('name', recipient.name ?? '');
    }
  };

  const onFormSubmit = async ({ recipientId, email, name }: TEditRecipientFormSchema) => {
    try {
      await updateRecipient({
        documentId: document.id,
        recipient: { id: recipientId, email, name: name ?? '' },
      });

      await resendDocument({
        documentId: document.id,
        recipients: [recipientId],
      });

      toast({
        title: _(msg`Recipient updated`),
        description: _(msg`The recipient email has been updated and the signing link resent.`),
        duration: 5000,
      });

      setIsOpen(false);
    } catch (err) {
      toast({
        title: _(msg`Something went wrong`),
        description: _(msg`Could not update the recipient. Please try again.`),
        variant: 'destructive',
        duration: 7500,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem disabled={isDisabled} onSelect={(e) => e.preventDefault()}>
          <UserPen className="mr-2 h-4 w-4" />
          <Trans>Edit Recipient</Trans>
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <Trans>Edit Recipient Email</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans>
              Update the recipient's email address and resend the signing link.
            </Trans>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
            {pendingRecipients.length > 1 && (
              <FormField
                control={form.control}
                name="recipientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Trans>Recipient</Trans>
                    </FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={onRecipientChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={_(msg`Select recipient`)} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pendingRecipients.map((r) => (
                          <SelectItem key={r.id} value={String(r.id)}>
                            {r.email} {r.name ? `(${r.name})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans>Name</Trans>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={_(msg`Recipient name`)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans>New Email Address</Trans>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="recipient@example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <div className="flex w-full gap-3">
                <DialogClose asChild>
                  <Button type="button" variant="secondary" className="flex-1" disabled={isSubmitting}>
                    <Trans>Cancel</Trans>
                  </Button>
                </DialogClose>
                <Button type="submit" className="flex-1" loading={isSubmitting} disabled={isSubmitting}>
                  <Trans>Save & Resend</Trans>
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
