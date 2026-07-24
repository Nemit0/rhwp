rhwp is a free and open-source extension that lets you open, edit, and print HWP/HWPX documents directly in your browser. No separate software installation required.

Key Features:

Auto-open HWP/HWPX files in the viewer when downloading from the web
Document editing: text input/modification, table editing, formatting
Printing: Ctrl+P for print preview, save as PDF or send to printer
Save edited documents as HWP files
Open files via drag & drop
Auto-detect HWP links on web pages and display an icon (badge)
Document info preview card on mouse hover
Right-click menu: "Open with rhwp"

⚠️ Important Notice:

HWPX documents can now be opened/edited and saved through the improved HWP conversion path.
Directly saving back to the original HWPX format is still limited as a beta feature.

Please back up important documents before editing.

Privacy:

All processing happens in the browser via WebAssembly (WASM)
Files are never sent to any external server
No ads, no tracking, no sign-up required
We do not collect any personal information

Web Developer Support:

HWP link integration via the data-hwp-* protocol
Built-in developer tools (rhwpDev) for debugging
Developer guide provided

Recommended for:

Citizens viewing government and public-sector documents
Parents checking school newsletters
Office workers reviewing contracts and reports
macOS/Linux users without Hancom Office
Anyone who does not want to install separate software just to open HWP files

MIT licensed — free for personal and commercial use.

[v0.2.3 Changes — 2026-05-26]

■ v0.2.3 (2026-05-26) Highlights

This update bumps the library core from v0.7.9 to v0.7.13. It focuses on HWPX rendering/save compatibility, exam/public-agency document layout parity, and browser-extension UX.

[HWPX → HWP Save Compatibility]
• Improved table/cell axis contracts, cell LIST_HEADER materialization, and gradient BORDER_FILL serialization
• Improved serialization of cell inner margins, cell background image fill mode, and cell vertical alignment
• Implemented memo control serialization and improved memo style preservation
• Fixed table-of-contents field markers and page text output
• Improved paragraph-control save paths including page-number hide and page-number restart
• Resolved multiple Hancom corruption/interrupted-render cases across hwpx-h-01/02/03, mel-001, aift, exam_kor, and exam_social fixtures

[HWPX Rendering Parity]
• Improved master pages (even/odd/last), headers, and footers
• Improved paragraph numbering, paragraph borders, and exam passage boxes
• Improved textbox positioning, gradient fills, and rounded-corner rendering
• Improved SVG and web-canvas parity against Hancom-converted fixtures including exam_kor.hwpx, exam_social.hwpx, and hwp3-sample16-hwp5.hwpx

[Pagination / Layout Fixes]
• Fixed HWPX treat_as_char table LINE_SEG height over-inflation
• Improved nested table page splitting, picture pushdown/vpos double counting, and multi-column endnote vpos handling
• Improved caret movement around TAC shapes and repeated spaces

[Browser Extension UX]
• Added guidance when local file:// access is disabled for HWP/HWPX files
• Reduced duplicate local downloads when opening local HWP/HWPX files in Chrome/Edge
• Bundled rhwp core 0.7.13 WASM

[Security / Privacy]
• No new permissions
• No new external network endpoints
• All document processing remains local inside browser WebAssembly
• No analytics, ads, or tracking

[Known Limitations]
• Direct save back to the original HWPX format remains limited as a beta feature
• Some complex HWPX → HWP save cases will continue to be improved in later releases

[Full Changelog]
https://github.com/edwardkim/rhwp/releases

[Source Code]
https://github.com/edwardkim/rhwp
