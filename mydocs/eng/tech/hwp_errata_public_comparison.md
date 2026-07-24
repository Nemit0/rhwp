# Why Open-Source HWP Writing Is Still Unusable

> Written: 2026-02-23 (Last updated: 2026-03-16)
> Analysis targets: hwplib (Java), pyhwp (Python), openhwp (Rust), python-hwpx (Python), public web resources

---

## Summary

There are two Korean document formats: **HWP 5.0** (binary) and **HWPX** (XML/OPC). The open-source community can **read** both formats, but **writing files that Hancom can open normally** is a fundamentally different problem.

- **HWP binary writing**: Implicit serialization rules exist that are not documented in the public spec, and violating them causes Hancom to reject the file. Even the most advanced hwplib (Java) fails to observe some rules, resulting in **Hancom treating files as "corrupted."**
- **HWPX (XML) writing**: Projects have emerged that bypass the binary barrier via XML, and **python-hwpx** has succeeded in editing and saving. However, **HWPX is exclusive to Hancom 2022+**, and is incompatible with the .hwp files used by the vast majority of government agencies and enterprises.

This document provides an empirical analysis of **why open-source HWP writing is still at an unusable level**, covering the current state of both binary and XML approaches. All existing HWP/HWPX open-source projects have been **developed at the individual level**, and cases where the reverse engineering and systematic verification required for binary writing have been completed are extremely rare.

---

## 1. Open-Source Project Landscape — Bird's Eye View

### 1.1 HWP Binary (.hwp)

| Project | Language | License | Read | Write | Hancom Compatible |
|---------|----------|---------|:----:|:-----:|:-----------------:|
| **hwplib** | Java | Apache 2.0 | Yes | Yes | Warning: **partially corrupted** |
| **pyhwp** | Python | AGPLv3 | Yes | No | — |
| **openhwp** | Rust | MIT | Yes | Yes (code exists) | No: **can't open** |
| **hwp.js** | JS | MIT | Yes | No | — |
| **libhwp** (deleted 2013) | C | GPL | Yes | No | — |

### 1.2 HWPX (XML/OPC, .hwpx)

| Project | Language | License | Read | Write | Hancom Compatible |
|---------|----------|---------|:----:|:-----:|:-----------------:|
| **python-hwpx** | Python | BSD-2 | Yes | Yes | Yes (Hancom 2022+) |
| **openhwp** (hwpx crate) | Rust | MIT | Yes | Yes | Unverified |

> **Having write code** and **producing files that Hancom can open** are entirely different matters.

---

## 2. The Binary Barrier — "Following the Spec Breaks the File"

Hancom's published [HWP 5.0 Document File Structure](https://www.hancom.com/etc/hwpDownload.do) provides **record structures and field listings**. However, this spec **omits** the following:

### 2.1 Undocumented Serialization Rules

| Rule | Spec Description | Actual Behavior | Result When Violated |
|------|-----------------|-----------------|---------------------|
| `char_count` MSB | "Character count" (Table 60) | Last paragraph in a list must have `char_count \| 0x80000000` | **File structure recognition failure** |
| Empty paragraph `PARA_TEXT` | Not mentioned | When `char_count=1`, `PARA_TEXT` record must be omitted | **Record parsing offset misalignment** |
| `control_mask` recalculation | "Control mask" (Table 60) | Must be dynamically recalculated from controls within the paragraph on save | **Controls (tables/images) not recognized** |
| `control_mask` inline bits | "Control mask" (Table 60) | Must include inline control characters like TAB (bit 9), FIELD_END (bit 4), LINE_BREAK (bit 10) | **Hancom 2010 abnormal termination** |
| FIELD_BEGIN/END ordering | Not mentioned | FIELD_END immediately after FIELD_BEGIN; trailing END placed right after the corresponding control | **Field range recognition failure** |
| TAB extended data | "Size=8" (Table 62) | Original 7-code-unit data for TAB must be preserved | **Tab spacing errors** |
| Field CTRL_HEADER `memo_index` | Documented only up to field_id (Table 154) | 4 bytes after field_id (MemoShape reference) are required | **Click-here guide text shows empty string** |

### 2.2 Undocumented Required Fields

| Field | Location | Spec Description | Reality |
|-------|----------|-----------------|---------|
| `prevent_page_break` | End of `CommonObjAttr` | None | 4 bytes required — omission shifts subsequent fields |
| fill alpha byte | End of `FillInfo` | None | Fill transparency — omission causes color errors |
| `shadowInfo` | Inside `ShapeComponent` | None | Shadow structure — omission causes parsing failure of subsequent data |
| `memo_index` | End of field CTRL_HEADER | None | 4-byte MemoShape reference — omission causes field recognition failure |

