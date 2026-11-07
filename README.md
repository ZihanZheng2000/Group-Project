# Splitwise Settling Up — Group Project

**Main project page** | Georgia Tech CS 6750 HCI

## Project files

| File | Purpose |
| --- | --- |
| [Check-in 1](checkin-1.tex) | Project definition and initial needfinding |
| [Check-in 2](checkin-2.tex) | Needfinding results and requirements |
| [Check-in 3](checkin-3.tex) | Design alternatives and prototype |
| [Check-in 4](checkin-4.tex) | Evaluation and iteration |
| [Team notes](note.md) | Shared discussion, meeting notes, decisions, and action items |

The main PDF entry point is [jdf-starter.tex](jdf-starter.tex), which includes four separate blank LaTeX check-in files. Edit each `.tex` file in Overleaf; [note.md](note.md) is for team discussions. Earlier Markdown drafts are kept as reference and are not compiled. The four check-ins do not claim that research or evaluation has already been completed.

---

## Project background

## Project focus

**Task-focused design:** Help people understand how much they owe for shared expenses, complete a payment, and know whether an expense has truly been settled.

We are studying **settling up shared bills**, with Splitwise as an existing interface for exploration—not trying to redesign every feature of the app.

**Working question:** How can people verify what they owe, complete settlements, and trust the final status without unnecessary extra steps?

## Task workflow

1. **Entry and expense recording** — Join a group and record bills (context, not the core design focus).
2. **Before payment: review and verification** — Understand balances, expense breakdowns, updates, and edits.
3. **During payment: settlement** — Find the payee, pay, and record the transaction.
4. **After payment: confirmation and reconciliation** — Know what was received, what remains pending, and how to handle disputes.

**Primary focus: stages 2–4.**

## Internal pilot exploration (preliminary)

**Context:** Five-person regular group; U.S. and Canadian free versions tested. These are internal observations, not externally validated user needs.

| Stage | Observation | Needfinding question |
| --- | --- | --- |
| Review | The shared view can show split totals without separately showing principal, tax, and tip. | What breakdown is necessary to check an amount? |
| Review | New expenses did not appear without manual pull-to-refresh in the observed group list. | How do people know their balance is current? |
| Review | Group members can modify/delete expenses, while edit history is found in Activity rather than the expense detail view. | How should important changes be communicated? |
| Payment | After **Settle Up**, selecting a person's name as the next step was not obvious; currency conversion was more visually prominent. | Can users discover how to proceed with payment? |
| Payment | Payment records can be marked manually; external transfers do not automatically reconcile with the app. | What makes a settlement record reliable? |
| Confirmation | A payer-side record can indicate settlement without independent recipient confirmation. | How can trust be improved without burdensome confirmations? |

Relevant HCI lenses include **visibility of system status, signifiers and discoverability, mapping, error prevention, transparency, and trust versus efficiency**.

**Do not assume a mandatory receiver-confirmation button is the solution:** previous design choices and user friction need consideration. Survey and other evidence should guide alternatives.

### Limitations and uncertainties

- Itemize capabilities/edge cases were not fully verified; regional and subscription differences exist. Itemize is outside our core task scope.
- Whether balances and the Activity page also require manual refresh is unverified.
- The cause of the **Convert to CNY** option is unverified.
- Features and behaviors should be rechecked against tested versions before making general claims.
- Pilot findings are *hypotheses and prompts for research*, not established requirements.

## Needfinding: three separate activities

1. **Survey (external users; required active method).** Ask neutral questions about recent real-world shared-bill settlements, checking amounts, payment methods, status tracking, disputes, and preferences for confirmation versus effort. Avoid leading participants toward a proposed solution.
2. **Heuristic evaluation (existing Splitwise interface).** Walk through the settling-up workflow; document reproducible issues, screenshots, relevant heuristics, severity, and evidence.
3. **Analysis of public product reviews.** Collect relevant reviews using a documented sampling approach; code themes about bills, balances, payments, synchronization, and disputes. Seek contradictory cases and report selection bias.

These activities use different sources/methods. The internal pilot informs the plan but is **not a substitute** for the required external-user activity.

## Immediate next steps

- Finalize task boundaries and research questions.
- Design and pilot the survey, then recruit external participants.
- Complete a systematic heuristic evaluation.
- Define a product-review collection and coding protocol.
- Triangulate findings before prioritizing requirements or building a prototype.

**Status:** Needfinding planning. No final solution or user-validated findings yet.
