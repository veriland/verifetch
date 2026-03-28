import * as vscode from 'vscode';
import axios from 'axios';
import { getStoredToken, getStoredUrl } from './auth';

export async function invokeFetchXml(fetchXml: string, context: vscode.ExtensionContext): Promise<any[] | null> {
    const token = getStoredToken(context);
    const orgUrl = getStoredUrl(context);

    if (!token || !orgUrl) {
        vscode.window.showErrorMessage('Not connected. Please run "VeriFetch: Connect to Dataverse" first.');
        return null;
    }

    if (!fetchXml || fetchXml.trim() === '') {
        vscode.window.showWarningMessage('No FetchXML query provided.');
        return null;
    }

    const match = fetchXml.match(/<entity\s+name=["']([^"']+)["']/i);
    if (!match || !match[1]) {
        vscode.window.showErrorMessage('Could not find <entity name="..."> in your query. Make sure you have valid FetchXML.');
        return null;
    }

    const logicalName = match[1];

    // Basic heuristic to guess the EntitySetName (plural)
    let entitySetName = logicalName + 's';
    if (logicalName.endsWith('y')) {
        entitySetName = logicalName.slice(0, -1) + 'ies';
    } else if (logicalName.endsWith('s') || logicalName.endsWith('x') || logicalName.endsWith('ch') || logicalName.endsWith('sh')) {
        entitySetName = logicalName + 'es';
    }

    const fetchUrl = `${orgUrl}/api/data/v9.2/${entitySetName}?fetchXml=${encodeURIComponent(fetchXml.trim())}`;
    
    vscode.window.setStatusBarMessage(`$(sync~spin) Executing FetchXML on ${logicalName}...`, 3000);

    try {
        const response = await axios.get(fetchUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'OData-MaxVersion': '4.0',
                'OData-Version': '4.0',
                'Accept': 'application/json',
                'Content-Type': 'application/json; charset=utf-8'
            }
        });

        const dataRows = response.data?.value || [];
        return dataRows;

    } catch (error: any) {
        if (error.response) {
            if (error.response.status === 401) {
                vscode.window.showErrorMessage('Token expired or invalid. Please run Connect again.');
            } else if (error.response.status === 404) {
                 vscode.window.showErrorMessage(`Entity set '${entitySetName}' not found. Pluralization issue or wrong entity name.`);
            } else {
                 vscode.window.showErrorMessage(`API Error: ${error.response.data?.error?.message || error.message}`);
            }
        } else {
            vscode.window.showErrorMessage(`Request failed: ${error.message}`);
        }
        return null;
    }
}
