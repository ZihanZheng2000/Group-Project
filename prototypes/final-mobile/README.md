# Shared Ledger Mobile Prototype

On GitHub, open [the standalone HTML](Shared_Ledger_Mobile_Prototype.html), choose **Download raw file**, and open the downloaded file in a browser. The mobile edition combines the three original interactions in Chicago Weekend. Switch between Alex and Sam using **View as**. Use **Account → Reset demo** for a fresh run.

## Try the integrated flow

1. **Detailed expense and balance breakdown.** As Alex, open **View breakdown** on the Chicago Weekend balance. The $27 dinner share and $15 parking credit leave $12 owed to Sam. Expand **Dinner in Chicago** to inspect the items, taxes, tip, and split. If you open the expense from Recent activity, use **View breakdown** in the expense details to show the receipt.
2. **Controlled editing and split approval.** As Alex, open **Dinner in Chicago → Edit split**, set Jordan Lee to $0 and the other three amounts to $36 each, and select **Submit to Sam**. Each person’s amount can be edited, and the amounts must add up to the expense total. Switch to Sam and select **Review split** under Recent activity. Compare the original and proposed amounts, including Maya’s existing $27 payment. **Approve** changes Alex’s net balance to $21 and leaves Maya $9 to pay for dinner. **Decline** keeps the original $12 balance. As Sam, use **Edit split → Save split** to save your own custom amounts directly. This works for every expense. For example, Alex can directly edit the Parking garage split, and Sam can propose new parking amounts for Alex to approve. **Edit expense** changes the underlying bill, including the receipt items for dinner.
3. **Customizable payment reminders and replies.** After approving the split, stay as Sam and open **Remind Alex**. Pick **Immediately**, a preset delay, or a custom date and time. For the full reply flow, send immediately, switch to Alex, and choose **Your reply**. Try **I’ll pay later**, **I have a question about the amount**, or **I already paid**. With the last option, submit the prefilled $21 transfer. Switch to Sam to compare it with simulated bank activity and confirm receipt. The balance reaches $0 and Payment history shows one new payment. To test scheduling, choose a delay or custom time and use **Edit reminder**, **Cancel reminder**, or **Send now**.

The original standalone prototypes are in the [prototype directory](../README.md). The integrated scenario starts from the four-way dinner split from Prototype 2. The simulated external transfer uses the $21 amount from Prototype 3 after approval.

## Source

Use Node.js 22.12+ or 24. Run `npm ci` and `npm run dev` in this folder. Run `npm run build` to generate the standalone file at `dist/index.html`.
