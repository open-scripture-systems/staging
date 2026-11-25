Word of God Workshop (みことば工房), by Open Scripture Systems, formerly Open Word Study: https://open-scripture-systems.github.io/ (earlier at https://vadneyk.github.io/open-word-study-site/ and https://vadneyk.github.io/open-scripture-systems/, which redirect)

# Data sources and licences

| Source | Used for | Licence |
|---|---|---|
| STEPBible TAGNT, Tyndale House Cambridge, https://github.com/STEPBible/STEPBible-Data | Greek words, lemma, Strong's, morphology, glosses | CC BY 4.0 |
| STEPBible TIPNR, Tyndale House Cambridge, https://github.com/STEPBible/STEPBible-Data | People, places and things, with every name and reference | CC BY 4.0 |
| OpenBible.info cross references, https://www.openbible.info/labs/cross-references/ | Cross references ranked by reader votes | CC BY 4.0 |
| unfoldingWord Translation Notes, https://git.door43.org/unfoldingWord/en_tn | Notes on hard phrases; MTS stage (b) context notes | CC BY-SA 4.0 |
| unfoldingWord Translation Words, https://git.door43.org/unfoldingWord/en_tw | MTS stage (b) context notes: definitions of key terms, names and other terms | CC BY-SA 4.0 |
| unfoldingWord Translation Words Links, https://git.door43.org/unfoldingWord/en_twl | Which Translation Words article belongs to which word in a verse; MTS checkpoint cross-check | CC BY-SA 4.0 |
| MACULA Greek Linguistic Datasets, available at https://github.com/Clear-Bible/macula-greek/ (Biblica, Inc) | MTS stage (b): clause predicates, verb phrases and pronoun referents (SBLGNT syntax trees) | CC BY 4.0 (Louw-Nida fields not used; see below) |
| SBL Greek New Testament (SBLGNT), Society of Biblical Literature and Logos Bible Software, https://github.com/LogosBible/SBLGNT | Greek words quoted in MTS stage (b) context notes, as carried in the MACULA trees | CC BY 4.0 |
| Creeds.json, https://github.com/NonlinearFruit/Creeds.json | Exact Nicene and Apostles' Creed lines quoted in mts/checkpoints.json | Texts marked Public Domain; repo under the Unlicense |
| STEPBible TAHOT, Tyndale House Cambridge, https://github.com/STEPBible/STEPBible-Data | Hebrew OT words, lemmas, glosses, morphology | CC BY 4.0 |
| Berean Standard Bible and Berean interlinear tables, https://berean.bible | English renderings aligned to Greek | Public domain |
| unfoldingWord Literal Text (ULT), https://git.door43.org/unfoldingWord/en_ult | English renderings aligned to Greek | CC BY-SA 4.0 |
| unfoldingWord Simplified Text (UST), https://git.door43.org/unfoldingWord/en_ust | English renderings aligned to Greek | CC BY-SA 4.0 |
| Freedom Bible (フリーダム・バイブル, eBible.org jpnm), https://ebible.org/details.php?id=jpnm | Japanese text in the Study Workspace (all 66 books, a draft translation, no word alignment) and in Freedom Bible Review | Public domain (https://ebible.org/jpnm/copyright.htm, read 2026-11-25) |

The MTS pilot (mts/) uses STEPBible TAGNT for its stage (a)+(b) files (mts/pilot/stage_b/) and for the test
fixture tests/fixtures/tagnt-mini.txt (verbatim TAGNT lines). Changes made by mts/meaning.py: Greek normalized to
Unicode NFC, edition and word-order tags parsed into lists, morphology codes described in plain English.

mts/context_notes.json is built by mts/build_context_notes.py. It is a modified derivative of unfoldingWord
Translation Notes and Translation Words (the original work by unfoldingWord is available from
https://www.unfoldingword.org/utn and https://www.unfoldingword.org/utw), shared under CC BY-SA 4.0 and not endorsed by
unfoldingWord. Changes: notes filtered by support reference, Markdown removed, Translation Words definitions shortened,
en and em dashes replaced. The same licence applies to mts/pilot/stage_b/*.json and mts/pilot/SIDE-BY-SIDE.md, which
show these notes. From MACULA Greek the syntax trees and participant referents are used, restated in OSS sentences;
the notes quote the SBLGNT Greek words carried in the trees (SBLGNT, CC BY 4.0, Society of Biblical Literature and Logos
Bible Software) and their Berean interlinear glosses (public domain). MACULA's Louw-Nida `ln` and `domain` fields come from the UBS MARBLE project, "used with
permission", are not under CC BY 4.0, and are not used or copied. OpenBible.info cross references are also used to
check the Bible references in the few OSS-written notes (mts/oss_notes.json).

Anything derived from the ULT or UST is shared under CC BY-SA 4.0. Copyrighted translations (ESV, NIV
and others) are not used. From Logos Bible Software only the SBLGNT text (CC BY 4.0) is used, as above; no other data, text or interface.

## Code licence

The code in this repository is under the MIT licence (see LICENSE). The data above keeps its own terms;
the MIT licence does not cover it. The tools are free to use: no charge, no ads, no login.
The study workspace has its own fuller list in SOURCES.md.