### 2.3 Undocumented Record Structures

| Structure | Spec Description | Reality |
|-----------|-----------------|---------|
| `ShapeComponent` on image insertion | `" gso"` → `ShapeComponentPicture` | `" gso"` → **`ShapeComponent`(ctrl_id=`"$pic"`)** → `ShapeComponentPicture` |
| Extended control character size | "8 size" (ambiguous: WCHAR or byte) | **8 WCHAR = 16 bytes** |

---

## 3. Empirical Evidence: Why openhwp Fails

openhwp includes an HWP writer written in Rust, but the generated files cannot be opened in Hancom. Analysis of `body_writer.rs` (1,955 lines) reveals it was **written relying solely on the public spec**, with none of the implicit rules applied.

### Discovered Defects

```
 Critical ──────────────────────────────────────────────

 [Section 5 violation] char_count MSB missing
   > body_writer.rs:1817  →  text.len() + 1 (no 0x80000000 OR)
   > Hancom cannot recognize paragraph list boundaries

 [Section 7 violation] control_mask always 0
   > body_writer.rs:1012  →  write_u32(0)
   > Hancom ignores table/image controls even when present

 Severe ────────────────────────────────────────────────

 [Section 15 violation] ShapeComponent intermediate record missing
   > body_writer.rs:1164  →  ShapeComponentPicture written immediately after ctrl_header
   > Missing ShapeComponent(ctrl_id="$pic") record that Hancom expects

 [Section 17 violation] shadowInfo not written
   > Shadow info structure missing from ShapeComponent
   > All subsequent data byte offsets are misaligned

 [Section 13 violation] prevent_page_break hardcoded
   > body_writer.rs:1100  →  write_u32(0)
```

### Root Cause

openhwp's writer was written **referencing only the public spec (L1)**. It wrote all spec-documented fields in order without omission, but because **rules not documented in the spec** were not applied, Hancom rejects the files.

This is not an issue of openhwp's code quality. It is a problem of **structural incompleteness of the public spec**.

---

## 4. The HWPX Bypass Strategy — Abandoning Binary for XML

Unable to overcome the binary barrier, the open-source community adopted the strategy of **bypassing to HWPX (XML-based)**. The prime example is **python-hwpx**.

### 4.1 python-hwpx's Approach

| Item | Detail |
|------|--------|
| **Format** | HWPX (KS X 6101:2024, OPC/ZIP + XML) |
| **Strategy** | Edit the XML tree based on a Skeleton.hwpx template created by Hancom, then repackage as ZIP |
| **Tech stack** | Python + lxml, dataclass-based body model |
| **Distribution** | PyPI (`pip install python-hwpx`) |

### 4.2 Why Writing Is Possible with HWPX

How HWPX fundamentally differs from binary HWP:

| | HWP 5.0 (Binary) | HWPX (XML) |
|---|---|---|
| **Data format** | CFB container + zlib compression + binary records | ZIP + plain XML |
| **Field separation** | Fixed byte offsets — **a single misaligned byte corrupts the entire file** | XML tags/attributes — order-independent, defaults applied on omission |
| **Serialization rules** | Implicit (Sections 5-17) — not documented | Explicitly defined via XML Schema (XSD) |
| **Tolerance** | Strict — byte-level precision required | Lenient — Hancom auto-recovers missing elements |

Thanks to this tolerance, python-hwpx can edit and save at the level of **paragraphs, tables, memos, and headers/footers**.

### 4.3 HWPX's Limitations Despite This

Why python-hwpx, despite being a successful project, **cannot replace .hwp binary**:

1. **Compatibility range limited to Hancom 2022 and later**
   - Most existing documents in government agencies and enterprises are .hwp (binary)
   - Hancom 2020 and earlier versions cannot open .hwpx files
   - The reality is that "please send it as .hwpx" does not yet work

2. **Incomplete complex object support**
   - README states: *"add_shape()/add_control() do not generate all sub-elements required by Hancom, so please verify complex objects by opening in the editor"*
   - Insertion of images, shapes, equations, etc. remains incomplete

3. **Cannot edit existing .hwp files**
   - python-hwpx handles .hwpx only — .hwp → .hwpx conversion requires the Hancom program
   - Ultimately, **programmatic editing and saving of .hwp files** is impossible without binary writing

