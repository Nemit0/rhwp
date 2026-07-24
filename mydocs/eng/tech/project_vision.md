# rhwp Project Ultimate Vision

## Vision

**Provide an End-to-End pipeline for AI Agents to read, understand, and generate HWP documents**

HWP is the de facto standard format in Korea's public sector and enterprise document ecosystem. We aim to enable AI to fully handle this format by securing both **semantic parsing (input)** and **native generation (output)**.

```
┌──────────────────────────────────────────────────────────────────┐
│                   "The Semantic Breaker"                          │
│                                                                   │
│  ┌─────────────────┐     ┌──────────┐     ┌─────────────────┐   │
│  │  hwp_semantic    │     │  AI Agent │     │  rhwp           │   │
│  │  (Python)        │ ──▶ │  (LLM)   │ ──▶ │  (Rust/WASM)    │   │
│  │                  │     │          │     │                  │   │
│  │  HWP → Semantic  │     │  Analysis│     │  HTML/API → HWP │   │
│  │  Parse·Chunk·    │     │  Reason  │     │  Parse·Render    │   │
│  │  Search          │     │  Generate│     │  Edit·Serialize  │   │
│  └─────────────────┘     └──────────┘     └─────────────────┘   │
│       ▲ Input (Break)                        ▼ Output (Forge)    │
│       │                                      │                   │
│       └──────────── .hwp ◄───────────────────┘                   │
└──────────────────────────────────────────────────────────────────┘
```

## Brand Identity: "The Semantic Breaker"

### Concept

Mjolnir -- an intelligent tool that typesets fragmented AI data into refined HWP documents. Not merely a hammer that destroys, but a two-sided tool that **breaks down (Break)** and **forges (Forge)** semantic structures.

### Logo Components

| Element | Symbolism | Corresponding Technology |
|------|------|-----------|
| **Hammer head** (Dog-eared document) | Full HWP file compatibility | rhwp: HWP binary parsing and serialization |
| **Striking face** (Data block grid) | RAG data, semantic chunks | hwp_semantic: 3-Level chunking, CTCR coordinate reference |
| **Handle** (Charcoal line + hexagon) | Rust core + WASM | rhwp: Rust native, wasm-pack build |
| **Fragment effect** (Table/formatting shapes) | The moment AI generates HWP | Table page splitting, headers/footers, auto-numbering |

> CTCR:
> Coordinate-based Table Cell Retrieval algorithm
>
> An algorithm that retrieves specific data cell values from a 2D table using keywords extracted from natural language queries
> Core formula:
>
> ```
> C(x,y) = (Kmax(column header keyword), Kmax(row header keyword))
> ```
>
> - `C(x,y)`: Coordinates of the search result data cell
> - `Kmax(column header)`: Maximum x-coordinate where keyword is found in the column header area
> - `Kmax(row header)`: Maximum y-coordinate where keyword is found in the row header area

### Brand Message

> **"A rare tool that turns AI-written text directly into HWP"**

Used in: rhwp-studio loading screen, CLI ASCII art, MCP server tool icons.

## Background

### The Reality of Korea's Document Ecosystem
- HWP is the de facto standard in government agencies, large enterprises, schools, military, etc.
- Even in the AI era, the requirement "submit your report in HWP" remains unchanged

### Current Limitations of AI Document Generation
- AI Agents (Claude, GPT, etc.) can generate PDF, DOCX, Markdown
- **HWP binary format generation is impossible** -- no technology/product exists in the market
- DOCX to HWP conversion causes formatting breakage, requiring manual work

### Limitations of Existing Solutions

**HWP Ecosystem Companies**:

| Solution | Business Area | Limitations for AI Agents |
|--------|----------|----------------|
| Hancom webhwp | Web-based HWP editing (OT/server) | Server-dependent, paid cloud, non-public API, OT architecture |
| A commercial web office | Web/mobile HWP editing (WASM) | B2B web office focused, no programmatic generation API |
| A commercial document viewer/conversion solution | Document viewer/converter/editor server | Viewer/converter specialized, HWP generation API not confirmed, server-dependent |

- **A commercial web office**: Enables HWP editing in the browser via serverless WebAssembly.
  Expanding as a B2B web office across some public/educational institutions. However, it is a product for "humans editing through a UI",
  and does not provide an API/SDK for AI Agents to programmatically generate HWP.

