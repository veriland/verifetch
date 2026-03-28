import * as vscode from 'vscode';
import { invokeFetchXml } from './fetchRunner';

export class WorkspaceManager {
    public static currentPanel: vscode.WebviewPanel | undefined;

    public static async handleEditorCommand(context: vscode.ExtensionContext) {
        const editor = vscode.window.activeTextEditor;
        let queryText = `<fetch top="50">\n  <entity name="account">\n    <attribute name="name" />\n  </entity>\n</fetch>`;
        
        if (editor) {
            let textToUse = '';
            const selection = editor.document.getText(editor.selection);
            // 1. Prioritize what the user actively highlighted, but cleanly extract the XML if they highlighted surrounding code
            if (selection && selection.trim() !== '') {
                 const fetchMatch = selection.match(/<fetch[\s\S]*?<\/fetch>/i);
                 if (fetchMatch) {
                     textToUse = fetchMatch[0];
                 } else {
                     textToUse = selection;
                 }
            } else {
                 // 2. If nothing is highlighted, scan the entire file for the first <fetch> ... </fetch> block
                 const fullText = editor.document.getText();
                 const fetchMatch = fullText.match(/<fetch[\s\S]*?<\/fetch>/i);
                 
                 if (fetchMatch) {
                     textToUse = fetchMatch[0]; // Magically grabs the valid Fetch XML out of JS/C# files!
                 } else if (editor.document.languageId === 'xml') {
                     // 3. Fallback: if it's an XML file, grab the whole thing
                     textToUse = fullText;
                 }
            }

            if (textToUse.trim() !== '') {
                queryText = textToUse;
            }
        }

        WorkspaceManager.openWebviewOnly(context, queryText);
    }

    public static openWebviewOnly(context: vscode.ExtensionContext, initialQuery: string = '') {
        const column = vscode.ViewColumn.Active;

        if (WorkspaceManager.currentPanel) {
            WorkspaceManager.currentPanel.reveal(column);
            if (initialQuery) {
                WorkspaceManager.currentPanel.webview.postMessage({ command: 'setQuery', query: initialQuery });
            }
            return;
        }

        WorkspaceManager.currentPanel = vscode.window.createWebviewPanel(
            'verifetchUnified',
            'VeriFetch Workspace',
            column,
            { 
               enableScripts: true,
               retainContextWhenHidden: true // Keep Monaco state if they tab away
            }
        );

        WorkspaceManager.currentPanel.onDidDispose(
            () => {
                WorkspaceManager.currentPanel = undefined;
            },
            null,
            context.subscriptions
        );

        WorkspaceManager.currentPanel.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'execute') {
                const data = await invokeFetchXml(message.query, context);
                
                if (data) {
                    if (data.length === 0) {
                        vscode.window.showInformationMessage('Query successful: 0 rows returned.');
                    }
                    if (WorkspaceManager.currentPanel) {
                        WorkspaceManager.currentPanel.webview.postMessage({ command: 'renderData', data: data });
                    }
                } else {
                     if (WorkspaceManager.currentPanel) {
                        WorkspaceManager.currentPanel.webview.postMessage({ command: 'renderData', data: [] });
                     }
                }
            }
        });

        WorkspaceManager.currentPanel.webview.html = WorkspaceManager.getWebviewContent(
            initialQuery || `<fetch top="50">\n  <entity name="account">\n    <attribute name="name" />\n    <attribute name="telephone1" />\n  </entity>\n</fetch>`
        );
    }

    private static getWebviewContent(initialQuery: string) {
        // Use JSON.stringify to 100% guarantee no template escaping string corruption logic fails.
        const safeJsonQuery = JSON.stringify(initialQuery);
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VeriFetch Workspace</title>
    <!-- AG Grid -->
    <script src="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js"></script>
    <!-- Monaco Editor Loader -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs/loader.min.js"></script>
    
    <style>
        body, html { 
            margin: 0; padding: 0; height: 100vh; overflow: hidden;
            display: flex; flex-direction: column; 
            background-color: var(--vscode-editor-background); color: var(--vscode-editor-foreground); 
        }
        
        #top-half { 
            flex: none; height: calc(50% - 20px); min-height: 10%; display: flex; flex-direction: column; overflow: hidden;
        }
        #editor-container { flex: 1; width: 100%; min-height: 0; overflow: hidden; }

        #toolbar { 
            flex: 0 0 40px;
            background-color: var(--vscode-editorGroupHeader-tabsBackground); 
            padding: 0 16px; display: flex; align-items: center; justify-content: space-between; 
            border-top: 1px solid var(--vscode-panel-border);
            border-bottom: 1px solid var(--vscode-panel-border);
            cursor: row-resize; user-select: none;
        }
        #run-btn { 
            background-color: var(--vscode-button-background); 
            color: var(--vscode-button-foreground); 
            border: none; padding: 6px 14px; cursor: pointer; border-radius: 2px;
            font-weight: 500; display: flex; align-items: center; gap: 6px; font-size: 13px;
        }
        #run-btn:hover { background-color: var(--vscode-button-hoverBackground); }
        .drag-handle { opacity: 0.5; font-size: 14px; letter-spacing: 2px; }
        
        #bottom-half { flex: 1 1 auto; min-height: 10%; display: flex; flex-direction: column; overflow: hidden; }
        #myGrid { flex: 1; width: 100%; min-height: 0; overflow: hidden; }
        
        .ag-theme-alpine-dark {
            --ag-background-color: var(--vscode-editor-background);
            --ag-header-background-color: var(--vscode-sideBar-background);
            --ag-odd-row-background-color: var(--vscode-editor-inactiveSelectionBackground);
            --ag-border-color: var(--vscode-panel-border);
            --ag-foreground-color: var(--vscode-editor-foreground);
            --ag-header-foreground-color: var(--vscode-editor-foreground);
        }
    </style>
