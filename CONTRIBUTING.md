\## Project Philosophy



This repository follows a zero-build, zero-dependency philosophy.



\## Principles:



\- No build tools



\- No unnecessary dependencies



\- Minimal runtime overhead



\- Simple and readable code



When contributing, avoid adding libraries, bundlers, or complex tooling unless clearly justified.



\## Architecture



The project is built using Vercel Edge Functions.



Key characteristics:



\- Serverless execution at the edge



\- Fast global responses



\- Minimal backend infrastructure



\- Lightweight runtime environment



\- Changes should remain compatible with the Edge Function architecture.



\## Local Development

Install the CLI



Install Vercel CLI globally:



npm install -g vercel

Clone the repository

git clone https://github.com/<repo-owner>/<repo-name>.git

cd <repo-name>

Run locally

vercel dev



This command starts a local development server that simulates the Vercel environment.



\## Contribution Workflow



1\. Fork the repository



2\. Create a branch from main



3\. git checkout -b feature/short-description



4\. Make your changes



5\. Commit your work



6\. Push to your fork



7\. Open a Pull Request



8\. Commit Message Convention



9\. Use clear and descriptive commit messages.



\## Format:



type: short description



Examples:



docs: add contributing guide

fix: correct edge function handler

feat: improve request validation



\## Common types:



\- docs – documentation updates



\- fix – bug fixes



\- feat – new features



\- refactor – internal code improvements



\## Pull Request Guidelines



When opening a Pull Request:



\- Reference the issue number (Closes #issue)



\- Keep changes focused and minimal



\- Follow the existing project style



\- Do not introduce build tools or dependencies



\- PRs that are small and clearly explained are easier to review and merge.



\## Testing and Verification



Before submitting a PR:



\- Run the project locally



\- vercel dev



Verify:



\- Edge functions run correctly



\- No build step is introduced



\- No new dependencies are added



\- Existing behavior remains intact



\## Need Help?



If you are unsure about something:



\- Open an issue

\- Ask in the discussion thread

