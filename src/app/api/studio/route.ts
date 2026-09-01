import { recordAudit } from "@/lib/audit";
import { jsonError, requireSession } from "@/lib/auth";
import { canLockRates } from "@/lib/session";
import { loadStudio, patchStudio } from "@/lib/studio-store";
import { indexKnowledge, indexLessons, indexProposal } from "@/lib/rag/retrieve";
import { removeSource } from "@/lib/rag/store";
import { proposalToComparable } from "@/lib/accuracy";
import { DEFAULT_COMPANY, SAMPLE_PAST_BIDS } from "@/lib/defaults";
import type { CompanyProfile, KnowledgeDoc, Lesson, Proposal } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireSession(request);
    const studio = await loadStudio();
    return Response.json(studio);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireSession(request);
    const body = (await request.json()) as {
      company?: CompanyProfile;
      ratesLocked?: boolean;
      lesson?: Lesson;
      removeLessonId?: string;
      knowledge?: KnowledgeDoc;
      removeKnowledgeId?: string;
      proposal?: Proposal;
      sent?: boolean;
    };

    let previousProposal: Proposal | null = null;
    const studio = await patchStudio((current) => {
      previousProposal = current.latestProposal;
      let next = { ...current };

      if (body.company) {
        const incoming = { ...DEFAULT_COMPANY, ...body.company };
        if (current.company.ratesLocked && !canLockRates(user.role)) {
          next.company = {
            ...incoming,
            rates: current.company.rates,
            currency: current.company.currency,
            hoursPerDay: current.company.hoursPerDay,
            defaultContingencyPct: current.company.defaultContingencyPct,
            ratesLocked: current.company.ratesLocked,
            ratesLockedAt: current.company.ratesLockedAt,
            ratesLockedBy: current.company.ratesLockedBy,
          };
        } else {
          next.company = {
            ...incoming,
            ratesLocked: current.company.ratesLocked,
            ratesLockedAt: current.company.ratesLockedAt,
            ratesLockedBy: current.company.ratesLockedBy,
          };
        }
      }

      if (typeof body.ratesLocked === "boolean" && canLockRates(user.role)) {
        next.company = {
          ...next.company,
          ratesLocked: body.ratesLocked,
          ratesLockedAt: body.ratesLocked ? new Date().toISOString() : undefined,
          ratesLockedBy: body.ratesLocked ? user.name : undefined,
        };
      }

      if (body.lesson) {
        next.lessons = [body.lesson, ...next.lessons.filter((item) => item.id !== body.lesson?.id)];
      }
      if (body.removeLessonId) {
        next.lessons = next.lessons.filter((item) => item.id !== body.removeLessonId);
      }
      if (body.knowledge) {
        next.knowledge = [
          body.knowledge,
          ...next.knowledge.filter((item) => item.id !== body.knowledge?.id),
        ];
      }
      if (body.removeKnowledgeId) {
        next.knowledge = next.knowledge.filter((item) => item.id !== body.removeKnowledgeId);
      }
      if (body.proposal) {
        next.latestProposal = body.proposal;
        const comparable = proposalToComparable(body.proposal);
        const decided = comparable.outcome === "won" || comparable.outcome === "lost";
        const readyToStore =
          comparable.outcome === "sent" ||
          comparable.outcome === "no_bid" ||
          (decided && Boolean(comparable.reason));
        const seedIds = new Set(SAMPLE_PAST_BIDS.map((item) => item.id));
        const exists = next.history.some((item) => item.id === comparable.id);
        if (readyToStore) {
          next.history = [
            comparable,
            ...next.history.filter((item) => item.id !== comparable.id),
          ].slice(0, 50);
        } else if (exists && !seedIds.has(comparable.id)) {
          next.history = next.history.filter((item) => item.id !== comparable.id);
        }
      }

      return next;
    });

    if (body.lesson) {
      await indexLessons([body.lesson]);
      await recordAudit(user, "index_lesson", body.lesson.mistake.slice(0, 120), {
        proposalId: body.lesson.proposalId,
        projectTitle: body.lesson.projectTitle,
      });
    }
    if (body.knowledge) {
      await indexKnowledge([body.knowledge]);
      await recordAudit(user, "index_knowledge", body.knowledge.title);
    }
    if (body.removeKnowledgeId) {
      await removeSource(body.removeKnowledgeId);
    }
    if (body.removeLessonId) {
      await removeSource(body.removeLessonId);
    }
    if (body.proposal) {
      await indexProposal(body.proposal).catch(() => undefined);
      const prev = previousProposal;
      const closed =
        body.proposal.outcome === "won" ||
        body.proposal.outcome === "lost" ||
        body.proposal.outcome === "no_bid";
      if (
        closed &&
        (body.proposal.outcome !== prev?.outcome ||
          body.proposal.outcomeReason !== prev?.outcomeReason ||
          body.proposal.outcomeNote !== prev?.outcomeNote)
      ) {
        await recordAudit(
          user,
          "outcome",
          `${body.proposal.outcome}${body.proposal.outcomeReason ? ` · ${body.proposal.outcomeReason}` : ""}: ${body.proposal.projectTitle}`,
          {
            proposalId: body.proposal.id,
            projectTitle: body.proposal.projectTitle,
          },
        );
      }
    }
    if (body.sent && body.proposal) {
      await recordAudit(user, "send", `Marked sent: ${body.proposal.projectTitle}`, {
        proposalId: body.proposal.id,
        projectTitle: body.proposal.projectTitle,
      });
    }
    if (typeof body.ratesLocked === "boolean" && canLockRates(user.role)) {
      await recordAudit(
        user,
        body.ratesLocked ? "lock_rates" : "unlock_rates",
        body.ratesLocked ? "Rate card locked" : "Rate card unlocked",
      );
    }
    if (body.company && !body.lesson && !body.knowledge && !body.proposal) {
      await recordAudit(user, "save_profile", "Updated studio profile");
    }

    return Response.json(studio);
  } catch (error) {
    return jsonError(error);
  }
}
