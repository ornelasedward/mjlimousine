import { type Field, FieldType } from '@prisma/client';

import { isRequiredField } from './advanced-fields-helpers';
import { extractInitials } from './recipient-formatter';
import { deriveSigningIdentityValues } from './signing-identity';

const NAME_FIELD_PATTERN =
  /\b(name|full\s*name|your\s*name|legal\s*name|print\s*name|signer\s*name)\b/i;
const EMAIL_FIELD_PATTERN = /\b(e-?mail|email\s*address)\b/i;

export type SigningIdentityContext = {
  fullName: string;
  email: string;
};

export type IdentityFieldSignValue =
  | { type: typeof FieldType.NAME; value: string }
  | { type: typeof FieldType.EMAIL; value: string }
  | { type: typeof FieldType.INITIALS; value: string }
  | { type: typeof FieldType.TEXT; value: string };

export type IdentityFieldAutoSignPayload = {
  field: Field;
  value: IdentityFieldSignValue;
};

type ResolveSigningIdentityContextOptions = {
  fullName?: string | null;
  email?: string | null;
  recipientName?: string | null;
  recipientEmail?: string | null;
  fields?: Field[];
  overrideName?: string | null;
  overrideEmail?: string | null;
};

export const normalizeIdentityString = (value: string | null | undefined): string => {
  return (value ?? '').trim().replace(/\s+/g, ' ');
};

export const identityStringsMatch = (
  left: string | null | undefined,
  right: string | null | undefined,
) => {
  const normalizedLeft = normalizeIdentityString(left).toLowerCase();
  const normalizedRight = normalizeIdentityString(right).toLowerCase();

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  return normalizedLeft === normalizedRight;
};

export const isFieldReadOnly = (field: Field): boolean => {
  return field.fieldMeta?.readOnly === true;
};

const fieldMetaText = (field: Field) => {
  const label = typeof field.fieldMeta?.label === 'string' ? field.fieldMeta.label : '';
  const placeholder =
    typeof field.fieldMeta?.placeholder === 'string' ? field.fieldMeta.placeholder : '';

  return `${label} ${placeholder}`.trim();
};

export const isNameLikeTextField = (field: Field): boolean => {
  if (field.type !== FieldType.TEXT) {
    return false;
  }

  return NAME_FIELD_PATTERN.test(fieldMetaText(field));
};

export const isEmailLikeTextField = (field: Field): boolean => {
  if (field.type !== FieldType.TEXT) {
    return false;
  }

  return EMAIL_FIELD_PATTERN.test(fieldMetaText(field));
};

export const isAutoSignableIdentityField = (field: Field): boolean => {
  if (isFieldReadOnly(field)) {
    return false;
  }

  return (
    field.type === FieldType.NAME ||
    field.type === FieldType.EMAIL ||
    field.type === FieldType.INITIALS ||
    isNameLikeTextField(field) ||
    isEmailLikeTextField(field)
  );
};

export const resolveSigningIdentityContext = ({
  fullName,
  email,
  recipientName,
  recipientEmail,
  fields = [],
  overrideName,
  overrideEmail,
}: ResolveSigningIdentityContextOptions): SigningIdentityContext => {
  const derived = deriveSigningIdentityValues({
    recipientName,
    recipientEmail,
    fields,
    fallbackName: fullName,
    fallbackEmail: email,
  });

  return {
    fullName: normalizeIdentityString(overrideName ?? fullName ?? derived.fullName),
    email: normalizeIdentityString(overrideEmail ?? email ?? derived.email),
  };
};

const fieldValueMatchesIdentity = (field: Field, value: string) => {
  return identityStringsMatch(field.customText, value);
};

export const getIdentityFieldAutoSignPayload = (
  field: Field,
  context: SigningIdentityContext,
): IdentityFieldAutoSignPayload | null => {
  if (!isAutoSignableIdentityField(field)) {
    return null;
  }

  const trimmedName = context.fullName;
  const trimmedEmail = context.email;

  if (field.type === FieldType.NAME && trimmedName) {
    if (field.inserted && fieldValueMatchesIdentity(field, trimmedName)) {
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

  if (isNameLikeTextField(field) && trimmedName) {
    if (field.inserted && fieldValueMatchesIdentity(field, trimmedName)) {
      return null;
    }

    return {
      field,
      value: {
        type: FieldType.TEXT,
        value: trimmedName,
      },
    };
  }

  if (field.type === FieldType.EMAIL && trimmedEmail) {
    if (field.inserted && fieldValueMatchesIdentity(field, trimmedEmail)) {
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

  if (isEmailLikeTextField(field) && trimmedEmail) {
    if (field.inserted && fieldValueMatchesIdentity(field, trimmedEmail)) {
      return null;
    }

    return {
      field,
      value: {
        type: FieldType.TEXT,
        value: trimmedEmail,
      },
    };
  }

  if (field.type === FieldType.INITIALS && trimmedName) {
    const initials = extractInitials(trimmedName);

    if (!initials) {
      return null;
    }

    if (field.inserted && identityStringsMatch(field.customText, initials)) {
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
  context: SigningIdentityContext,
): IdentityFieldAutoSignPayload[] => {
  return fields
    .map((field) => getIdentityFieldAutoSignPayload(field, context))
    .filter((payload): payload is IdentityFieldAutoSignPayload => payload !== null);
};

export const getUnsignedRequiredIdentityFields = (fields: Field[]): Field[] => {
  return fields.filter(
    (field) => !field.inserted && isAutoSignableIdentityField(field) && isRequiredField(field),
  );
};
