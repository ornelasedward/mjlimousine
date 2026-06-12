import { useCallback, useEffect, useState } from 'react';

import type { Field, Recipient } from '@prisma/client';

import { useDebouncedValue } from '@documenso/lib/client-only/hooks/use-debounced-value';
import {
  getUnsignedRequiredIdentityFields,
  resolveSigningIdentityContext,
} from '@documenso/lib/utils/signing-identity-fields';
import type { TSignEnvelopeFieldValue } from '@documenso/trpc/server/envelope-router/sign-envelope-field.types';

import { autoSignIdentityFields } from '~/utils/field-signing/auto-sign-identity-fields';

type UseSigningIdentityFieldSyncOptions = {
  fields: Field[];
  recipient: Pick<Recipient, 'id' | 'name' | 'email' | 'token'>;
  fullName: string;
  email: string;
  signField: (fieldId: number, value: TSignEnvelopeFieldValue) => Promise<Field>;
  onFieldsUpdated?: (fields: Field[]) => void;
};

export const useSigningIdentityFieldSync = ({
  fields,
  recipient,
  fullName,
  email,
  signField,
  onFieldsUpdated,
}: UseSigningIdentityFieldSyncOptions) => {
  const [localFields, setLocalFields] = useState(fields);

  useEffect(() => {
    setLocalFields(fields);
  }, [fields]);

  const debouncedFullName = useDebouncedValue(fullName.trim(), 300);
  const debouncedEmail = useDebouncedValue(email.trim(), 300);

  const updateLocalField = useCallback(
    (updatedField: Field) => {
      setLocalFields((prev) => {
        const next = prev.map((field) => (field.id === updatedField.id ? updatedField : field));
        onFieldsUpdated?.(next);
        return next;
      });
    },
    [onFieldsUpdated],
  );

  const syncIdentityFields = useCallback(
    async (overrides?: { name?: string; email?: string }) => {
      const context = resolveSigningIdentityContext({
        fullName,
        email,
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        fields: localFields,
        overrideName: overrides?.name,
        overrideEmail: overrides?.email,
      });

      if (!context.fullName && !context.email) {
        return [];
      }

      const identityFields = getUnsignedRequiredIdentityFields(localFields).filter(
        (field) => field.recipientId === recipient.id,
      );

      return await autoSignIdentityFields({
        fields: identityFields,
        context,
        signField: async (fieldId, value) => {
          const updatedField = await signField(fieldId, value);
          updateLocalField(updatedField);
          return updatedField;
        },
      });
    },
    [
      email,
      fullName,
      localFields,
      recipient.email,
      recipient.id,
      recipient.name,
      signField,
      updateLocalField,
    ],
  );

  useEffect(() => {
    if (!debouncedFullName && !debouncedEmail) {
      return;
    }

    void syncIdentityFields();
  }, [debouncedEmail, debouncedFullName, syncIdentityFields]);

  useEffect(() => {
    if (!fullName.trim() && !email.trim()) {
      return;
    }

    void syncIdentityFields();
    // Re-sync when server-provided fields change (e.g. returning signer).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields]);

  return {
    localFields,
    setLocalFields,
    syncIdentityFields,
  };
};
