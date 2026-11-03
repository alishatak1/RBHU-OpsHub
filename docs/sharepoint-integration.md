# SharePoint Announcements Integration

## Current Implementation
The GET /api/announcements endpoint currently returns three mock announcements from an in-memory array.

Announcement fields: id, title, message, category, priority, publishedAt and pinned.

## Proposed SharePoint Integration
Use a SharePoint Online announcements list as the future source of truth.

Suggested columns: Title, Message, Category, Priority, PublishedAt, Pinned and IsPublished.

## Proposed Integration Flow
1. An administrator publishes an announcement in SharePoint.
2. The backend authenticates through Microsoft Entra ID.
3. The backend retrieves published announcements using Microsoft Graph API.
4. The backend maps SharePoint records to the OpsHub API response.
5. The React frontend displays the announcements.

## Security
- Use Microsoft Entra ID authentication.
- Prefer managed identity on Azure App Service.
- Grant minimum required SharePoint permissions.
- Store secrets in Azure Key Vault.
- Never expose Graph API tokens to the frontend.

## Future Work
1. Create the SharePoint announcements list.
2. Register an Entra ID application.
3. Configure Microsoft Graph permissions.
4. Implement backend integration, caching and error handling.

## Current Status
The announcements API and frontend use mock data. Live SharePoint and Microsoft Graph integration are proposed future enhancements and are not deployed.
