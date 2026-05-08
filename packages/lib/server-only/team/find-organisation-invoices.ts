import { getInvoices } from '@documenso/ee/server-only/stripe/get-invoices';
import { TEAM_MEMBER_ROLE_PERMISSIONS_MAP } from '@documenso/lib/constants/teams';
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { prisma } from '@documenso/prisma';

export interface FindTeamInvoicesOptions {
  userId: number;
  teamId: number;
}

export const findOrganisationInvoices = async ({ userId, teamId }: FindTeamInvoicesOptions) => {
  const team = await prisma.team.findFirstOrThrow({
    where: {
      id: teamId,
      teamGroups: {
        some: {
          teamRole: {
            in: TEAM_MEMBER_ROLE_PERMISSIONS_MAP['MANAGE_TEAM'],
          },
          organisationGroup: {
            organisationGroupMembers: {
              some: {
                organisationMember: {
                  userId,
                },
              },
            },
          },
        },
      },
    },
    select: {
      organisation: {
        select: {
          customerId: true,
        },
      },
    },
  });

  if (!team.organisation.customerId) {
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: 'Team has no customer ID.',
    });
  }

  const results = await getInvoices({ customerId: team.organisation.customerId });

  if (!results) {
    return null;
  }

  return {
    ...results,
    data: results.data.map((invoice) => ({
      invoicePdf: invoice.invoice_pdf,
      hostedInvoicePdf: invoice.hosted_invoice_url,
      status: invoice.status,
      subtotal: invoice.subtotal,
      total: invoice.total,
      amountPaid: invoice.amount_paid,
      amountDue: invoice.amount_due,
      created: invoice.created,
      paid: invoice.paid,
      quantity: invoice.lines.data[0].quantity ?? 0,
      currency: invoice.currency,
    })),
  };
};
