# Portfolio evidence and finishing notes

This file supports the case study; it is not employer-facing copy.

## Checkpoint — September 30, 2026

- **Requested:** preserve L-File as an employer-facing showcase ahead of shutdown, emphasizing accomplishment and ability to learn.
- **Chosen:** the root repository README serves as a short [project overview](../../README.md) linking to a separate [detailed case study](CASE-STUDY.md), with local screenshots that survive the domain going offline. The overview's screenshot gallery is collapsible to keep the initial read short. The original README content is preserved in `docs/DEVELOPMENT.md`; the portfolio directory README links to the canonical overview. No publication or shutdown performed.
- **Owner-confirmed:** broad tech-adjacent roles, with interest in forward-deployed engineering; the biggest learning areas were self-hosting, organizing data, and choosing product features/pages. The owner confirmed `l-file.com` as the live URL.
- **Chosen framing:** lead with the delivered product, state the owner's contribution and AI use, and use the self-hosting incident as the main learning example. Retain product planning, data modeling, and additional technical evidence in the detailed case study. Do not infer customer-facing delivery experience from this personal project.
- **Inputs:** current source checkout at `85e58858635df3abf3695cb37c7581517157ac38`, deployment workflows, dated changelog, public live pages, and the owner's [original showcase](https://www.ninjaruss.net/showcase/l-file) (published February 7, updated March 22, 2026).
- **Completed:** inspected the relevant implementation; visited the public homepage and character page; opened the reading-progress dialog; saved three original browser captures; incorporated the owner's published motivation, feature origins, hosting migration account, and reflections on AI-assisted work. Revalidated the unchanged checkout before revision.
- **Unresolved:** detailed ownership/AI division, current independent skill level, exact launch/retirement dates, and the owner's final wording of learning claims.
- **Next action:** have the owner revise the first-person learning account and specify their contribution. If resuming, recheck the checkout and artifact paths before changing evidence claims.

## Recommended home on ninjaruss.net

Use the existing `/showcase/l-file` entry rather than create a competing showcase. Put the short project overview first, followed by the live screenshots and links to source and the detailed case study. Preserve the existing dated writing below an expandable “Development journal” section or a separate linked journal entry so the contemporary account remains available.

When integrating into that site's repository, copy the images into its own static assets and adapt the Markdown links; the overview's relative links start at the repository root, while the case study's links start at `docs/portfolio/`. Keep the original publication date, add an honest update date, and change the status to retired only after shutdown. The source and case study must be published at accessible URLs before linking them from the live page. This is a placement recommendation; ninjaruss.net has not been edited or published by this task.

## The useful part to write yourself

Your existing showcase already provides the first-person account missing from the initial draft, particularly the server-overload incident and the move to prebuilt images. The revised draft uses that account. The remaining useful addition is a few sentences about your present understanding:

1. What did you initially misunderstand?
2. What did you personally investigate or change, and what did the tool supply?
3. How did you check the result?
4. What could you now do or explain without an assistant that you could not do before?

The deployment incident is the strongest starting point given your stated learning priorities. You do not need to rewrite the story from scratch; confirm that the revised account accurately describes your role and what you understand now.

Before publishing, clarify whether any collaborators contributed, and which implementation, design, debugging, content, and deployment responsibilities were yours. The draft does not assert sole authorship of all code.

## Evidence map

Paths below are relative to this directory. These were inspected to distinguish implementation evidence from plans and generated summaries.

