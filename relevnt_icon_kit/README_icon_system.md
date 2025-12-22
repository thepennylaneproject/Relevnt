# Relevnt Icon System

## Use
1) Inline the sprite once near your app root (layout or _document):
```tsx
import sprite from './icon-sprite.svg?raw';
<div style={{display:'contents'}} dangerouslySetInnerHTML={{ __html: sprite }} />
```
2) Import styles:
```ts
import './icon.css';
```
3) Render:
```tsx
import { Icon } from './Icon';
<Icon name="i-briefcase" size={20} tone="muted" title="Jobs" />
<Icon name="i-search" size={20} tone="accent" />
```
## Rules
- `stroke="currentColor"`, `fill="none"` for stroke icons, no hard-coded colors.
- Sizes: 16/20/24/32 on 24 viewBox grid; stroke 1.5 for 24px, 1.25 for 20px.
- Decorative icons: no title, `aria-hidden=true`. Semantic icons: add `title`.