---

## 5. Even hwplib Produces "Corrupted Files"

hwplib (Java) discovered and implemented some implicit rules through reverse engineering:

| Rule | hwplib Implementation | Source Location |
|------|----------------------|-----------------|
| `char_count` MSB | `lastInList` boolean field + writer autosetter | `ForParagraph.java`, `ForParaHeader.java` |
| `control_mask` recalculation | Dedicated `ControlMask` class | `ParaHeader.java` |
| `shadowInfo` parsing/writing | `ShadowInfo` class + reader/writer | `ShapeComponentNormal.java`, `ForShapeComponent*.java` |

However, serialization rules that hwplib still does not observe remain. Unimplemented L3 rules primarily relate to **complex controls like tables, images, shapes, and fills**, so reading and partially editing simple text-oriented documents before saving may work. However, **creating or editing documents containing complex controls results in Hancom treating them as "corrupted files."**

Rules not implemented in hwplib:

| Unimplemented Rule | Result |
|-------------------|--------|
| Section 6: Empty paragraph `PARA_TEXT` omission | Record offset misalignment |
| Section 8: Fill alpha byte | Color data corruption |
| Section 13: `prevent_page_break` field | Fields after CommonObjAttr shift |
| Section 14: `attr` bit 15-19 size basis | Extended control size miscalculation |
| Section 15: `ShapeComponent` ctrl_id `"$pic"` | Image record structure mismatch |

hwplib's Click-here (form field) limitations:

| Item | hwplib | rhwp |
|------|--------|------|
| command string round-trip | Yes: read/write preserved | Yes |
| command internal parsing (Direction/HelpState/Name) | No: not implemented | Yes: `guide_text()`, `memo_text()`, `field_name()` |
| Click-here guide text/memo/name editing | No: not possible | Yes: `build_clickhere_command()` + CTRL_DATA name |
| properties bit 15 initial state handling | No: not implemented | Yes: normalized on document load |
| FIELD_BEGIN/END serialization order | Unverified (no such logic in writer) | Yes: trailing END interleaving |
| control_mask inline bits (TAB/FIELD_END) | No: only extended controls calculated | Yes: all control characters included |

### 5.1 Notable Observation — The Gap Between Capability and Results

Examining hwplib's actual project scale reveals that the incomplete writing is unrelated to capability:

| Item | Fact |
|------|------|
| **Development period** | First commit 2016.12.23 to present (2026.02), **10-year project** |
| **GitHub metrics** | 568 Stars, 181 Forks, 27 Watchers — overwhelmingly #1 among HWP open-source projects |
| **Commercialization** | README states: *"A commercial product based on this library has been developed and is being sold"* |
| **Paid technical support** | *"For technical support requests or maintenance contracts that may require significant time, please contact me via email"* |
| **Writer code scale** | **85 Java files** — a complete writer architecture symmetric with the reader |
| **Autosetter implementation** | `autosetter/` package with auto-setting logic for `lastInList`, `ControlMask`, `InstanceID`, etc. |
| **Control writer coverage** | Writer files exist for **nearly all controls**: Table, Equation, Footnote, Endnote, Header, Footer, Field, Bookmark, ColumnDefine, various GSO controls, etc. |
| **Writing documentation** | **None** — no explanation even in code comments about why `lastInList` is needed or the reason for `ControlMask` recalculation |

A project that has been developed for 10 years, serves as the foundation for a commercial product, has 85 writer files, and implements autosetters does not reflect Section 6, 8, 13-15 serialization rules in its public source. The README explicitly lists writing as a feature: **"Save created objects to file: Rewriting_HWPFile, SimpleEditing_HWPFile."**

Additionally, the `sample_hwp/basic/` folder contains **27 reference HWP files for different control types** (tables, images, equations, footnotes/endnotes, text boxes, polygons, lines-rectangles-ovals, charts, OLE, arcs-curves, etc.), and `Rewriting_HWPFile.java` performs **regression tests that read and re-save all 27 files** via `HWPReader.fromFile()` → `HWPWriter.toFile()`.

### 5.2 Decisive Evidence — The hwp2hwpx Converter

