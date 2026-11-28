# Shared Ledger Mobile Prototype

Open `Shared_Ledger_Mobile_Prototype.html` in a browser. On phones it fills the viewport. On desktop it opens in a centered phone frame. The demo starts as Alex Kim in Chicago Weekend. It stores the shared ledger locally in the browser. Use **Account → Reset demo** to start over. Scroll the screen vertically, use the bottom tabs to switch views, and swipe the handle of a detail sheet down to close it.

## Try the integrated flow

1. As Alex, open **View breakdown**. The $27 dinner share and $15 parking credit leave $12 owed to Sam. Expand **Dinner in Chicago** to inspect the itemized receipt.
2. Open the dinner expense details and select **Edit split**. Use **View breakdown** in the details sheet if you want to expand the receipt. Uncheck Jordan Lee, check the updated amounts, and select **Submit to Sam**.
3. Switch **View as** to Sam. Open **Review split** under Recent activity. **Approve** updates the balance to $21 and retains Maya’s prior payment. **Decline** keeps the $12 balance and lets Alex edit again.
4. After approval, switch to Alex and select **I already paid**. Submit the prefilled $21 simulated transfer. Switch to Sam and select **Confirm receipt**. The balance between Alex and Sam falls to $0 and Payment history shows one new payment.
5. To try reminders, use **Remind Alex** as Sam before settlement. The demo supports immediate, preset, and custom times. A scheduled reminder is delivered while the demo is open or when it next opens after the scheduled time.

Split editing is demonstrated on the Chicago dinner. Bank activity and notifications are simulated locally.

## Source

Use Node.js 22.12+ or 24. Run `npm ci` and `npm run dev` in the extracted folder. Run `npm run build` to generate the standalone file at `dist/index.html`.
