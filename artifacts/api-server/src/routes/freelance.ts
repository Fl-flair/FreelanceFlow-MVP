import { getAuth } from "@clerk/express";
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { Router, type IRouter, type RequestHandler } from "express";
import {
  clientsTable,
  db,
  invoicesTable,
  proposalsTable,
  remindersTable,
} from "@workspace/db";
import {
  ConvertProposalToInvoiceBody,
  ConvertProposalToInvoiceParams,
  ConvertProposalToInvoiceResponse,
  CreateClientBody,
  CreateClientResponse,
  CreateInvoiceBody,
  CreateInvoiceResponse,
  CreateProposalBody,
  CreateProposalResponse,
  CreateReminderDraftBody,
  CreateReminderDraftParams,
  CreateReminderDraftResponse,
  DeleteClientParams,
  DeleteInvoiceParams,
  DeleteProposalParams,
  GetFreelanceOverviewResponse,
  ListClientsResponse,
  ListInvoicesResponse,
  ListProposalsResponse,
  ListRemindersResponse,
  UpdateClientBody,
  UpdateClientParams,
  UpdateClientResponse,
  UpdateInvoiceBody,
  UpdateInvoiceParams,
  UpdateInvoiceResponse,
  UpdateProposalBody,
  UpdateProposalParams,
  UpdateProposalResponse,
  UpdateReminderBody,
  UpdateReminderParams,
  UpdateReminderResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const requireAuth: RequestHandler = (req, res, next) => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.locals.userId = userId;
  next();
};

router.use(requireAuth);

function userIdFrom(res: Parameters<RequestHandler>[1]): string {
  return res.locals.userId as string;
}

function iso(value: Date): string {
  return value.toISOString();
}

function toClient(client: typeof clientsTable.$inferSelect) {
  return { ...client, createdAt: iso(client.createdAt) };
}

function toProposal(proposal: typeof proposalsTable.$inferSelect) {
  return {
    id: proposal.id,
    clientId: proposal.clientId,
    clientName: proposal.clientName,
    title: proposal.title,
    sourceText: proposal.sourceText,
    content: proposal.content,
    amount: proposal.amountCents / 100,
    timeline: proposal.timeline,
    status: proposal.status,
    createdAt: iso(proposal.createdAt),
    updatedAt: iso(proposal.updatedAt),
  };
}

function invoiceStatus(invoice: typeof invoicesTable.$inferSelect) {
  if (invoice.status === "paid") return "paid";
  return invoice.dueDate < new Date().toISOString().slice(0, 10)
    ? "overdue"
    : "unpaid";
}

function toInvoice(invoice: typeof invoicesTable.$inferSelect) {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    clientId: invoice.clientId,
    proposalId: invoice.proposalId,
    clientName: invoice.clientName,
    clientEmail: invoice.clientEmail,
    description: invoice.description,
    amount: invoice.amountCents / 100,
    dueDate: invoice.dueDate,
    status: invoiceStatus(invoice),
    createdAt: iso(invoice.createdAt),
    updatedAt: iso(invoice.updatedAt),
  };
}

function reminderCopy(
  timing: string,
  invoice: typeof invoicesTable.$inferSelect,
): string {
  const firstName = invoice.clientName.trim().split(/\s+/)[0] || invoice.clientName;
  const dueDate = new Date(`${invoice.dueDate}T12:00:00`).toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" },
  );
  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(invoice.amountCents / 100);

  if (timing === "before_due") {
    return `Hi ${firstName},\n\nJust a friendly reminder that invoice ${invoice.invoiceNumber} for ${amount} is due on ${dueDate}. If you’ve already arranged payment, thank you—please disregard this note. Feel free to reach out if you have any questions.\n\nBest,\n`;
  }
  if (timing === "on_due") {
    return `Hi ${firstName},\n\nInvoice ${invoice.invoiceNumber} for ${amount} is due today (${dueDate}). If payment is already on its way, thank you. Please let me know if you need anything from me to process it.\n\nBest,\n`;
  }
  return `Hi ${firstName},\n\nI wanted to follow up on invoice ${invoice.invoiceNumber} for ${amount}, which was due on ${dueDate}. Could you let me know when I can expect payment? If you’ve already sent it, thank you and please disregard this note.\n\nBest,\n`;
}

