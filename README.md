# L-File — from a fan resource to a live web application

I built and publicly deployed a database for *Usogui*, my favorite manga. Readers can explore connected characters, story arcs, and gambles, track their reading progress, and use chapter-based spoiler controls. The application also supports community submissions and an administration interface for maintaining the content.

## My contribution

I defined the features and pages, organized the relationships between data, evaluated the interface, and worked through deployment and revisions. I used Claude Code extensively for implementation. My role centered on turning an idea into specific requirements, checking the results, and learning enough about unfamiliar systems to address problems as they appeared.

## A problem I worked through

Moving the frontend and backend from Vercel and Fly.io to a Hetzner server introduced a practical constraint: building frontend updates could overload the machine serving the site.

I learned to build Docker images through GitHub Actions and have Dokploy pull the prepared images onto the server. That automated the frontend build and deployment process. Occasional failures prompted further work; the repository records later changes to backend builds, deployment sequencing, and memory limits.

The key lesson was understanding that building an application and running it are separate workloads. This project gave me experience turning a product idea into structured data and a public application, then adapting the implementation when real operating constraints appeared.

**Core technologies:** TypeScript, Next.js, NestJS, PostgreSQL, Docker, GitHub Actions, Dokploy.

**Public record:** announced live in February 2026; screenshots captured September 30, 2026, ahead of planned retirement.

[Detailed case study](docs/portfolio/CASE-STUDY.md) · [Development guide](docs/DEVELOPMENT.md) · [Original project journal](https://www.ninjaruss.net/showcase/l-file)

<details>
<summary>View two screenshots from the live application</summary>

![Live character page showing connected profiles, organizations, arcs, and gambles](docs/portfolio/assets/live-character-2026-09-30.jpg)

*Character profile — navigation and main content, September 30, 2026.*

![Reading-progress controls on the live application](docs/portfolio/assets/live-reading-progress-2026-09-30.jpg)

*Reading-progress dialog — September 30, 2026. Screenshots are stored in this repository so they remain available after shutdown.*

</details>

*Unofficial fan project. Usogui artwork and characters belong to their respective rights holders. Application source: [MIT License](LICENSE).*