- **A commercial document viewer solution**: Provides Document AI solutions including an HWP document viewer,
  editor, and document conversion server. Established presence in the government document viewer market. However,
  the product specializes in **viewing/conversion** and a programmatic HWP binary generation API is not confirmed.
  Server-based SaaS architecture.

**Open Source/Others**:

| Solution | Limitations |
|--------|------|
| LibreOffice CLI | Limited HWP reading, no writing |
| Python hwp5 | Read-only, no write support |
| HWPX (OOXML-based) | Incompatible with .hwp binary files |

**Common limitation**: All existing solutions follow the **"humans use software to handle documents"** paradigm.
No tool exists for an AI Agent to generate HWP with a single function call.

**--> No tool exists (open source or commercial) for programmatically generating .hwp binaries locally**

## Complete Ecosystem: hwp_semantic + rhwp

### Roles of the Two Projects

| | hwp_semantic (Python) | rhwp (Rust/WASM) |
|---|---|---|
| **Direction** | HWP -> AI (Input) | AI -> HWP (Output) |
| **Core features** | Semantic parsing, chunking, vector search | Rendering, editing, serialization, conversion |
| **AI integration** | MCP Server (11 Tools) | MCP Server (generation/modification Tools) |
| **Distribution** | PyPI, Docker (MCP/BatchLoader) | PyPI, npm, Crate, MCP binary |
| **License** | MIT | MIT |

### hwp_semantic -- Input (Break) Pipeline

Decomposes HWP binaries into semantic structures that AI can understand.

```
HWP/HWPX Document
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  hwp_semantic                                            │
│                                                          │
│  Semantic Parsing ──▶ Markdown/JSON Export                │
│      │                                                   │
│      ▼                                                   │
│  3-Level Chunking (Table -> Row -> Cell)                 │
│      │         Row-Level: "[Dept Operating Costs]        │
│      │                     IT Team: 500M"                │
│      │         CTCR: Coordinate-based precise reference  │
│      ▼                                                   │
│  Vector Store (PostgreSQL + pgvector, BGE-M3 1024dim)    │
│      │                                                   │
│      ▼                                                   │
│  MCP Server (11 Tools)                                   │
│      • search_fiscal_data (hybrid search, RRF)           │
│      • get_time_series / compare_periods (Pivot Query)   │
│      • get_document_structure (context window)           │
│      • get_cell_value / get_cell_range (CTCR coords)     │
└─────────────────────────────────────────────────────────┘
    │
    ▼
Claude Desktop / Local LLM / Air-gapped AI
```

**Operational scale**: 182 consolidated fiscal statistics HWP documents, 5,500+ row chunks, 11,600+ cells vectorized.
BatchLoader enables one-click Docker bulk loading. Supports dynamic domain detection and image pHash deduplication.

### rhwp -- Output (Forge) Pipeline

Converts AI-generated content into HWP binaries for saving.

```
AI Agent Output (HTML / Structured API)
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  rhwp                                                    │
│                                                          │
│  HTML -> HWP Conversion (Phase 1)                        │
│      h1~h6, p, table, strong, em -> HWP paragraphs/     │
│      tables/formatting                                   │
│                                                          │
│  Native HWP Generation API (Phase 2)                     │
│      create_hwp(), add_paragraph(), add_table()          │
│                                                          │
│  Existing HWP Read/Modify/Save                           │
│      Parse -> Edit -> surgical_update -> Serialize       │
│                                                          │
│  Rendering (SVG / Canvas / HTML)                         │
│      Pagination, table splitting, clipping,              │
│      headers/footers                                     │
│                                                          │
│  WASM Web Editor (rhwp-studio)                           │
│      Caret, text input, formatting toolbar, Ctrl+S save  │
└─────────────────────────────────────────────────────────┘
    │
    ▼
.hwp File Output (Hancom Office compatible)
```

### Complete Cycle: Search -> Analyze -> Generate

Combining both projects enables a complete cycle where AI can **read -> understand -> create** HWP documents.

```
                    ┌─────────────────────────────────┐
                    │         AI Agent (LLM)           │
                    │                                  │
                    │  "Write an analysis report on    │
                    │   current expenditure changes    │
                    │   vs 2024 in HWP format"         │
                    └───────┬─────────────┬────────────┘
                            │             │
                   MCP Tool Call    MCP Tool Call
                            │             │
              ┌─────────────▼──┐    ┌─────▼──────────────┐
              │ hwp_semantic   │    │ rhwp               │
              │ MCP Server     │    │ MCP Server          │
              │                │    │                     │
              │ search_fiscal_ │    │ html_to_hwp()       │
              │ data("current  │    │                     │
              │  expenditure") │    │ -> .hwp file output │
              │ compare_periods│    │                     │
              │ (2023, 2024)   │    │                     │
              └────────────────┘    └─────────────────────┘
```

