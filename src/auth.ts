import * as vscode from 'vscode';
import { PublicClientApplication, DeviceCodeRequest, Configuration } from '@azure/msal-node';

// We use the well-known Microsoft PnP / CLI Client ID so users don't have to create one.
const CLIENT_ID = '51f81489-12ee-4a9e-aaae-a2591f45987d'; 
const AUTHORITY = 'https://login.microsoftonline.com/common';

const msalConfig: Configuration = {
    auth: {
        clientId: CLIENT_ID,
        authority: AUTHORITY
    }
};

const pca = new PublicClientApplication(msalConfig);

export async function connectCommand(context: vscode.ExtensionContext) {
    const orgUrl = await vscode.window.showInputBox({
        prompt: 'Enter your Dataverse Environment URL',
        placeHolder: 'https://org123.crm.dynamics.com',
        ignoreFocusOut: true
    });

    if (!orgUrl) {
        return;
    }

    let cleanUrl = orgUrl.trim();
    if (cleanUrl.endsWith('/')) {
        cleanUrl = cleanUrl.slice(0, -1);
    }

    const scope = `${cleanUrl}/.default`;

    const deviceCodeRequest: DeviceCodeRequest = {
        scopes: [scope],
        deviceCodeCallback: (response) => {
            vscode.window.showInformationMessage(
                `VeriFetch Login: Navigate to ${response.verificationUri} and enter code: ${response.userCode}`,
                'Copy Code & Open Browser'
            ).then(selection => {
                if (selection === 'Copy Code & Open Browser') {
                    vscode.env.clipboard.writeText(response.userCode);
                    vscode.env.openExternal(vscode.Uri.parse(response.verificationUri));
                }
            });
        }
    };

    try {
        vscode.window.showInformationMessage('Initiating login...');
        const result = await pca.acquireTokenByDeviceCode(deviceCodeRequest);
        if (result && result.accessToken) {
            await context.globalState.update('verifetch.token', result.accessToken);
            await context.globalState.update('verifetch.orgUrl', cleanUrl);
            vscode.window.showInformationMessage('Successfully connected to Dataverse!');
        } else {
            vscode.window.showErrorMessage('Failed to acquire token.');
        }
    } catch (error: any) {
        vscode.window.showErrorMessage(`Login Error: ${error.message}`);
    }
}

export function getStoredToken(context: vscode.ExtensionContext): string | undefined {
    return context.globalState.get('verifetch.token');
}

export function getStoredUrl(context: vscode.ExtensionContext): string | undefined {
    return context.globalState.get('verifetch.orgUrl');
}