| Claim | Evidence | Limit |
| --- | --- | --- |
| Public deployment existed | Live browser visits to `https://l-file.com/` and `https://l-file.com/characters/1`; local captures in `assets/` | One observation date; not an uptime record |
| Motivation, feature origins, and personal learning | [Owner's published showcase](https://www.ninjaruss.net/showcase/l-file) | First-person account; historical frontend confidence is not a measurement of present ability |
| Earlier public launch announcement | Same showcase, publication date February 7, 2026 | Records a launch announcement; exact launch date and uninterrupted operation remain unverified |
| Project dates | Git history: first commit August 20, 2025; reviewed HEAD July 29, 2026 | Development dates are not launch or shutdown dates |
| Learning and AI use | [Changelog](../CHANGELOG.md), particularly August 20–21 and September 5, 2025; February 26 and March 14, 2026 | Contemporary notes support the story; current ability needs owner confirmation |
| Domain model | [Gamble factions](../../server/src/entities/gamble-faction.entity.ts), [faction members](../../server/src/entities/gamble-faction-member.entity.ts) | Implementation exists; this session did not exercise every relationship |
| Spoiler rules | [Spoiler utility](../../client/src/lib/spoiler-utils.ts), [settings hook](../../client/src/hooks/useSpoilerSettings.ts) | Display behavior; not a guarantee of spoiler-free coverage on every surface |
| Session refresh | [API client](../../client/src/lib/api.ts), [auth controller](../../server/src/modules/auth/auth.controller.ts) | Source inspection; no authenticated session test in this session |
| Moderation | [Guides service](../../server/src/modules/guides/guides.service.ts), [role guard](../../server/src/modules/auth/guards/roles.guard.ts) | Source inspection; no authenticated moderation test |
| Build/deployment separation | [Deployment guide](../DEPLOYMENT.md), [frontend workflow](../../.github/workflows/deploy-frontend.yml), [backend workflow](../../.github/workflows/deploy-backend.yml) | Configuration and recorded rationale; no deployment run performed |

`docs/LEARNINGS.md` identifies itself as AI-generated. It was not treated as proof of the owner's understanding, and its technical generalizations were not copied into the case study. Design plans likewise were not treated as evidence that a feature shipped.

The original showcase's March update describes frontend builds moving to GitHub Actions, with intermittent deployment overload still unresolved then. Later repository history supports the additional backend build and deployment changes; the draft keeps those stages separate. Its broad statement that everything moved to Hetzner was narrowed to the frontend/backend services, because the project also uses external database, storage, and email services. Its criticism of the existing wiki is presented as the owner's motivation, not an independently checked assessment of that service today.

## Capture record

All images were captured from the live HTTPS application on **September 30, 2026 (America/Los_Angeles)**. The homepage and character images were recaptured at the browser's then-current 1280-pixel width after scrolling through the pages and allowing lazy sections and thumbnail requests to settle. The reading-progress capture retains its original 606-pixel width. No mockup, local development server, viewport override, or image retouching was used. The character screenshot is bounded to the navigation and main content, excluding an empty footer area produced by full-page capture.

| File | Source | State |
| --- | --- | --- |
| `assets/live-home-2026-09-30.jpg` | `https://l-file.com/` | Full page, including loaded FAQ and recent activity; 1280 × 4628 |
| `assets/live-character-2026-09-30.jpg` | `https://l-file.com/characters/1` | Overview tab, navigation and main content; 1280 × 1745 |
| `assets/live-reading-progress-2026-09-30.jpg` | `https://l-file.com/characters/1` | Reading-progress dialog open, viewport capture |

The homepage displayed 25 members at capture time. This is not a verified count of active users or unique people, so the case study does not use it as an adoption metric. Local source and the deployed build were not proven to be the same commit.

The original full-page screenshots were captured too early: off-screen homepage sections still showed loading skeletons, and a character thumbnail showed a spinner. The replacement files were visually inspected after saving. The homepage skeletons and character spinner are gone; the character relationships still show the live site's image-fallback icons, which were preserved as rendered.

## Optional evidence to preserve before retirement

- A short narrated recording of browsing a character, changing a spoiler setting, and following a linked gamble. Show what changes and explain why.
- A redacted administration screenshot or walkthrough demonstrating a real moderation flow. Avoid exposing user emails, tokens, or private submissions.
- A successful deployment record tied to a commit, if you want independent deployment-history evidence alongside the screenshots.
- Confirmed launch and shutdown dates. Add usage or performance figures only if you retain their source and measurement period.

These are suggestions, not completed captures or prerequisites to using the Markdown draft. Keep the document and its `assets/` directory together when moving it. Once the owner has reviewed the text, remove the draft notice and place it in a public repository or portfolio location that will remain available after shutdown.

## Verification scope

This task changes documentation and adds image assets only. It does not change the running application. Public page rendering and dialog opening were observed; all relative Markdown links and image references resolve, and all three image files have valid JPEG signatures. Authenticated flows, full spoiler behavior, deployment, uptime, and performance were not tested. Application builds, lint, and migrations were not run for this documentation-only change.