**Example scenario**:
1. AI searches and compares fiscal data via hwp_semantic MCP (`search_fiscal_data`, `compare_periods`)
2. Composes analysis results as an HTML report (tables, chart descriptions, change rate analysis)
3. Converts HTML to HWP via rhwp MCP (`html_to_hwp`)
4. Final .hwp file output -- can be opened directly in Hancom Office for submission

## Ultimate Goal: AI Agent's HWP Tool

Provide tools for AI Agents to **locally and directly** create/read/modify/save HWP documents.
While the existing HWP ecosystem (Hancom, a commercial web office, a commercial document viewer, etc.) all follows the "humans operate through UI" paradigm,
rhwp is the first to realize the **"AI operates through code"** paradigm.

### Two Delivery Paths

```
Path 1: Direct Library Calls (Phase 1)        Path 2: MCP Server (Phase 2)

[Python/Node.js script]                       [Claude Code / Cowork]
    │                                              │
    │  import rhwp                                 │  MCP Tool Call (JSON-RPC)
    │  rhwp.html_to_hwp(html, path)                ▼
    │  rhwp.hwp_to_pdf(hwp, path)              ┌─────────────────────────┐
    ▼                                          │ rhwp MCP Server         │
  .hwp / .pdf file output                      │                         │
                                               │ html_to_hwp()           │
                                               │ hwp_to_pdf()            │
                                               │ create_hwp()            │
                                               │ read_hwp()              │
                                               │ modify_hwp()            │
                                               │ merge_hwp()             │
                                               └─────────────────────────┘
                                                   │
                                                   ▼
                                                 .hwp / .pdf file output
```

**Path 1 (Library)**: Install via `pip install rhwp` or `npm install rhwp` and generate HWP
with a single `html_to_hwp()` call from existing scripts/skills. Minimal integration cost.

**Path 2 (MCP Server)**: AI Agent performs advanced document operations such as read/modify/template filling.
Direct integration with Claude Code/Cowork via MCP protocol (JSON-RPC over stdio).

### Differentiation from Existing Ecosystem

| | Existing HWP ecosystem | rhwp |
|---|---|---|
| **User** | Humans (UI click/typing) | AI Agents (function calls) |
| **Approach** | Web editor, viewer, conversion server | Library/MCP server |
| **Server dependency** | Required (SaaS/cloud) | None (local processing) |
| **HWP generation API** | Not provided | Core feature |
| **AI integration** | Requires custom development | Immediate via MCP/skill docs |

### Usage Scenarios

1. **Report generation**: "Generate a quarterly sales report in HWP"
2. **Official document drafting**: "Write a travel request form in HWP following the standard template"
3. **Document conversion**: "Convert this Markdown report to HWP"
4. **Existing document modification**: "Add data to the table on page 3 of this HWP file"
5. **Batch processing**: "Extract text from all HWP files in this folder"
6. **Fiscal data analysis report**: "Write a 2023 vs 2024 expenditure analysis report in HWP" *(hwp_semantic integration)*

### HWP Generation Two-Phase Strategy

#### Phase 1: HTML -> HWP Conversion (Fast Market Entry)

AI models are already proficient at HTML output. They naturally generate tables, headings, and formatting.
Simply converting this HTML to HWP delivers immediate value.

```
AI Agent ──▶ HTML generation ──▶ rhwp html_to_hwp() ──▶ .hwp output

Supported tags:
  h1~h6  -> HWP outline levels (paragraph style)
  p      -> HWP normal paragraph
  table  -> HWP table (cell merge, borders, background color)
  strong -> HWP bold (character style)
  em     -> HWP italic (character style)
  ul/ol  -> HWP bullet/numbered lists
  img    -> HWP image insertion (BinData)
```

**Advantage**: No AI model modifications needed; add one line to existing html_to_pdf() workflow for HWP output.

#### Phase 2: Native HWP Generation API (High Quality)

Bypasses the HTML intermediate step to directly control HWP-native formatting.

