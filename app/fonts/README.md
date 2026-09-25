# Bundled fonts

These variable fonts are bundled so development and production builds do not
need to download files from Google Fonts. `app/layout.tsx` loads them using
`next/font/local`, retaining the existing CSS variables and normal/italic styles.

Sources: the official [Google Fonts repository](https://github.com/google/fonts),
downloaded on September 25, 2026:

- [Bodoni Moda](https://github.com/google/fonts/tree/main/ofl/bodonimoda)
- [Cormorant Garamond](https://github.com/google/fonts/tree/main/ofl/cormorantgaramond)
- [Instrument Sans](https://github.com/google/fonts/tree/main/ofl/instrumentsans)

Each family’s SIL Open Font License is included in its directory. The original
variable TTF files are renamed to `regular.ttf` and `italic.ttf` for stable imports.
