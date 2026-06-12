import { FieldType } from '@prisma/client';

import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { TFieldInitials } from '@documenso/lib/types/field';
import type { TSignEnvelopeFieldValue } from '@documenso/trpc/server/envelope-router/sign-envelope-field.types';

import { SignFieldInitialsDialog } from '~/components/dialogs/sign-field-initials-dialog';

type HandleInitialsFieldClickOptions = {
  field: TFieldInitials;
  initials: string | null;
};

export const handleInitialsFieldClick = async (
  options: HandleInitialsFieldClickOptions,
): Promise<Extract<TSignEnvelopeFieldValue, { type: typeof FieldType.INITIALS }> | null> => {
  const { field, initials } = options;

  if (field.type !== FieldType.INITIALS) {
    throw new AppError(AppErrorCode.INVALID_REQUEST, {
      message: 'Invalid field type',
    });
  }

  if (field.inserted) {
    const updatedInitials = await SignFieldInitialsDialog.call({
      defaultInitials: field.customText || initials || '',
    });

    if (!updatedInitials || updatedInitials === field.customText) {
      return null;
    }

    return {
      type: FieldType.INITIALS,
      value: updatedInitials,
    };
  }

  let initialsToInsert = initials;

  if (!initialsToInsert) {
    initialsToInsert = await SignFieldInitialsDialog.call({
      defaultInitials: initials || '',
    });
  }

  if (!initialsToInsert) {
    return null;
  }

  return {
    type: FieldType.INITIALS,
    value: initialsToInsert,
  };
};
