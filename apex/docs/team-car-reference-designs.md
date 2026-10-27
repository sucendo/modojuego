# Vehicle studio: team design references

The SVGs in `js/team-car-preview-9a.js` are original visual interpretations of the real-team references already assigned by `teamCatalog.inspiredBy`. They are not engineering replicas or a claim that these contours reproduce exact 2026 aerodynamic specifications. Some supplied references and launch imagery represent different car versions or seasons.

These designs apply only to the Vehicle / Team showroom. They do not modify the racing mesh, physics, performance, saved team keys, palette storage, or team logos.

| APEX team | Catalogue reference | Distinguishing showroom treatment |
| --- | --- | --- |
| McRaven Racing | McLaren | Broad curved downwash pods, dark inset surfaces, flowing edge stripe, long tapered nose, four wing blades. |
| Meridian Grand Prix | Mercedes | Narrower stepped shoulders, shelf-like pods, shallow slot inlets, central contrasting spine, longer nose. |
| Ferrazzi Corse | Ferrari | Full rounded primary-colour pods, wider engine shoulders and nose root, paired longitudinal lines, three wing blades. |
| Red Bison Racing | Red Bull Racing | Pinched engine tail, forward pod extension, high inlet cut, narrow nose, swept wing and chevron panels. |
| Racing Bisons | Racing Bulls | Oval extended pods, moderate engine waist, rectangular inlet lip, split paint panels and three wing blades. |
| Alpinor F1 Team | Alpine | Angular pod channels, diagonal inlet opening, full-width accent bands, narrow tip and wide nose shoulders. |
| Hassler Motorsport | Haas | Straighter box-like pod shoulders, rectangular inlets, broader short nose and transverse graphic blocks. |
| Auron Motorsport | Audi | Faceted pod outline, diagonal inlet lip and paint cuts, compact engine waist and three wing blades. |
| Willmont Racing | Williams | Smooth swept pods, rounded inlets, long nose, contrasting pod panels and fine longitudinal keylines. |
| Aston Marlow Racing | Aston Martin | Tight engine tail, deeply cut curved shoulders, shallow inlets, narrow nose and spear-shaped accents. |
| Cadara Racing | Cadillac | Broad conventional shoulders, square inlet lip, shorter wider nose and contrasting upper/lower body halves. |

All primary, secondary and accent paint masks use the existing palette roles. Silver, carbon and white finishes retain those roles. Tyres, carbon floor, suspension and the basic cockpit structure are shared components; body, pod, inlet, engine-cover, nose and wing treatments differ. Common rules and construction keep all cars recognisable as modern F1 cars.

## Visual references

The user supplied overhead McLaren, Ferrari, Red Bull and proposed McRaven showroom images. Additional team launch/car pages consulted:

- [Mercedes W17](https://www.mercedesamgf1.com/car/2026) and [launch design](https://www.mercedesamgf1.com/news/mercedes-amg-f1-2026-challenger-w17-revealed).
- [Audi R26, including overhead studio view](https://www.audif1.com/en/audi-r26-car).
- [Aston Martin design discussion](https://www.astonmartinf1.com/en-GB/news/feature/undercut-adrian-newey-wants-you-to-keep-an-open-mind).
- [Williams FW48 gallery](https://www.williamsf1.com/articles/b299bc9b-de99-4e81-9675-851ac2ed0fed/discover-our-fw48-livery-up-close-and-claim-the-badge).
- [Alpine A526](https://www.alpinef1.com/news/introducing-the-a526).
- [Haas VF-26 launch](https://haasf1team.com/news/tgr-haas-f1-team-reveals-vf-26-design-livery).
- [Racing Bulls launch](https://www.visacashapprb.com/int-en/2026-car-reveal).
- [Cadillac launch](https://www.cadillacf1team.com/news/cadillac-formula-1-r-teams-2026-livery-debuts-on-track).

## Regression check

`tests/vehicle-studio-9a-browser.cjs` renders all 11 designs with an identical neutral palette and identical input dimensions, removes text, and compares all 55 image pairs. It also checks independently different pod, inlet, engine-cover, nose and front-wing path geometry, validates SVG parsing and bounds, and runs the existing selection, palette, finish, persistence and responsive-layout checks.
