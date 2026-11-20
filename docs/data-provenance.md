# Catalogue data provenance

The planner is a student-maintained transcription, not a VIT-AP feed. The catalogue in `js/data.js` records the source class used for each course group:

| Courses | Source described in `js/data.js` | Transcription caveat |
|---|---|---|
| `MEC3002`, `MEC2018`, `MEC2005` | VTOP registration screenshots | OCR-derived |
| `MEC4003` | No source is identified in the current `js/data.js` notes | Source needs to be added before this record can be independently traced |
| `MAT1010`, `MGT1040`, `STS2011` | Official course PDFs | OCR-derived |
| `ECE2003`, `ECE2006`, `ECE2017`, `ECE3005`, `CSE1022` | VTOP Winter 2026–27 registration exports | Slot, room and instructor fields only |
| `CSE1005`, `CSE1007`, `CSE1021`, `CSE2007` | VIT-AP course slot-list PDFs | Text-layer transcription |
| `CSE2008` | VTOP registration screenshots | Read from the module-slot table |
| `CSE3001`, `CSE3002`, `SWE2004`, `SWE3001`, `SWE2006` | MIS registration-list “Modify Slots” print-outs | Read visually |
| `ECE2015` | VTOP print-out | Theory-only listing |
| `ECE2016` | Engineering Electromagnetics PDF for course `25BEC7153` | Theory-only listing |
| `CSE3008` | Machine Learning PDF | Embedded theory and lab listing |
| `CSE1006` | Foundations for Data Analytics PDF | The source does not state a category; the catalogue uses the PE category of its peers |

The source documents and screenshots are not included in this repository, and the table above is based on the source notes maintained alongside the catalogue. It is therefore not an independent verification of the current VTOP offering. The Node validator checks structural consistency—credits, slot tokens, venues and catalogue totals—not whether the transcription still matches the official registration system.

**Before registering:** verify the current slot, venue, instructor, credits and availability on VTOP and in the official semester documents. The planner does not show seat availability and is not affiliated with VIT or VTOP.

The most recent automated catalogue-integrity check recorded in this change is **2026-11-20**. This is a date for the repository checks, not a claim that every source record was re-verified with VIT-AP on that date. When updating data, keep the source notes in `js/data.js` and this table aligned, and record the course group and date of any manual source re-check in the change description.
