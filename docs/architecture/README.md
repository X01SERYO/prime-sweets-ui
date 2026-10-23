# C4 Architecture — current UI

This folder is the **only** C4 description of the frontend. It documents the SPA as implemented in this repository.

Version 1 (feature modules, seller flows, print dialog) is the decision in [ADR-001](../adrs/ADR-001.md) and the guide in [SPEC](../specs/SPEC.md). It is not duplicated here as a second C4 model.

| Level | Question | Document |
|---|---|---|
| 1 — Context | Who uses the UI, and which systems does it talk to? | [01-context.md](./01-context.md) |
| 2 — Container | Which applications make up the client? | [02-container.md](./02-container.md) |
| 3 — Component | Which modules sit inside the SPA? | [03-component.md](./03-component.md) |
| 4 — Code | How does startup actually run? | [04-code.md](./04-code.md) |

Related: [model](../model/README.md), [flows](../flows/README.md).
