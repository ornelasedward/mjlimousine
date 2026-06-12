import { type Field, FieldType } from '@prisma/client';

import { extractInitials } from '@documenso/lib/utils/recipient-formatter';
import type { TSignEnvelopeFieldValue } from '@documenso/trpc/server/envelope-router/sign-envelope-field.types';

type IdentityFieldContext = {
  fullName: string;
  email: string;
};

export type IdentityFieldAutoSignPayload = {
  field: Field;
  value: TSignEnvelopeFieldValue;
};

export const getIdentityFieldAutoSignPayload = (
  field: Field,
  context: IdentityFieldContext,
): IdentityFieldAutoSignPayload | null => {
  const trimmedName = context.fullName.trim();
  const trimmedEmail = context.email.trim();

  if (field.type === FieldType.NAME && trimmedName) {
    if (field.inserted && field.customText === trimmedName) {
      return null;
    }

    return {
      field,
      value: {
        type: FieldType.NAME,
        value: trimmedName,
      },
    };
  }

  if (field.type === FieldType.EMAIL && trimmedEmail) {
    if (field.inserted && field.customText?.toLowerCase() === trimmedEmail.toLowerCase()) {
      return null;
    }

    return {
      field,
      value: {
        type: FieldType.EMAIL,
        value: trimmedEmail,
      },
    };
  }

  if (field.type === FieldType.INITIALS && trimmedName) {
    const initials = extractInitials(trimmedName);

    if (!initials) {
      return null;
    }

    if (field.inserted && field.customText === initials) {
      return null;
    }

    return {
      field,
      value: {
        type: FieldType.INITIALS,
        value: initials,
      },
    };
  }

  return null;
};

export const getIdentityFieldsToAutoSign = (
  fields: Field[],
  context: IdentityFieldContext,
): IdentityFieldAutoSignPayload[] => {
  return fields
    .map((field) => getIdentityFieldAutoSignPayload(field, context))
    .filter((payload): payload is IdentityFieldAutoSignPayload => payload !== null);
};

type AutoSignIdentityFieldsOptions = {
  fields: Field[];
  context: IdentityFieldContext;
  signField: (fieldId: number, value: TSignEnvelopeFieldValue) => Promise<unknown>;
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
