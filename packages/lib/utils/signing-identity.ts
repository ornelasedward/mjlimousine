import { type Field, FieldType } from '@prisma/client';

export type SigningIdentityValues = {
  fullName: string;
  email: string;
};

type DeriveSigningIdentityValuesOptions = {
  recipientName?: string | null;
  recipientEmail?: string | null;
  fields?: Field[];
  fallbackName?: string | null;
  fallbackEmail?: string | null;
};

/**
 * Derives the signer's name and email for the signing UI.
 *
 * Inserted field values take priority so returning signers see what they previously entered.
 */
export const deriveSigningIdentityValues = ({
  recipientName,
  recipientEmail,
  fields = [],
  fallbackName,
  fallbackEmail,
}: DeriveSigningIdentityValuesOptions): SigningIdentityValues => {
  const insertedNameValue =
    fields.find((field) => field.type === FieldType.NAME && field.inserted)?.customText || '';
  const insertedEmailValue =
    fields.find((field) => field.type === FieldType.EMAIL && field.inserted)?.customText || '';

  return {
    fullName: insertedNameValue || recipientName || fallbackName || '',
    email: insertedEmailValue || recipientEmail || fallbackEmail || '',
  };
};
