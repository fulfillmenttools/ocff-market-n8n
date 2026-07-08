import type {
	IAuthenticateGeneric,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	IHttpRequestHelper,
	INodeProperties,
} from 'n8n-workflow';

/**
 * fulfillmenttools authenticates against Google Identity Platform.
 *
 * The API user (email + password) is exchanged for a short-lived JWT `idToken`
 * via the Identity Toolkit `signInWithPassword` endpoint. That token is then
 * sent as `Authorization: Bearer <idToken>` on every request against the
 * tenant API (https://<tenant>.api.fulfillmenttools.com).
 *
 * n8n runs `preAuthentication` to fetch the token and caches the result. When a
 * request comes back with 401 (token expired after ~60 min) n8n automatically
 * re-runs `preAuthentication` to obtain a fresh token, so no manual refresh
 * handling is required here.
 */
export class FulfillmenttoolsApi implements ICredentialType {
	name = 'fulfillmenttoolsApi';

	displayName = 'Fulfillmenttools API';

	documentationUrl = 'https://docs.fulfillmenttools.com/documentation';

	icon: Icon = { light: 'file:fftFav.svg', dark: 'file:fftFav.dark.svg' };

	properties: INodeProperties[] = [
		{
			displayName: 'API Base URL',
			name: 'apiUrl',
			type: 'string',
			default: '',
			placeholder: 'https://your-tenant.api.fulfillmenttools.com',
			required: true,
			description:
				'Base URL of your fulfillmenttools tenant, without a trailing slash. Format: https://&lt;tenant&gt;.api.fulfillmenttools.com',
		},
		{
			displayName: 'Auth Key',
			name: 'authKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'The Google Identity Platform API key (AUTHKEY) provided for your tenant, used to exchange the credentials for an access token',
		},
		{
			displayName: 'Username (Email)',
			name: 'username',
			type: 'string',
			default: '',
			placeholder: 'user@ocff-<tenant>-<env>.com',
			required: true,
			description: 'Email address of the API user',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Password of the API user',
		},
		{
			// Populated by preAuthentication with the Google Identity `idToken`.
			// `expirable: true` makes n8n re-run preAuthentication once the token
			// expires (or on a 401), fetching a fresh token automatically.
			displayName: 'Session Token',
			name: 'sessionToken',
			type: 'hidden',
			typeOptions: { expirable: true, password: true },
			default: '',
		},
	];

	/**
	 * Exchange the API user credentials for a Google Identity Platform JWT.
	 * The returned object is merged into the credential data, so `sessionToken`
	 * becomes available to the `authenticate` block below via `$credentials`.
	 */
	async preAuthentication(this: IHttpRequestHelper, credentials: ICredentialDataDecryptedObject) {
		const response = (await this.helpers.httpRequest({
			method: 'POST',
			url: `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${credentials.authKey}`,
			body: {
				email: credentials.username,
				password: credentials.password,
				returnSecureToken: true,
			},
			headers: { 'Content-Type': 'application/json' },
			json: true,
		})) as { idToken: string };

		return { sessionToken: response.idToken };
	}

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.sessionToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.apiUrl}}',
			url: '/api/facilities',
			method: 'GET',
			qs: { size: 1 },
		},
	};
}
