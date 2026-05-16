# Loom Notes

## 3-5 Minute Walkthrough

1. Start at `/tech/receive`.
   - Show the focused scan input.
   - Receive `C0009001` with serial `SN-DEMO-1`.
   - Repeat the same tag and serial to show the idempotent duplicate message.
   - Change the serial to show the loud conflict copy.

2. Move the same asset through the lab.
   - Store it at `Irvine/Storage A`.
   - Try deploy with `site=Irvine;room=B12;rack=R4` and call out the missing-RU copy.
   - Deploy with `site=Irvine;room=B12;rack=R4;ru=12`.
   - Transfer custody to `tech-mike`.

3. Open `/manager`.
   - Point out that the first screen is a morning summary and exceptions shortcut, not a raw table.
   - Use one filter and open `C0009001`.

4. Open the asset detail.
   - Show current truth and newest-first timeline.
   - Mention raw metadata is collapsed because managers should not start there.

5. Open `/manager/reconcile`.
   - Show categories and severity grouping.
   - Explain that expected differences, like stored assets missing from Facilities, are separated from actionable drift.