```
AI Agent ──▶ rhwp Structured API ──▶ .hwp output

API:
  create_hwp()                      Create empty document
  add_paragraph(text, style)        Add paragraph (outline level, char/para shape)
  add_table(rows, cols, data)       Add table (cell merge, HWPUNIT size control)
  set_page_def(paper, margins)      Paper settings (A4, B5, margins)
  add_header_footer(text, pos)      Header/Footer
  add_page_number(format, pos)      Page number (Arabic/Roman/circled)
  save(path)                        HWP binary serialization
```

**Advantage**: HWPUNIT-based precise margins, direct control of ParaShape/CharShape, HWP-native features like headers/footers/page numbers.

#### Phase-by-Phase Value Comparison

| | Phase 1 (HTML->HWP) | Phase 2 (Native) |
|---|---|---|
| **Implementation difficulty** | Medium (HTML parsing + mapping) | High (full document model construction) |
| **Market entry speed** | Fast (leverages existing HTML workflow) | Slow (API design/documentation needed) |
| **Formatting precision** | HTML level (limited) | HWP native level (complete) |
| **AI integration cost** | Minimal (one line addition) | Medium (new API learning required) |
| **Existing asset utilization** | pasteHtml pipeline extension | Full parsing/serialization engine |

### Template-Based Document Automation

Automated document generation using standardized HWP templates from government/enterprise.

**Workflow**:
```
1. Register institution template (.hwp)
   e.g.: Draft documents, travel requests, meeting minutes,
         work reports, approval forms, official letters

2. AI Agent analyzes template structure via read_hwp()
   -> Interpret table positions, input fields, document structure

3. Auto-fill content based on user instructions
   "Write a travel request. Date: 2/15-17, Destination: Busan,
    Purpose: On-site inspection"
   -> Insert text/edit table cells at corresponding positions via modify_hwp()

4. Save completed HWP -> ready for immediate submission
```

**Comparison with existing workflow**:
```
Human:  Launch Hancom Office -> Open form file -> Manual typing -> Save -> Submit for approval
AI:     "Write a travel request" -> Auto-completed HWP output -> Submit for approval
```

**Advantages of template approach**:
- Institution-specific formatting (letterhead, official seal, document number system) is preserved as-is
- Having AI fill existing forms is far more accurate than creating new documents
- Implementable with the already-verified read -> modify -> save pipeline

### Template Manifest (Prompt-Based Precise Control)

Each template comes with a **usage prompt** so the AI can input data at the correct location in the correct format without analyzing the document structure.

```yaml
# templates/travel_request.yaml
name: Travel Request
file: travel_request.hwp
fields:
  - name: Name
    location: { table: 0, row: 0, col: 1 }
    type: text
  - name: Travel Period
    location: { table: 0, row: 1, col: 1 }
    type: date_range
    format: "yyyy.mm.dd ~ yyyy.mm.dd"
  - name: Destination
    location: { table: 0, row: 2, col: 1 }
    type: text
  - name: Purpose
    location: { table: 0, row: 3, col: 1, colspan: 6 }
    type: multiline
prompt: |
  Fill out a travel request form.
  Populate each field with user-provided information,
  and write the travel purpose in formal document tone.
  Dates must be in yyyy.mm.dd format, amounts with thousands separators.
```

**Role of manifests**:
- AI can insert data directly at correct cell positions without `read_hwp()`
- Specifying data format (date, amount, tone) ensures consistent quality
- Template creator's intent is communicated directly to the AI
- Enables building institution-specific template libraries

## Technical Architecture

### webhwp (Hancom) vs rhwp Comparison

| | webhwp (Hancom) | rhwp |
|---|---|---|
| **Parsing** | Server | Rust native / WASM |
| **Serialization** | Server (`/handler/convert/`) | Rust native |
| **Edit sync** | OT engine (WebSocket) | Local processing |
| **Rendering** | Canvas (nwr bridge) | SVG / Canvas (WASM) |
| **Server dependency** | Required (session/memory occupation) | None |
| **Deployment** | Cloud SaaS | Local binary / MCP server |
| **Cost** | Server cost proportional to user count | 0 (only static hosting needed) |

### The Fundamental Difference as an AI Agent Tool

webhwp is an OT architecture designed for **real-time human collaborative editing**.
It is fundamentally mismatched with the scenario of AI Agents generating documents.