router.get("/freelance/overview", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const [proposals, invoices, reminders] = await Promise.all([
    db.select().from(proposalsTable).where(eq(proposalsTable.userId, userId)),
    db
      .select()
      .from(invoicesTable)
      .where(eq(invoicesTable.userId, userId))
      .orderBy(desc(invoicesTable.createdAt)),
    db.select().from(remindersTable).where(eq(remindersTable.userId, userId)),
  ]);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const outstanding = invoices.filter((invoice) => invoice.status !== "paid");
  const result = {
    activeProposals: proposals.filter((proposal) =>
      ["draft", "sent"].includes(proposal.status),
    ).length,
    outstandingInvoices: outstanding.length,
    outstandingAmount: outstanding.reduce(
      (total, invoice) => total + invoice.amountCents / 100,
      0,
    ),
    paidThisMonth: invoices
      .filter(
        (invoice) =>
          invoice.status === "paid" && invoice.updatedAt >= monthStart,
      )
      .reduce((total, invoice) => total + invoice.amountCents / 100, 0),
    remindersToReview: reminders.filter((reminder) => reminder.status === "draft")
      .length,
    recentInvoices: invoices.slice(0, 5).map(toInvoice),
  };
  res.json(GetFreelanceOverviewResponse.parse(result));
});

router.get("/clients", async (req, res): Promise<void> => {
  const clients = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.userId, userIdFrom(res)))
    .orderBy(desc(clientsTable.createdAt));
  res.json(ListClientsResponse.parse(clients.map(toClient)));
});

router.post("/clients", async (req, res): Promise<void> => {
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [client] = await db
    .insert(clientsTable)
    .values({
      ...parsed.data,
      userId: userIdFrom(res),
      name: parsed.data.name.trim(),
    })
    .returning();
  res.status(201).json(CreateClientResponse.parse(toClient(client)));
});

router.patch("/clients/:id", async (req, res): Promise<void> => {
  const params = UpdateClientParams.safeParse(req.params);
  const parsed = UpdateClientBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({
      error: params.error?.message ?? parsed.error?.message ?? "Invalid request",
    });
    return;
  }
  const [client] = await db
    .update(clientsTable)
    .set({
      ...parsed.data,
      ...(parsed.data.name !== undefined
        ? { name: parsed.data.name.trim() }
        : {}),
    })
    .where(
      and(
        eq(clientsTable.id, params.data.id),
        eq(clientsTable.userId, userIdFrom(res)),
      ),
    )
    .returning();
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  res.json(UpdateClientResponse.parse(toClient(client)));
});

router.delete("/clients/:id", async (req, res): Promise<void> => {
  const params = DeleteClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [client] = await db
    .delete(clientsTable)
    .where(
      and(
        eq(clientsTable.id, params.data.id),
        eq(clientsTable.userId, userIdFrom(res)),
      ),
    )
    .returning();
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/proposals", async (req, res): Promise<void> => {
  const proposals = await db
    .select()
    .from(proposalsTable)
    .where(eq(proposalsTable.userId, userIdFrom(res)))
    .orderBy(desc(proposalsTable.createdAt));
  res.json(ListProposalsResponse.parse(proposals.map(toProposal)));
});

router.post("/proposals", async (req, res): Promise<void> => {
  const parsed = CreateProposalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  let clientName = parsed.data.clientName.trim();
  if (parsed.data.clientId != null) {
    const [client] = await db
      .select()
      .from(clientsTable)
      .where(
        and(
          eq(clientsTable.id, parsed.data.clientId),
          eq(clientsTable.userId, userIdFrom(res)),
        ),
      );
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    clientName = client.name;
  }
  const [proposal] = await db
    .insert(proposalsTable)
    .values({
      userId: userIdFrom(res),
      clientId: parsed.data.clientId ?? null,
      clientName,
      title: parsed.data.title.trim(),
      sourceText: parsed.data.sourceText ?? null,
      content: parsed.data.content,
      amountCents: Math.round(parsed.data.amount * 100),
      timeline: parsed.data.timeline,
      status: "draft",
    })
    .returning();
  res.status(201).json(CreateProposalResponse.parse(toProposal(proposal)));
});

