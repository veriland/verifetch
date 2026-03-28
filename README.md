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