</head>
<body class="vscode-dark">
    <div id="top-half">
        <div id="editor-container"></div>
    </div>
    <div id="toolbar">
        <button id="run-btn">▶ Run Query</button>
        <div class="drag-handle">⋮⋮</div>
    </div>
    <div id="bottom-half">
        <div id="myGrid" class="ag-theme-alpine-dark"></div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let gridApi;
        let monacoEditor;

        const gridOptions = {
            columnDefs: [],
            rowData: [],
            defaultColDef: { sortable: true, filter: true, resizable: true, minWidth: 100, flex: 1 }
        };

        const eGridDiv = document.querySelector('#myGrid');
        if (agGrid.createGrid) {
            gridApi = agGrid.createGrid(eGridDiv, gridOptions); 
        } else {
            new agGrid.Grid(eGridDiv, gridOptions); 
            gridApi = gridOptions.api;
        }

        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' }});
        require(['vs/editor/editor.main'], function() {
            monacoEditor = monaco.editor.create(document.getElementById('editor-container'), {
                value: ${safeJsonQuery},
                language: 'xml',
                theme: document.body.classList.contains('vscode-light') ? 'vs' : 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: false }
            });
        });

        document.getElementById('run-btn').addEventListener('click', () => {
            if (monacoEditor) {
                const queryText = monacoEditor.getValue();
                
                if(gridApi.setGridOption) {
                    gridApi.setGridOption('rowData', []);
                    gridApi.setGridOption('columnDefs', [{field: 'System Status', headerName: 'Executing against Dataverse...'}]);
                } else {
                    gridOptions.api.setRowData([]);
                    gridOptions.api.setColumnDefs([{field: 'System Status', headerName: 'Executing against Dataverse...'}]);
                }

                vscode.postMessage({ command: 'execute', query: queryText });
            }
        });

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'renderData') {
                const data = message.data;
                if (!data || data.length === 0) {
                    if(gridApi.setGridOption) {
                        gridApi.setGridOption('rowData', []);
                        gridApi.setGridOption('columnDefs', []);
                    } else {
                        gridOptions.api.setRowData([]);
                        gridOptions.api.setColumnDefs([]);
                    }
                    return;
                }
                
                const allKeys = new Set();
                data.forEach(row => {
                    Object.keys(row).forEach(k => {
                        if(!k.startsWith('@odata.')) {
                            allKeys.add(k);
                        }
                    });
                });

                const cols = Array.from(allKeys).map(key => {
                    return { field: key, headerName: key };
                });

                if(gridApi.setGridOption) {
                    gridApi.setGridOption('columnDefs', cols);
                    gridApi.setGridOption('rowData', data);
                } else {
                    gridOptions.api.setColumnDefs(cols);
                    gridOptions.api.setRowData(data);
                }
            } else if (message.command === 'setQuery') {
                 if (monacoEditor) {
                     monacoEditor.setValue(message.query);
                 }
            }
        });

        // --- 5. Resizable Split Pane Logic ---
        const resizer = document.getElementById('toolbar');
        const topHalf = document.getElementById('top-half');
        
        let isResizing = false;

        const bottomHalf = document.getElementById('bottom-half');

        resizer.addEventListener('mousedown', (e) => {
            if (e.target.id === 'run-btn') return;
            isResizing = true;
            document.body.style.cursor = 'row-resize';
            topHalf.style.pointerEvents = 'none';
            bottomHalf.style.pointerEvents = 'none';
            e.preventDefault(); 
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const newHeight = (e.clientY / window.innerHeight) * 100;
            if (newHeight > 10 && newHeight < 90) {
                topHalf.style.height = \`calc(\${newHeight}vh - 20px)\`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = 'default';
                topHalf.style.pointerEvents = 'auto';
                bottomHalf.style.pointerEvents = 'auto';
                if (monacoEditor) {
                    monacoEditor.layout();
                }
            }
        });

        window.addEventListener('resize', () => {
             if (monacoEditor) monacoEditor.layout(); 
        });
    </script>
</body>
</html>`;
    }
}
