# ASSETS TODO FOR RYAN

Final visual files should live under:

`assets/trap-house/`

Public image assignments are centralized in `src/content/siteContent.js`. Each major section supports `imageSrc`, `imageAlt`, optional `imageCaption`, `backgroundPosition`, and `mobileBackgroundPosition` where appropriate. A missing or failed image displays `IMAGE SLOT` instead of a broken image.

## NEEDED ASSETS

| Asset | Recommended format | Public content field |
| --- | --- | --- |
| Homepage Hero | 2400x1400 landscape; leave a safe copy area | `homeContent.hero` |
| Homepage section images | 1600x1100 landscape, crop-safe | `homeContent.previews[]` |
| Thread Map master image | 2200x1400 or larger, high detail | `mapContent.boardIntro` |
| Thread-specific imagery | 1600x1100 landscape per Thread, optional | `threadContent.threads[].heroImage` |
| January 22 feature image | 2000x1200 landscape | `mapContent.originPanel` and `january22Content.hero` |
| Official Drops thumbnails | 1600x900, 16:9 | `dropsContent.featuredDrop` and future `dropItems[]` |
| Trap Pass art | 1600x1000 or transparent PNG/WebP with padding | `trapPassContent.hero` and future tier fields |
| Trap House image | 1920x1080 landscape | `trapHouseContent.hero` |
| Store product images | 1600x1200, 4:3, centered product | `storeContent.products[].imageSrc` |
| Book art | 1600x1200 or larger | `bookContent.hero` and `bookContent.imagePanel` |
| Ryan creator image | 1600x1200 portrait or environmental image | `aboutContent.creator` |
| Dopesick prior-work image | 1600x1200 book/product image | `aboutContent.priorWork` |
| Open Graph / social preview | 1200x630 | `seoContent.defaults.ogImage` and `twitterImage` |

## DELIVERY NOTES

- Use local files only; do not hotlink external images.
- Prefer compressed WebP unless PNG or JPEG is visibly better for the source.
- Supply accurate public alt text when assigning each final image.
- Verify hero focal points at 390px, 768px, 1280px, and 1440px after replacement.
