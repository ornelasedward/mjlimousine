import { DocumentDistributionMethod } from '@prisma/client';
import { z } from 'zod';

import { ZDocumentEmailSettingsSchema } from '@documenso/lib/types/document-email';
import { ZDocumentMetaFollowUpUrlSchema } from '@documenso/lib/types/document-meta';

export const ZAddSubjectFormSchema = z.object({
  meta: z.object({
    emailId: z.string().nullable(),
    emailReplyTo: z.preprocess(
      (val) => (val === '' ? undefined : val),
      z.string().email().optional(),
    ),
    // emailReplyName: z.string().optional(),
    subject: z.string(),
    message: z.string(),
    followUpUrl: z.preprocess(
      (val) => (val === '' ? undefined : val),
      ZDocumentMetaFollowUpUrlSchema.optional(),
    ),
    distributionMethod: z
      .nativeEnum(DocumentDistributionMethod)
      .optional()
      .default(DocumentDistributionMethod.EMAIL),
    emailSettings: ZDocumentEmailSettingsSchema,
  }),
});

export type TAddSubjectFormSchema = z.infer<typeof ZAddSubjectFormSchema>;