**For AI to create a document with webhwp**:
```
Create session -> WebSocket connection -> Load document model into memory ->
  Send text insertion Operation -> OT conflict resolution (unnecessary) ->
    Send formatting Operation -> OT conflict resolution (unnecessary) ->
      ... (dozens of network round-trips) ...
        Request serialization -> Server conversion -> Binary download -> Release session
```

**For AI to create a document with rhwp**:
```
rhwp.html_to_hwp(html, "output.hwp")  # Done. One local function call.
```

| Comparison | webhwp (Hancom) | rhwp |
|-----------|-------------|------|
| **AI call method** | WebSocket session + multiple Operations | Single function call |
| **Network round-trips** | Dozens per document | 0 |
| **OT engine** | Required (runs even when AI works alone) | None (unnecessary) |
| **Server memory** | Session occupied per document | 0 (local processing) |
| **Concurrent generation limit** | Proportional to server capacity | Unlimited (each client independent) |
| **Hancom's AI response** | Must develop new OT bypass path | Design purpose is already AI-oriented |

**Structural limitation of OT -- No batch editing**:

OT is a sequential processing structure where each Operation depends on the result of the previous one.
Even if multiple edits are sent at once, the server must perform OT transformation one by one sequentially.

```
webhwp: Op1 -> OT transform -> update -> Op2 -> OT transform -> update -> ... -> OpN -> serialize
rhwp:   edit1, edit2, ... editN (direct memory manipulation) -> 1 serialization
```

If Hancom wanted to build a headless service for AI Agents, they would need to bypass OT entirely
and develop a "batch mode" that directly manipulates the document model in the C/C++ engine.
This is a fundamental change to the webhwp architecture -- essentially redoing the same work as rhwp from scratch.

**rhwp was designed from the start with the goal of "AI creates HWP with a single function call."**

### Structural Advantages of rhwp

1. **Zero server cost**: All processing completed client-side/locally
2. **Offline operation**: Full functionality without network
3. **Rust native**: Can be built directly as MCP server, fast and reliable
4. **WASM support**: Usable in browser-based AI tools
5. **Single binary deployment**: Simple installation/operation

## POC Completion Status (as of February 14, 2026)

### rhwp -- Core Pipeline: Read -> Render -> Modify -> Save

| Feature | Status | Details |
|------|------|-----------|
| **HWP Reading** | Complete | OLE Compound File parsing, full DocInfo/BodyText/BinData interpretation |
| **HWP Modification** | Complete | Text insert/delete, formatting changes, table cell editing |
| **HWP Saving** | Complete | Serialize modified documents to HWP binary, verified opening in Hancom Office |
| **SVG Rendering** | Complete | Text, tables, images, shapes, text boxes |
| **Pagination** | Complete | Multi-column/multi-section, table page splitting (intra-row), body clipping (clipPath) |
| **Header/Footer** | Complete | Both/Even/Odd distinction, footer with tables, page numbers (Arabic/Roman/circled) |
| **Auto-numbering** | Complete | NewNumber counter reset, decoration characters, DocProperties start number |
| **WASM Build** | Complete | Browser operation verified |
| **Web Editor** | Complete | Caret, text input/delete, formatting toolbar, text box editing |
| **Web Fonts** | Complete | 7 language category fonts/letter spacing/horizontal scaling, async 2-stage loading |
| **HTML->HWP Table Conversion** | Complete | OLE 2.0 clipboard pasteHtml -> HWP table structure conversion + save |

### hwp_semantic -- Semantic Parsing/Search Pipeline

| Feature | Status | Details |
|------|------|-----------|
| **HWP/HWPX Parsing** | Complete | Full support for HWP 5.0+ binary, HWPX (OOXML) |
| **Semantic Table Linking** | Complete | Auto-link captions/descriptions/units, cell merge/nested tables |
| **Equation LaTeX Conversion** | Complete | 200+ command mappings (fractions, integrals, matrices, Greek letters) |
| **Chart Analysis** | Complete | Data extraction, Mermaid diagram conversion |
| **Distribution Document Decryption** | Complete | AES-128 ECB (ViewText) |
| **Vector Store** | Complete | PostgreSQL + pgvector, 3-Level chunking (Table->Row->Cell), BGE-M3 1024dim |
| **MCP Server** | Complete | 11 Tools, hybrid search (RRF), Pivot Query, context window |
| **BatchLoader** | Complete | Docker one-click, dynamic domain detection, image pHash deduplication |
| **Numbering Interpretation** | Complete | Raw IR, NumberingResolver, outline number AST interpretation |

