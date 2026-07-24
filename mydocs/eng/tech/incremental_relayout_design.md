# rhwp Re-typesetting Analysis and Improvement Design for Editing

> 2026-03-28 | Task 397 Follow-up — Precision analysis for natural re-typesetting during editing

---

## 1. Incremental Processing Mechanisms Already Implemented

rhwp already possesses a substantial level of incremental layout mechanisms.

### 1.1 Dirty Flag System

| Mechanism | Location | Role |
|-----------|----------|------|
| `dirty_sections: Vec<bool>` | document.rs | Section-level dirty flags |
| `dirty_paragraphs: Vec<Option<Vec<bool>>>` | document.rs | Paragraph-level dirty bitmaps |
| `mark_section_dirty()` | rendering.rs:566 | Mark only a section as dirty (when composed is unchanged) |
| `mark_paragraph_dirty()` | rendering.rs:573 | Mark a specific paragraph as dirty |
| `mark_all_sections_dirty()` | rendering.rs:634 | Mark everything dirty (initialization, etc.) |

### 1.2 Incremental Recomposition/Measurement

| Mechanism | Location | Role |
|-----------|----------|------|
| `recompose_paragraph()` | rendering.rs:593 | Recompose a single paragraph (not the entire section) |
| `insert_composed_paragraph()` | rendering.rs:602 | Insert new entry on paragraph split |
| `remove_composed_paragraph()` | rendering.rs:617 | Remove entry on paragraph merge |
| `measure_section_selective()` | height_measurer.rs:876 | Re-measure only dirty paragraphs; reuse cache for the rest |

### 1.3 Incremental Pagination

| Mechanism | Location | Role |
|-----------|----------|------|
| `paginate()` dirty section check | rendering.rs:716 | Skip if `dirty_sections[idx]` is false |
| `paginate_if_needed()` | rendering.rs:642 | Defer pagination in batch_mode |
| `batch_mode` | rendering.rs:643 | Paginate only once at the end during bulk edits |

### 1.4 Convergence Loop

| Mechanism | Location | Role |
|-----------|----------|------|
| `para_column_map` comparison | text_editing.rs:57-70 | Detect multi-column rearrangement and iterate |
| Maximum 3 iterations | text_editing.rs:57 | Cascade stabilization |

### 1.5 Table Dirty Marking

| Mechanism | Location | Role |
|-----------|----------|------|
| `table.dirty = true` | table_ops.rs (10+ places) | Mark dirty on table structure changes |
| `reflow_cell_paragraph()` | table_ops.rs:1077 | Reflow individual paragraphs within a cell |

---

## 2. Remaining Gaps (Pinpoint Issue List)

### Gap 1: Convergence Loop Only Monitors the Edited Paragraph

**Location**: `text_editing.rs:57-70` (insert), `144-157` (delete)

**Symptom**: Only checks the column placement of the edited paragraph. Does not detect cascading displacement of adjacent paragraphs.

**Example**: When paragraph 5 moves from col 0 to col 1, paragraph 6 (previously in col 1) is pushed to col 2, but this goes undetected. Paragraph 6's line_segs remain computed for col 1 width.

**Impact**: Broken adjacent paragraph layout in multi-column documents after editing.

---

### Gap 2: New Paragraph Column Not Monitored After Split

**Location**: `text_editing.rs:715-727`

**Symptom**: After paragraph split, the convergence loop only checks `para_idx`. It does not check the column placement of the newly created `new_para_idx`.

**Impact**: Layout mismatch when the split paragraph is pushed to a different column.

---

### Gap 3: Insufficient Convergence Loop After Merge

**Location**: `text_editing.rs:946-956`

**Symptom**: After merge, only `prev_idx` is checked. Does not detect paragraphs after the merged paragraph being displaced.

**Impact**: Misaligned positions of subsequent paragraphs after merge.

---

### Gap 4: Only First Line of Original LINE_SEG is Preserved

**Location**: `line_breaking.rs:587, 652`

**Symptom**: When `reflow_line_segs()` is called, only the first LineSeg's `line_height`, `text_height`, and `baseline_distance` are preserved. Lines from the 2nd onward are newly generated.

**Result**:
- When the number of lines changes, the new lines' baseline_distance differs from the original
- Cumulative Y-coordinate drift across multiple edits

---

### Gap 5: baseline_distance 0.85 Heuristic

**Location**: `line_breaking.rs:621`

**Symptom**: When `line_height` is 0, `baseline_distance = (line_height_hwp * 0.85)` is used as an estimate. This may differ from the actual baseline in the original HWP.

**Impact**: Subtle vertical position shift of characters after editing.

---

### Gap 6: Composed Data Not Updated on Cell Edit

**Location**: `text_editing.rs:1005-1007` (split_paragraph_in_cell_native)

**Symptom**: When splitting/merging paragraphs in a cell, only `mark_section_dirty()` is called. `recompose_paragraph()` is not called, so the parent paragraph's composed data is not immediately updated.

**Comparison**: Body text editing uses `recompose_paragraph()` for immediate updates.

**Impact**: Temporarily inaccurate cursor position and rendering after cell editing.

---

### Gap 7: Unnecessary Full Recomposition on Page/Column Break Insertion

