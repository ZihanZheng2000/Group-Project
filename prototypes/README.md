# Shared Ledger — CS 6750 HCI Prototypes

Download the current HTML files from the table below and open them in a desktop browser. The [earlier source bundle](Splitwise_HCI_Prototypes.zip) contains local build instructions. Each version stores its own test data in the browser. Use **Reset demo** between participants. **View as** is always available in the top bar and switches the dashboard, activity, and ledger controls between Alex and Sam. Both roles share the same ledger within a version.

| File | What to test |
| --- | --- |
| [Splitwise_Prototype_0_Baseline.html](Splitwise_Prototype_0_Baseline.html) | Open **Chicago Weekend** as Alex. Choose **Settle up**, select Sam, enter $10.00, and confirm. The $21.00 group balance falls to $11.00. Check **Payment history**. |
| [Splitwise_Prototype_1_Balance_Breakdown.html](Splitwise_Prototype_1_Balance_Breakdown.html) | As Alex, select **View breakdown** under Sam Patel. Expand **Dinner in Chicago**. The dinner adds $36.00 and the parking credit subtracts $15.00. Alex’s dinner share includes $2.90 tax and $4.10 tip. Open **Dinner in Chicago** from **Recent activity**, then select **View breakdown** in the top-right corner of the expense details to see the itemized receipt. |
| [Splitwise_Prototype_2_Change_Request.html](Splitwise_Prototype_2_Change_Request.html) | As Alex, open **Dinner in Chicago**, choose **Request change**, and submit a reason for removing Jordan. Switch to Sam and review or approve. Maya still owes $9.00 after approval, and Alex’s net group balance with Sam becomes $21.00. Reset to try rejection. |
| [Splitwise_Prototype_3_Payment_Follow_Up.html](Splitwise_Prototype_3_Payment_Follow_Up.html) | As Sam, open **Payment follow-up** and select **Send reminder**. Choose **Immediately**, one of the preset delays, or **Custom date and time**. A scheduled reminder can be edited, cancelled, or sent early. Switch to Alex, choose **I already paid**, and send the prefilled report. Switch back to Sam and confirm receipt. Check **Payment history** for one $21.00 record. Try an incorrect amount and **Correct transfer details** to test recovery. |

Prototype 3 uses your browser’s local time. A scheduled reminder appears in the demo at the selected time while it is open, or when you reopen it after the selected time.

## Edit an expense you paid

In **Recent activity**, open an expense you paid and choose **Edit expense**. Update its description, date, or amount and select **Save changes**. For an itemized receipt in Prototype 1, edit the item amounts, tax, or tip and the total is recalculated. In Prototype 2, resolve a pending dinner split request before editing that expense as Sam.

## Rebuild or edit

Each folder under **Source** in the ZIP is its own React, TypeScript, and Tailwind CSS project. With Node.js 22.12+ or 24, enter the relevant folder, run `npm ci`, then `npm run dev`. Open the URL printed by Vite. Run `npm run build` to generate a standalone `dist/index.html`.

The English implementation prompts are in [Prototype_Prompts.md](Prototype_Prompts.md).