router.patch("/proposals/:id", async (req, res): Promise<void> => {
  const params = UpdateProposalParams.safeParse(req.params);
  const parsed = UpdateProposalBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({
      error: params.error?.message ?? parsed.error?.message ?? "Invalid request",
    });
    return;
  }
  const data = parsed.data;
  const update: Partial<typeof proposalsTable.$inferInsert> = {
    ...(data.clientId !== undefined ? { clientId: data.clientId } : {}),
    ...(data.clientName !== undefined
      ? { clientName: data.clientName.trim() }
      : {}),
    ...(data.title !== undefined ? { title: data.title.trim() } : {}),
    ...(data.sourceText !== undefined ? { sourceText: data.sourceText } : {}),
    ...(data.content !== undefined ? { content: data.content } : {}),
    ...(data.amount !== undefined
      ? { amountCents: Math.round(data.amount * 100) }
      : {}),
    ...(data.timeline !== undefined ? { timeline: data.timeline } : {}),
    ...(data.status !== undefined ? { status: data.status } : {}),
  };
  if (data.clientId != null) {
    const [client] = await db
      .select()
      .from(clientsTable)
      .where(
        and(
          eq(clientsTable.id, data.clientId),
          eq(clientsTable.userId, userIdFrom(res)),
        ),
      );
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    update.clientName = client.name;
  }
  const [proposal] = await db
    .update(proposalsTable)
    .set(update)
    .where(
      and(
        eq(proposalsTable.id, params.data.id),
        eq(proposalsTable.userId, userIdFrom(res)),
      ),
    )
    .returning();
  if (!proposal) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }
  res.json(UpdateProposalResponse.parse(toProposal(proposal)));
});

router.delete("/proposals/:id", async (req, res): Promise<void> => {
  const params = DeleteProposalParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [proposal] = await db
    .delete(proposalsTable)
    .where(
      and(
        eq(proposalsTable.id, params.data.id),
        eq(proposalsTable.userId, userIdFrom(res)),
      ),
    )
    .returning();
  if (!proposal) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/proposals/:id/convert", async (req, res): Promise<void> => {
  const params = ConvertProposalToInvoiceParams.safeParse(req.params);
  const parsed = ConvertProposalToInvoiceBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({
      error: params.error?.message ?? parsed.error?.message ?? "Invalid request",
    });
    return;
  }
  const userId = userIdFrom(res);
  const [proposal] = await db
    .select()
    .from(proposalsTable)
    .where(
      and(
        eq(proposalsTable.id, params.data.id),
        eq(proposalsTable.userId, userId),
      ),
    );
  if (!proposal) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }
  if (proposal.status !== "accepted") {
    res.status(409).json({ error: "Only accepted proposals can be invoiced" });
    return;
  }
  let clientEmail: string | null = null;
  if (proposal.clientId != null) {
    const [client] = await db
      .select()
      .from(clientsTable)
      .where(
        and(
          eq(clientsTable.id, proposal.clientId),
          eq(clientsTable.userId, userId),
        ),
      );
    clientEmail = client?.email ?? null;
  }
  const [invoice] = await db
    .insert(invoicesTable)
    .values({
      userId,
      invoiceNumber: `FF-${randomUUID().slice(0, 8).toUpperCase()}`,
      clientId: proposal.clientId,
      proposalId: proposal.id,
      clientName: proposal.clientName,
      clientEmail,
      description: proposal.title,
      amountCents: proposal.amountCents,
      dueDate: parsed.data.dueDate.toISOString().slice(0, 10),
      status: "unpaid",
    })
    .returning();
  res
    .status(201)
    .json(ConvertProposalToInvoiceResponse.parse(toInvoice(invoice)));
});

router.get("/invoices", async (req, res): Promise<void> => {
  const invoices = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.userId, userIdFrom(res)))
    .orderBy(desc(invoicesTable.createdAt));
  res.json(ListInvoicesResponse.parse(invoices.map(toInvoice)));
});

router.post("/invoices", async (req, res): Promise<void> => {
  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  let clientName = parsed.data.clientName.trim();
  let clientEmail = parsed.data.clientEmail ?? null;
  if (parsed.data.clientId != null) {
    const [client] = await db
      .select()
      .from(clientsTable)
      .where(
        and(
          eq(clientsTable.id, parsed.data.clientId),
          eq(clientsTable.userId, userIdFrom(res)),
        ),
      );
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    clientName = client.name;
    clientEmail = client.email;
  }
  const [invoice] = await db
    .insert(invoicesTable)
    .values({
      userId: userIdFrom(res),
      invoiceNumber: `FF-${randomUUID().slice(0, 8).toUpperCase()}`,
      clientId: parsed.data.clientId ?? null,
      proposalId: null,
      clientName,
      clientEmail,
      description: parsed.data.description,
      amountCents: Math.round(parsed.data.amount * 100),
      dueDate: parsed.data.dueDate.toISOString().slice(0, 10),
      status: "unpaid",
    })
    .returning();
  res.status(201).json(CreateInvoiceResponse.parse(toInvoice(invoice)));
});

