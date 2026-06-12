import { type Field, FieldType } from '@prisma/client';

import { ZFieldMetaSchema } from '../types/field-meta';

// Currently it seems that the majority of fields have advanced fields for font reasons.
// This array should only contain fields that have an optional setting in the fieldMeta.
export const ADVANCED_FIELD_TYPES_WITH_OPTIONAL_SETTING: FieldType[] = [
  FieldType.NUMBER,
  FieldType.TEXT,
  FieldType.DROPDOWN,
  FieldType.RADIO,
  FieldType.CHECKBOX,
  FieldType.FILE,
];

/**
 * Whether a field is required to be inserted.
 */
export const isRequiredField = (field: Field) => {
  // All fields without the optional metadata are assumed to be required.
  if (!ADVANCED_FIELD_TYPES_WITH_OPTIONAL_SETTING.includes(field.type)) {
    return true;
  }

  // Not sure why fieldMeta can be optional for advanced fields, but it is.
  // Therefore we must assume if there is no fieldMeta, then the field is optional.
  if (!field.fieldMeta) {
    return false;
  }

  const parsedData = ZFieldMetaSchema.safeParse(field.fieldMeta);

  // If it fails, assume the field is optional.
  // This needs to be logged somewhere.
  if (!parsedData.success) {
    return false;
  }

  return parsedData.data?.required === true;
};

const NAME_LIKE_TEXT_FIELD_PATTERN =
  /\b(name|full\s*name|your\s*name|legal\s*name|print\s*name|signer\s*name)\b/i;

const isNameLikeTextFieldForCompletion = (field: Field): boolean => {
  if (field.type !== FieldType.TEXT) {
    return false;
  }

  const label = typeof field.fieldMeta?.label === 'string' ? field.fieldMeta.label : '';
  const placeholder =
    typeof field.fieldMeta?.placeholder === 'string' ? field.fieldMeta.placeholder : '';

  return NAME_LIKE_TEXT_FIELD_PATTERN.test(`${label} ${placeholder}`.trim());
};

/**
 * Name fields may be left empty when completing a document.
 */
const isSkippableEmptyNameField = (field: Field): boolean => {
  if (field.inserted) {
    return false;
  }

  return field.type === FieldType.NAME || isNameLikeTextFieldForCompletion(field);
};

/**
 * Whether the provided field is required and not inserted.
 */
export const isFieldUnsignedAndRequired = (field: Field) => {
  if (!isRequiredField(field) || field.inserted) {
    return false;
  }

  if (isSkippableEmptyNameField(field)) {
    return false;
  }

  return true;
};

/**
 * Whether the provided fields contains a field that is required to be inserted.
 */
export const fieldsContainUnsignedRequiredField = (fields: Field[]) =>
  fields.some(isFieldUnsignedAndRequired);