### AI Agent HWP Generation -- Foundation Technology Secured

**Input (Break)**: hwp_semantic decomposes HWP into semantic structures for AI.
182 consolidated fiscal statistics documents, 5,500+ row chunks, 11,600+ cells vectorized,
enabling real-time search and comparison via MCP from Claude Desktop.

**Output (Forge)**: rhwp's pipeline for converting HTML tables to HWP tables and saving as .hwp is operational.
AI agents can write professional reports based on RAG in HTML, then
**directly generate HWP reports through rhwp MCP tools**.

```
hwp_semantic MCP ──▶ AI Analysis/Generation ──▶ rhwp html_to_hwp() ──▶ .hwp output
(Fiscal data search)    (Report writing)          (HWP conversion/save)
```

### Verification Metrics

| Item | rhwp | hwp_semantic |
|------|------|--------------|
| **Unit tests** | 488 passed | All passed |
| **Build** | Rust + WASM + Vite success | Python, Docker success |
| **Round-trip verification** | Read->Modify->Save->Re-read success | Parse->Chunk->Embed->Search success |
| **External compatibility** | Normal display in Hancom Office | Claude Desktop MCP integration verified |
| **Operational data** | - | 182 documents, 5,500+ chunks, 11,600+ cells |

## Productization Roadmap

### Schedule Overview

```
Dec 2025 ── hwp_semantic v0.1.0 release (semantic parsing, MCP server)
     │
Jan 2026 ─── hwp_semantic v0.2~0.3 (HWPX, Vector Store, BatchLoader, numbering)
     │
Feb 2026 ─── Current: rhwp core engine complete + hwp_semantic MCP v2.3 operational
     │          (Read/Modify/Save/Render/Pagination/Header-Footer/Auto-numbering)
     │
     ├── Mid-Feb~Mar: HWP generation Phase 1 (HTML->HWP conversion, HWP->PDF, PyPI)
     │
     ├── Mar~Apr: HWP generation Phase 2 (Native API, rhwp MCP server)
     │
End Apr 2026 ── Project completion: Phase 1 + Phase 2 deployable
     │
     ├── May~: Initial user acquisition, feedback collection
     │
Aug 2026 ──── AI Agent document generation market fully forms
```

**Completion target: End of April 2026**

Since core features of both projects are complete, remaining work is:
- **Phase 1**: HTML->HWP conversion engine, HWP->PDF conversion, PyO3 Python bindings, PyPI deployment
- **Phase 2**: Native HWP generation API, rhwp MCP server, template manifest

### 6-Month Market Forecast (March-August 2026)

Following SaaSpocalypse, the AI Agent market is expected to undergo rapid restructuring:

| Timing | Expected Change | Impact on rhwp |
|------|----------|------------------|
| Mar-Apr | AI Agent tool ecosystem rapid growth, MCP server standardization accelerates | Direct increase in MCP server demand |
| Apr-May | SaaS companies announce AI response strategies (billing model transition attempts) | Hancom also pressured to respond, but limited by OT architecture for fast transition |
| May-Jun | AI Agent-based business automation proof cases proliferate | HWP auto-generation demand materializes (government PoC) |
| Jul-Aug | Seat-based to task-based billing transition accelerates | rhwp already task-based (1 function call = 1 document), first-mover advantage |

**Key judgment**: In 6 months, "AI creates documents" transitions from experiment to **routine**.
Completing the product by end of March allows capturing the early market during this transition.

### Phase 1: Minimum Viable Product (PyPI + Skill Doc Extension) -- Target: Mid-March

The fastest path to deliver value. Leverages existing Claude skill infrastructure as-is.

| Step | Work | Description |
|------|------|------|
| 1 | HTML -> HWP conversion core | Map HTML tags to HWP paragraphs/tables/formatting |
| 2 | HWP -> PDF conversion (hwp2pdf) | Existing SVG rendering -> PDF conversion pipeline |
| 3 | PyO3 Python bindings | `rhwp.html_to_hwp()`, `rhwp.hwp_to_pdf()` API |
| 4 | PyPI package deployment | `pip install rhwp` |
| 5 | Extend existing skill docs | Add one section: "Use `rhwp.html_to_hwp()` when HWP output is needed" |