router.patch("/invoices/:id", async (req, res): Promise<void> => {
  const params = UpdateInvoiceParams.safeParse(req.params);
  const parsed = UpdateInvoiceBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({
      error: params.error?.message ?? parsed.error?.message ?? "Invalid request",
    });
    return;
  }
  const data = parsed.data;
  const update: Partial<typeof invoicesTable.$inferInsert> = {
    ...(data.clientName !== undefined
      ? { clientName: data.clientName.trim() }
      : {}),
    ...(data.clientEmail !== undefined ? { clientEmail: data.clientEmail } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.amount !== undefined
      ? { amountCents: Math.round(data.amount * 100) }
      : {}),
    ...(data.dueDate !== undefined
      ? { dueDate: data.dueDate.toISOString().slice(0, 10) }
      : {}),
    ...(data.status !== undefined ? { status: data.status } : {}),
  };
  const [invoice] = await db
    .update(invoicesTable)
    .set(update)
    .where(
      and(
        eq(invoicesTable.id, params.data.id),
        eq(invoicesTable.userId, userIdFrom(res)),
      ),
    )
    .returning();
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.json(UpdateInvoiceResponse.parse(toInvoice(invoice)));
});

router.delete("/invoices/:id", async (req, res): Promise<void> => {
  const params = DeleteInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const where = and(
    eq(invoicesTable.id, params.data.id),
    eq(invoicesTable.userId, userIdFrom(res)),
  );
  const [invoice] = await db.select().from(invoicesTable).where(where);
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  await db
    .delete(remindersTable)
    .where(
      and(
        eq(remindersTable.invoiceId, invoice.id),
        eq(remindersTable.userId, userIdFrom(res)),
      ),
    );
  await db.delete(invoicesTable).where(where);
  res.sendStatus(204);
});

router.post("/invoices/:id/reminders", async (req, res): Promise<void> => {
  const params = CreateReminderDraftParams.safeParse(req.params);
  const parsed = CreateReminderDraftBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({
      error: params.error?.message ?? parsed.error?.message ?? "Invalid request",
    });
    return;
  }
  const userId = userIdFrom(res);
  const [invoice] = await db
    .select()
    .from(invoicesTable)
    .where(
      and(
        eq(invoicesTable.id, params.data.id),
        eq(invoicesTable.userId, userId),
      ),
    );
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  const [reminder] = await db
    .insert(remindersTable)
    .values({
      userId,
      invoiceId: invoice.id,
      timing: parsed.data.timing,
      message: reminderCopy(parsed.data.timing, invoice),
      status: "draft",
    })
    .returning();
  const result = {
    id: reminder.id,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    clientName: invoice.clientName,
    timing: reminder.timing,
    message: reminder.message,
    status: reminder.status,
    createdAt: iso(reminder.createdAt),
  };
  res.status(201).json(CreateReminderDraftResponse.parse(result));
});

router.get("/reminders", async (req, res): Promise<void> => {
  const rows = await db
    .select({ reminder: remindersTable, invoice: invoicesTable })
    .from(remindersTable)
    .innerJoin(
      invoicesTable,
      and(
        eq(remindersTable.invoiceId, invoicesTable.id),
        eq(remindersTable.userId, invoicesTable.userId),
      ),
    )
    .where(eq(remindersTable.userId, userIdFrom(res)))
    .orderBy(desc(remindersTable.createdAt));
  res.json(
    ListRemindersResponse.parse(
      rows.map(({ reminder, invoice }) => ({
        id: reminder.id,
        invoiceId: reminder.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        timing: reminder.timing,
        message: reminder.message,
        status: reminder.status,
        createdAt: iso(reminder.createdAt),
      })),
    ),
  );
});

router.patch("/reminders/:id", async (req, res): Promise<void> => {
  const params = UpdateReminderParams.safeParse(req.params);
  const parsed = UpdateReminderBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({
      error: params.error?.message ?? parsed.error?.message ?? "Invalid request",
    });
    return;
  }
  const update: Partial<typeof remindersTable.$inferInsert> = {
    ...(parsed.data.message !== undefined
      ? { message: parsed.data.message }
      : {}),
    ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
  };
  const [reminder] = await db
    .update(remindersTable)
    .set(update)
    .where(
      and(
        eq(remindersTable.id, params.data.id),
        eq(remindersTable.userId, userIdFrom(res)),
      ),
    )
    .returning();
  if (!reminder) {
    res.status(404).json({ error: "Reminder not found" });
    return;
  }
  const [invoice] = await db
    .select()
    .from(invoicesTable)
    .where(
      and(
        eq(invoicesTable.id, reminder.invoiceId),
        eq(invoicesTable.userId, userIdFrom(res)),
      ),
    );
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.json(
    UpdateReminderResponse.parse({
      id: reminder.id,
      invoiceId: reminder.invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      timing: reminder.timing,
      message: reminder.message,
      status: reminder.status,
      createdAt: iso(reminder.createdAt),
    }),
  );
});

export default router;
