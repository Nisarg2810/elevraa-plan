# elevraa. brand audit & growth plan

One reusable, on-brand page for any prospect: what they're doing, what they're not doing, what's missing, and what elevraa. will do about it.

Each brand gets its own folder and link, e.g. `https://nisarg2810.github.io/elevraa-plan/acme/`.

## Make a page for a new brand

```bash
./new-brand.sh acme
```

Then open `acme/data.json`, replace the placeholder text, commit and push. The page is live about a minute later.

`sample/` is a fully filled-in example (Northwind Analytics, a made-up brand) to copy from.

## Writing tips

- `*word*` gives the italic serif accent (use in headlines and titles).
- `**word**` makes text bold.
- Every section is optional. Delete a key (e.g. `investment`) and the section and its menu link disappear.
- Status values: `working`, `gap` (shown as "Underused") or `missing`.
- Impact values: `High`, `Medium` or `Low`.
- `brand.logo` can be an image URL; leave it empty to show the brand's initials.
- Brand rules: always write **elevraa.** (lowercase, with the period), and don't use em dashes.

## Files

```
assets/      shared design (style.css), renderer (app.js), fonts
_template/   blank page to copy
sample/      filled-in example
<brand>/     one folder per prospect: index.html + data.json
```

Pages are marked `noindex` so search engines don't list them; anyone with the link can view one.
Visitors can save any page as a PDF with the "Save as PDF" button.