**hwp2pdf conversion pipeline**:
```
HWP file -> rhwp parsing -> page layout -> SVG rendering -> PDF conversion
                            (already done)  (already done)   (new)
```
Since the existing SVG rendering engine is complete, only the SVG -> PDF conversion step needs to be added.
This feature is valuable on its own: a CLI/library for converting HWP to PDF without Hancom Office.

**Result**: AI Agent performs both HWP generation and PDF conversion locally
```
Existing skill docs:
  "Generate report as HTML -> convert to PDF with html_to_pdf()"
Extension:
  "When Korean HWP format needed -> convert with rhwp.html_to_hwp()"
  "When HWP -> PDF needed -> convert with rhwp.hwp_to_pdf()"
```

### Phase 2: MCP Server (Advanced Features) -- Target: End of March

For scenarios requiring advanced document operations like read/modify/templates.

| Step | Work | Description |
|------|------|------|
| 1 | CLI/Library API refinement | Design public APIs: create, read, modify, convert |
| 2 | Empty document creation | Create new HWP documents from code without templates |
| 3 | MCP protocol integration | JSON-RPC over stdio, tool definitions |
| 4 | Template-based document generation | Government/report forms + manifest support |

## Distribution Strategy

### 1. MCP Server (Native Binary)

Primary distribution form for direct integration with AI Agents (Claude Code, Cowork, etc.).

```
Claude Code / Cowork
    │  MCP (JSON-RPC over stdio)
    ▼
rhwp-mcp (single binary)
    │
    ▼
  .hwp file output
```

### 2. PyPI Package (Python Bindings)

Built using **PyO3** to create Python bindings from Rust code, installed via `pip install rhwp`.

```python
import rhwp

# HTML -> HWP conversion (same pattern as existing html_to_pdf())
rhwp.html_to_hwp("<h1>Report</h1><p>Content...</p>", "report.hwp")

# Structured data -> HWP generation
doc = rhwp.create()
doc.add_paragraph("Title", style="heading1")
doc.add_table(data, headers=["Item", "Amount"])
doc.save("output.hwp")

# Read/modify existing HWP
doc = rhwp.open("existing.hwp")
text = doc.extract_text()
doc.save("modified.hwp")
```

**Integration with existing Claude skills**:
```
Current:  Data -> HTML generation -> html_to_pdf()  -> PDF file
Addition: Data -> HTML generation -> html_to_hwp() -> HWP file
```

### 3. npm Package (WASM)

WASM package for Node.js and browser environments, installed via `npm install rhwp`.

```javascript
import { htmlToHwp, createHwp } from 'rhwp';

// HTML -> HWP conversion
const hwpBuffer = await htmlToHwp('<h1>Report</h1>');
fs.writeFileSync('report.hwp', hwpBuffer);
```

### 4. Rust Crate

Direct use of the Rust ecosystem, add dependency via `cargo add rhwp`.

### Usage Scenarios by Distribution Form

| Distribution Form | Target Users | Usage Scenario |
|-----------|------------|--------------|
| MCP Server | AI Agent users | Auto-generate HWP documents from Claude Code/Cowork |
| PyPI | Python developers | HWP generation in scripts/automation, Claude skill integration |
| npm | Web developers | HWP processing in browser/Node.js |
| Crate | Rust developers | HWP generation in servers/CLI tools |

## Market Opportunity

- **Claude Cowork launch** (February 2026): Explosion of public AI document generation demand
- **Korean government/enterprise market**: Continued mandatory HWP requirements
- **No competing products**: No local HWP generation tool for AI Agents exists
- **hwp_semantic + rhwp**: A rare ecosystem that covers both HWP reading (semantic parsing) and writing (native generation)
- **Government air-gap readiness**: hwp_semantic's local embedding + rhwp's zero server dependency -> fully offline operation

### SaaSpocalypse -- SaaS Stock Crash Triggered by AI Agents (February 2026)

On February 3, 2026, Anthropic unveiled the business automation tool **Claude Cowork**,
causing SaaS software company stocks to plummet in unison. The market named this **"SaaSpocalypse"**.

**Market shock magnitude**:

| Indicator | Figure |
|------|------|
| NASDAQ Composite | -1.43% |
| S&P 500 | -0.84% |
| Software & Services sector | -3.8% |
| IGV Software ETF | -4.59% (1 day) |
| Software market cap loss | ~$300B in a single trading day, ~$1T over 7 trading days |

**Individual company stock declines** (YTD 2026):