Analyzing [hwp2hwpx](https://github.com/neolord0/hwp2hwpx) (HWP→HWPX converter), operated by the same developer, confirms that **this developer knows the L3 rules but has not made them public**:

| Errata Rule | hwplib reader | hwp2hwpx converter | hwplib writer (public) |
|-------------|:---:|:---:|:---:|
| **Section 17: ShadowInfo** | Yes: parsed | Yes: converted to HWPX `<shadow>` (all 12 GSO controls) | No: not reflected |
| **Section 13: prevent_page_break** | Yes: `isPreventPageDivide()` | Yes: converted to `holdAnchorAndSO` XML attribute | No: not reflected |
| **Section 15: ShapeComponent + Picture** | Yes: `ShapeComponentPicture` parsed | Yes: `ForPicture extends ForShapeComponent` structure | No: not reflected |
| **Section 8: alpha** | Yes: parsed | Partial: some `// todo : alpha ??` comments | No: not reflected |

**Fields that are correctly parsed in the reader and accurately mapped to HWPX in the converter are not serialized in the writer.** Notably, a PR was processed as recently as January 2026 for *"resolving error when hwp's ShadowInfo object is null,"* meaning this developer is **actively aware** of these rules.

A developer who has maintained 85 writer files and autosetters for 10 years could not possibly have never tried opening output files in Hancom. And **serializing with the currently public hwplib code immediately results in Hancom's "file is corrupted" error.** Since it's impossible to be unaware of this problem after 10 years:

1. ~~The L3 rules are that hard to discover~~ — Since the corresponding fields are handled in the reader and converter, ignorance is not the explanation
2. **Core writing rules are not reflected in the public source** — They have likely been resolved on the commercial product side, but the complete writing code has not been committed to the public repository

The hwplib case reconfirms that **public source code alone cannot achieve Hancom-compatible HWP writing**.

In other words, **even hwplib, the most advanced in the open-source community, fails at Hancom-compatible writing based on its public source.** If openhwp was blocked at L1 (public spec), hwplib reached L2 (reverse engineering) but **did not publish its L3 (independently discovered rules) code**.

---

## 6. Why There Is No HWP Writing Information on the Public Web

Web search results reveal **absolutely no blogs, forum posts, or technical documents** covering the detailed serialization rules of HWP binary writing. This is not coincidental:

1. **The 2013 libghwp incident**: An HWP reverse engineering open-source developer suffered code theft and **deleted 3 years of source code and analysis materials** (ZDNet, 2013.12.12)
2. **Extremely few projects reach the writing stage**: Implementation difficulty is high even for reading alone, and most projects stall at the parser stage
3. **Non-sharing of reverse engineering knowledge**: Even projects like hwplib that have achieved writing only publish code and **do not document the rules themselves**
4. **Preference for HWPX bypass**: Developers hitting the binary barrier migrate to .hwpx, causing .hwp writing research itself to stagnate

---

## 7. Structural Barriers — Why Individual Projects Struggle

All existing HWP/HWPX open-source projects were created at the **individual developer level**. No enterprise or organization-level projects exist. This is not coincidental but due to the following structural barriers.

### 7.1 The Necessity of Reverse Engineering

It has already been empirically demonstrated that Hancom-compatible writing is impossible with the public spec (L1) alone (Section 3: openhwp, Section 5: hwplib). The remaining rules must be **inferred in reverse by analyzing actual .hwp files created by Hancom at the binary level**.

This process involves:
- **Byte-by-byte tracing** of internal rules that Hancom has not published
- **Experimentally determining which is correct** when the spec and actual binary disagree
- **Discovering the very existence** of fields not even mentioned in the spec

### 7.2 Serialization Testing for All Controls

HWP 5.0 supports **50+ types of controls** (tables, images, equations, shapes, footnotes, endnotes, headers, footers, hyperlinks, bookmarks, OLE, charts, video, etc.). Each control has a unique serialization structure, and a single error corrupts the entire file.

To achieve Hancom-compatible writing:

| Step | Task | Difficulty |
|------|------|-----------|
| 1 | Create **reference .hwp files** per control type (manually authored in Hancom) | Manual |
| 2 | **Analyze the reference file binaries byte-by-byte** | Reverse engineering |
| 3 | **Implement serialization code** from analysis results | Implementation |
| 4 | **1:1 comparison** by opening files written with the implementation in Hancom | Verification |
| 5 | **Maintain regression test cases** for all controls | Ongoing operation |

These 5 steps must be performed for **50+ control types x option combinations for each control**. Modifying one control's serialization can affect others, so **stability cannot be guaranteed without regression tests**.

### 7.3 Why Progress Stalls at the Individual Level

| Barrier | Description |
|---------|-------------|
| **Time** | One person performing the reverse engineering, implementation, and verification cycle for 50+ controls |
| **Tools** | Hancom program (paid) + hex editor + automated test environment |
| **Knowledge** | Binary reverse engineering, CFB containers, zlib compression, byte offset calculation — **a tech stack alien to typical app development** |
| **Motivation** | No commercial revenue model — reading demand is already met since Hancom provides a free viewer |
| **Risk** | Potential for code theft as in the libghwp incident (2013) |

Ultimately, HWP binary writing requires **an engineering effort on a completely different level from implementing a read parser**, and this is the fundamental reason why writing has remained unsolved in the open-source community for over 10 years.

---

## 8. The Big Picture — Why "Writable" Status Has Not Been Achieved

```
             ┌─────────────────────────────────┐
             │       Hancom Ecosystem           │
             ├─────────────────────────────────┤
             │  .hwp (binary)    .hwpx (XML)   │
             │  ^ 90%+ share     ^ new docs     │
             └──────┬──────────────────┬───────┘
                    │                  │
        ┌───────────┴────────┐    ┌───┴──────────────┐
        │  Binary writing     │    │  XML writing      │
        │                    │    │                   │
        │  FAIL openhwp      │    │  OK python-hwpx   │
        │     (L1 spec only→ │    │     (XML edit→OK)  │
        │      file corrupt) │    │                   │
        │                    │    │  Limitations:     │
        │  WARN hwplib(Java) │    │  - 2022+ only     │
        │     (L2 reverse    │    │  - Can't edit .hwp│
        │      eng. reached→ │    │  - Complex objects│
        │      partial       │    │    unsupported    │
        │      corruption)   │    │                   │
        │                    │    │                   │
        │  OK rhwp(Rust)     │    │                   │
        │     (L3+L4 own     │    │                   │
        │      discoveries   │    │                   │
        │      included)     │    │                   │
        └────────────────────┘    └───────────────────┘
```

### Conclusion

Currently, **rhwp (Rust) is the only** open-source project capable of **programmatically editing existing .hwp files and saving them so Hancom can open them normally**.

- **HWPX approach (python-hwpx)**: Writing is possible thanks to XML's tolerance, but cannot process .hwp + limited to Hancom 2022+
- **Binary reverse engineering (hwplib)**: Reached L2 but fails L3 rules, resulting in "corrupted file." Also lacks parsing/editing of click-here field command internals
- **Binary spec-based (openhwp, etc.)**: Hancom-compatible writing is **fundamentally impossible** with L1 alone

rhwp is among the **rare open-source HWP viewers/editors** (within the scope we have reviewed) that cover both precise rendering (pagination, table splitting, headers/footers) and editor features (text editing, click-here editing, field data binding, image insertion). This is backed by 24 errata items (including 12 independently discovered L3 rules) and 18 troubleshooting records of accumulated reverse engineering knowledge.

---

## 9. Knowledge Hierarchy for HWP Writer Implementation

```
 ┌────────────────────────────────────────────────┐
 │  L4. Real-world Save Know-how                  │  rhwp only
 │      (table paste corruption, save after cell   │  troubleshootings/ 18 items
 │       split, save after click-here edit, etc.)  │
 ├────────────────────────────────────────────────┤
 │  L3. Independently Discovered Rules (12 items)  │  rhwp only
 │      §6 empty paragraph PARA_TEXT prohibition   │  not in hwplib
 │      §8 fill alpha, §13 prevent_page_break     │
 │      §14 attr bit basis, §15 "$pic" ctrl_id    │
 │      §18 memo_index, §19 command internal fmt   │
 │      §20 CTRL_DATA field name, §21 bit15 init  │
 │      §22 control_mask inline bits               │
 │      §23 FIELD_BEGIN/END ordering               │
 │      §24 TAB extended data preservation         │
 ├────────────────────────────────────────────────┤
 │  L2. hwplib Reverse Engineering (3 items)       │  requires code reading
 │      §5 lastInList, §7 controlMask             │  no documentation
 │      §17 shadowInfo                            │
 ├────────────────────────────────────────────────┤
 │  L1. Public Spec (hwp_spec_5.0)                │  accessible to anyone
 │      record structures, field listings, tag IDs │  incomplete
 └────────────────────────────────────────────────┘

 openhwp:     L1 only          → Hancom can't open
 python-hwpx: HWPX bypass      → Can't process .hwp, 2022+ only
 hwplib:      L1+L2            → Hancom: "corrupted file"
 rhwp:        L1+L2+L3+L4      → Full save compatibility (unique)
```
