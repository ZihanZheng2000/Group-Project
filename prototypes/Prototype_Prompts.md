# English Implementation Prompts

**Shared expense editing.** In all four builds, clicking an expense in Recent activity opens its details. Show Edit expense only when the active demo user paid that expense. Prefill the edit form, support changing the description, date, and amount, and save to the original expense so the split and balances update without creating a duplicate. Keep the original payer, group, and split participants. Preserve recorded payments. Verify that edits persist after reload and that another role cannot directly edit an expense it did not pay. Apply the receipt and pending-request rules in Prototypes 1 and 2.

## Prototype 0: Baseline

**Goal.** Build Shared Ledger, a high-fidelity, independently styled React, TypeScript, and Tailwind CSS reference prototype for the Georgia Tech CS 6750 HCI team project. Represent the core Splitwise settling-up workflow using fictional people and transactions.

**Interaction.** Build Dashboard, Groups, Friends, All expenses, Balances, and Payment history views. Let users add an expense, select a payer, split in integer cents, pick a settlement partner, enter an amount, and review and confirm a simulated payment. Update balances and history immediately. Put View as in the top bar so Alex and Sam can switch from any page; show balances and payment directions from the active role. Persist the shared ledger in the browser and include Reset demo.

**Scenario and acceptance checks.** In Chicago Weekend, Alex owes Sam $21.00 after a $15.00 parking credit offsets a $36.00 dinner share. A $10.00 simulated payment leaves $11.00 and creates a payment record. Also verify that Alex can edit Apartment groceries from $75.00 to $90.00, that the three shares become $30.00 each, and that the existing entry is updated. Verify both perspectives, calculation, history, and reset. Deliver standalone HTML, source, and local instructions.

## Prototype 1: Detailed Expense and Balance Breakdown

**Goal.** Extend the Baseline to help users verify what they owe before settling up.

**Interaction.** Add View breakdown from the Dashboard and friend page. Show every expense, credit, and payment contributing to the selected balance. Open Dinner in Chicago from Recent activity to show its summary. Keep the itemized receipt collapsed until the user selects View breakdown, and let them collapse it again with Hide breakdown. Let users expand an expense in place to see the payer, shared receipt items, subtotal, tax, tip, and their share. For expenses without a receipt, show the split and explain that itemization is unavailable. Link to the existing settlement flow with the appropriate person selected. Keep View as in the global top bar and calculate the breakdown from the active role. When Sam edits the itemized dinner, let Sam change the item amounts, tax, and tip. Recalculate the total and each participant’s share from the receipt.

**Scenario and acceptance checks.** Show Alex’s $36.00 dinner share, $15.00 parking credit, and $21.00 net amount due to Sam. The seeded $108.00 dinner includes $87.00 in items, $8.70 in tax, and $12.30 in tip; Alex’s share includes $2.90 tax and $4.10 tip. Verify that a $10.00 payment leaves $11.00 on both screens. In a separate reset session, switch to Sam and change the bill tip to $15.30. Verify the $111.00 bill total and the $5.10 per-person tip in the receipt. Include a separate browser storage key, standalone HTML, source, and instructions.

## Prototype 2: Controlled Editing and Change Requests

**Goal.** Let group members propose a split correction and let the creator review its financial impact.

**Interaction.** On Dinner in Chicago, let Alex submit a request with a reason to remove Jordan. Keep balances in effect while it is pending. Use the global View as control to switch to Sam, the creator. Show before-and-after shares, payments already recorded, and remaining dinner amounts. Only Sam can approve or reject. Sam can directly edit the dinner expense after resolving any pending split request. Preserve the previous split and decision in request history and preserve all prior payments.

**Scenario and acceptance checks.** Sam paid $108.00, initially split four ways at $27.00. After approval, the three attendees owe $36.00 each and Jordan owes $0.00 for dinner. Maya already paid $27.00, so she owes $9.00 more. Alex’s net Chicago Weekend balance with Sam rises from $12.00 to $21.00 after the parking credit. Verify that Sam’s Edit expense control is unavailable while the split request is pending and returns after approval or rejection. Verify both outcomes, reset, and payment history. Deliver a separate standalone build, source, and instructions.

## Prototype 3: Payment Reminders and Status Updates

**Goal.** Help a recipient reconcile a reported external payment with the shared ledger.

**Interaction.** As Sam, preview the amount and related expenses, then send immediately or schedule one reminder using a preset delay of 1, 3, 5, or 30 days, or a custom local date and time. Let Sam edit, cancel, or send a scheduled reminder early. Deliver it in the demo when due, including on reopening after its scheduled time. Editing a shared expense updates the underlying balance used by the follow-up. Use the global View as control to switch to Alex. Offer three replies: I’ll pay later, I already paid, and I have a question about the amount. For a transfer report, prefill editable demo details, show submission confirmation, and provide a direct handoff to Sam. Compare the report with the simulated bank activity. When details differ, explain what differs and allow Alex to correct and resubmit. Only Sam can confirm receipt or say the payment has not arrived. Preserve the conversation and prevent duplicate payment recording.

**Scenario and acceptance checks.** Alex owes Sam $21.00 in Chicago Weekend. A fictional bank transfer of $21.00 dated November 16, 2026 exists outside the ledger. Reminding and reporting leave $21.00 outstanding. Confirming the matching receipt creates one payment and reduces the balance to $0.00. Verify scheduling, editing, cancellation, delivery, all reply branches, mismatch recovery, navigation, and reset. Deliver a separate standalone build, source, and instructions.
