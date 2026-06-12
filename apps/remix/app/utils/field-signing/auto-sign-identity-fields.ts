import type { Field } from '@prisma/client';

import {
  type IdentityFieldAutoSignPayload,
  type SigningIdentityContext,
  getIdentityFieldAutoSignPayload,
  getIdentityFieldsToAutoSign,
  getUnsignedRequiredIdentityFields,
  resolveSigningIdentityContext,
} from '@documenso/lib/utils/signing-identity-fields';

export type { IdentityFieldAutoSignPayload, SigningIdentityContext };

export {
  getIdentityFieldAutoSignPayload,
  getIdentityFieldsToAutoSign,
  getUnsignedRequiredIdentityFields,
  resolveSigningIdentityContext,
};

type AutoSignIdentityFieldsOptions = {
  fields: Field[];
  context: SigningIdentityContext;
  signField: (fieldId: number, value: IdentityFieldAutoSignPayload['value']) => Promise<unknown>;
};

/**
 * Signs all identity fields that can be derived from the current name/email context.
 * Returns the field IDs that were successfully signed.
 */
export const autoSignIdentityFields = async ({
  fields,
  context,
  signField,
}: AutoSignIdentityFieldsOptions): Promise<number[]> => {
  const payloads = getIdentityFieldsToAutoSign(fields, context);
  const signedFieldIds: number[] = [];

  for (const { field, value } of payloads) {
    try {
      await signField(field.id, value);
      signedFieldIds.push(field.id);
    } catch {
      // Allow manual signing if auto-sign fails.
    }
  }

  return signedFieldIds;
};
