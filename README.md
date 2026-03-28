# VeriFetch

A powerful Dataverse/Dynamics 365 FetchXML executor natively integrated into VS Code.

## Features
- **Unified Workspace:** Run FetchXML queries and view Dataverse results in a single, horizontally split Webview tab.
- **Embedded Monaco Editor:** Enjoy first-class Microsoft XML syntax highlighting directly inside the query runner.
- **Interactive Grid:** Automatically renders your JSON result rows using AG Grid with resizable columns, sorting, and filtering.
- **Auto-Extraction:** Highlight Javascript/C# code containing a FetchXML snippet, right-click "Run Query", and VeriFetch will automatically regex-parse the XML block out of the surrounding code and run it!

## Setup
1. Open the VS Code Command Palette (`Cmd+Shift+P`)
2. Type `VeriFetch: Connect to Dataverse`
3. Enter your Dynamics 365 Environment URL
4. Follow the Azure OAuth Device Login instructions.

## Usage
- Highlight any code containing `<fetch>...</fetch>`
- Right click -> **VeriFetch: Run Query**
- Enjoy!

## 🔐 Contribution Policies & Governance

WARNING: This repository enforces explicit protections on the `main` branch. 
**Direct pushes targeting the `main` branch by external developers will be categorically rejected by the GitHub server.** 

To contribute to VeriFetch:
1. You **MUST** fork this repository.
2. You **MUST** make your isolated architectural changes on a dedicated feature branch.
3. You **MUST** submit a formal Pull Request (PR) against the `main` branch.

**Automated Validation (CI/CD)**: Every Pull Request is subject to an automated TypeScript compilation run inside `GitHub Actions`. If your code fails to compile or introduces syntax errors, your Pull Request will be blocked until repaired.

Please refer to the `CONTRIBUTING.md` file carefully for specific semantics on Versioning and pipeline execution.