| Company | Decline | Sector |
|------|--------|------|
| Figma | -40% | Design collaboration |
| HubSpot | -39% | Marketing/CRM |
| Atlassian | -35% | Project management |
| Intuit | -34% (1-day -11%) | Finance/Tax |
| Shopify | -29% | E-commerce |
| ServiceNow | -28% (1-day -7%) | IT service management |
| Salesforce | -26% (1-day -7%) | CRM |
| Box | -17% | Cloud storage |
| Thomson Reuters | -16% (1 day) | Legal/Financial information |

**The essence of the crash -- Collapse of the "seat-based billing model"**:

The growth formula for SaaS companies was **"hiring growth = license sales growth"**.
When AI agents automate tasks, companies can handle the same work with fewer people,
structurally reducing software seat demand.

```
Old formula:  100 employees -> buy 100 SaaS seats -> revenue growth
AI era:       30 employees + AI Agents -> 30 SaaS seats -> 70% revenue decline
```

This is exactly the same structure as Hancom's dilemma:
- Hancom Office licenses: **user count x price** -> if AI creates documents, user count decreases
- webhwp SaaS: **concurrent connections x subscription** -> AI Agents use sessions briefly and release
- Hancom's revenue is proportional to **"how often humans use software"**, and when AI replaces humans, that foundation disappears

**rhwp's position**: SaaSpocalypse is the fear that "when AI works instead of humans, software seats decrease."
rhwp is designed the opposite way -- as **"a tool that AI directly uses"**, so AI proliferation directly drives demand growth.

### Hancom's Structural Dilemma -- The Reality SaaSpocalypse Proved

The February 2026 SaaSpocalypse was the market declaring "the end of seat-based billing models."
Hancom is positioned at the epicenter of this structural transition.

**Hancom's triple lock-in structure**:

```
Revenue model -> Architecture -> Billing method -> Lock-in

  Hancom Office licenses -> user count x price -> seat billing
  webhwp SaaS -> concurrent connections x subscription -> session billing
  Non-public API -> must go through Hancom services -> vendor lock-in
```

This structure follows the exact same pattern as the companies that crashed in SaaSpocalypse:

| SaaS Company | Billing Model | AI Era Threat | Hancom Equivalent |
|-----------|----------|-------------|----------|
| Salesforce (-26%) | Per-user CRM seat | AI replaces sales work -> fewer seats | Hancom Office licenses have same structure |
| Atlassian (-35%) | Per-member project management | AI replaces PM work -> fewer seats | webhwp concurrent billing is the same |
| HubSpot (-39%) | Seat-based marketing tool | AI automates marketing -> fewer seats | Fewer document creators -> fewer licenses |

**For Hancom to respond to AI, they must destroy their own revenue**:

| Hancom's AI Response | Impact on Revenue Model | SaaSpocalypse Parallel |
|----------------|----------------------|----------------------|
| Remove server dependency | SaaS billing basis disappears | Box (-17%): Cloud storage becomes meaningless |
| Open APIs | HWP generation without Hancom Office -> fewer licenses | ServiceNow (-28%): Automation makes seats unnecessary |
| Allow local execution | No server access needed -> subscription model weakens | Intuit (-34%): AI replaces tax work |
| OT bypass batch mode | Requires fundamental webhwp architecture change | Incompatible with existing product |

This is a classic **Innovator's Dilemma**:

```
Protect existing business -> Delay AI response -> Market erosion
Pursue AI response -> Damage existing revenue -> Stock decline (SaaSpocalypse pattern)
```

The market has already rendered its judgment. **~$1T** evaporated from the software sector in just 7 trading days.
"When AI replaces humans, software seats decrease" is no longer a hypothesis but
**market consensus reflected in stock prices**.

**rhwp's structural immunity**:

rhwp is unaffected by SaaSpocalypse. In fact, it is the opposite:

| SaaS Companies | rhwp |
|-----------|------|
| AI proliferation -> seat demand decrease -> revenue decline | AI proliferation -> HWP generation demand increase -> usage increase |
| Billing proportional to user count | Open source, no billing structure |
| Server costs proportional to usage | Local processing, zero server cost |
| Existing architecture hinders AI response | Designed for AI Agents from the start |

**The more AI proliferates, the more valuable rhwp becomes, and the fewer seats Hancom has.**

---

*Originally written: 2026-02-09*
*Distribution strategy added: 2026-02-10*