**Location**: `text_editing.rs:777` (page break), `text_editing.rs:824` (column break)

**Symptom**: Calls `recompose_section()` which recomposes all paragraphs in the section. In practice, only the 2 split paragraphs need recomposition.

**Comparison**: `split_paragraph_native()` handles this with 2 calls to `recompose_paragraph()`.

**Impact**: ~100x unnecessary work when inserting a page break in a section with 200 paragraphs.

---

### Gap 8: No Adjacent Paragraph Reflow After vpos Cascade

**Location**: `line_breaking.rs:722-740`

**Symptom**: `recalculate_section_vpos()` adjusts the vpos of subsequent paragraphs in bulk, but does not update those paragraphs' line_segs. This is problematic in multi-column layouts when column boundaries are crossed.

**Impact**: Column overflow goes undetected after vpos changes in multi-column documents.

---

## 3. v1.0.0 Strategy: Achieving Identical Typesetting with Hancom

### 3.1 Strategy Comparison

| | Strategy A: Respect Original LINE_SEG (Current) | Strategy B: Independent Typesetting (commercial-product style) | **Strategy C: Match Hancom Exactly (v1.0.0 Goal)** |
|---|---|---|---|
| Viewer accuracy | High (depends on original) | Discrepancies expected | **Identical to Hancom** |
| Editing smoothness | Discontinuous (jump on first edit) | Smooth | **Smooth** |
| Complexity | Dual management of LINE_SEG preservation + reflow | Single pipeline | **Single pipeline** |
| Key challenge | Managing original/computed mismatch | Accept differences from Hancom | **Reverse-engineer Hancom's line-breaking/placement algorithm** |

**Strategy C chosen**: Precisely reverse-engineer Hancom's LINE_SEG generation logic so that rhwp's own typesetting output matches the Hancom original exactly.

### 3.2 What Strategy C Solves

- On file load, original LINE_SEG and self-computed results **match**
- On edit, self-reflow results are also **identical** to Hancom
- Dual management of original preservation vs. self-typesetting becomes **unnecessary** (resolves Gap 4)
- baseline_distance heuristic becomes **unnecessary** (resolves Gap 5)
- Layout jump on first edit **disappears**
- **Simultaneously achieves** both viewer accuracy and editing smoothness

### 3.3 Reverse Engineering Targets

To have rhwp identically reproduce Hancom's typesetting output, precise reverse engineering of the following elements is required:

| Target | Current State | Verification Method |
|--------|--------------|---------------------|
| **Line-breaking algorithm** | Custom `fill_lines()` (differs from Hancom) | Compare with original LINE_SEG's text_start |
| **Text width measurement** | Built-in font metrics for 582 fonts | Compare with original segment_width |
| **baseline_distance calculation** | 0.85 heuristic | Compare with original baseline_distance |
| **line_height / text_height** | Copy from first line of original | Compare with all original lines |
| **line_spacing calculation** | ParaShape-based | Compare with original line_spacing |
| **Paragraph spacing (spacing_before/after)** | Custom implementation | Compare with original vpos differences |
| **Tab width calculation** | Custom implementation | Compare with original segment_width |

### 3.4 Verification Framework

Extract original LINE_SEG via the `dump` command and build a test framework for 1:1 comparison with rhwp's self-reflow results:

```
Original LINE_SEG (HWP file)     rhwp reflow result
───────────────────────────     ──────────────────
text_start: 0               text_start: 0        OK match
text_start: 28              text_start: 31       FAIL line break position differs
baseline_distance: 612      baseline_distance: 595  FAIL diff 17
segment_width: 34200        segment_width: 34180    FAIL diff 20 (font metrics)
```

Measure LINE_SEG match rate across a set of sample HWP files, and resolve each mismatch cause through reverse engineering.

### 3.5 Priorities

#### Phase 1: Reverse Engineering-based Typesetting Consistency (Fundamental Challenge)

| Order | Target | Approach |
|-------|--------|----------|
| 1-1 | LINE_SEG match rate measurement infrastructure | Automated original vs. reflow comparison tests |
| 1-2 | Line-breaking algorithm consistency | Analyze text_start mismatch patterns, improve fill_lines() |
| 1-3 | Text width measurement consistency | Fix segment_width mismatches via font metric corrections |
| 1-4 | baseline/line_height consistency | Compare with original values, reverse-engineer formulas |
| 1-5 | Paragraph spacing/vpos consistency | Compare with original vpos, correct spacing calculations |

#### Phase 2: Derived Issue Fixes (After Achieving Typesetting Consistency)

| Order | Gap | Improvement Direction |
|-------|-----|----------------------|
| 2-1 | Gap 1,2,3 | Expand convergence loop monitoring scope |
| 2-2 | Gap 6 | Immediate composed update on cell editing |
| 2-3 | Gap 7 | Incremental recomposition for page/column breaks |
| 2-4 | Gap 8 | Column boundary detection on vpos cascade |

---

## 4. References

- [Incremental Layout Architecture Research](incremental_layout_research.md) — Pattern comparison of LibreOffice, Typst, Google Docs, xi-editor
- [Table Object Processing Architecture Review](../report/table_architecture_review.md)
- [Text Layout Technical Review](text_layout_review.md)
