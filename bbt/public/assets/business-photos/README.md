# Business photos

Drop a photo file here named exactly after a business id, and it will
automatically show up on that business's card in the grid, and as the
hero banner in its detail sheet — no code changes needed.

Filename format: `{business_id}.jpg` (or `.jpeg`, `.png`, `.webp`)

Example: a photo for the business with id `bakery` goes at:
  public/assets/business-photos/bakery.jpg

Businesses without a matching file here keep showing the existing
themed gradient + icon, exactly as before.

Tip: photos crop to fill the card (object-cover), so a roughly
square-to-portrait photo with the interesting part centered looks best.
