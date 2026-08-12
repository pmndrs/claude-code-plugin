---
name: examples
description: Find a working pmndrs demo before writing a react-three-fiber scene from scratch — caustics, transmission, physics, postprocessing, scroll rigs, GLTF, portals, instancing. Use it whenever the question is how something is put together rather than what an API takes, and read the demo's source instead of reconstructing it.
---

# pmndrs examples

The `pmndrs` MCP server serves the gallery at pmndrs.github.io/examples — 167 demos,
each a small self-contained r3f app with its source. Most r3f questions are "how is
this put together", and for those an example beats a reconstruction: it runs, it is
whole, and someone already made every decision in it.

Reach for the docs (`pmndrs:docs`) for what an API takes; reach here for what a scene
looks like when it works.

## Always index first

1. `ListMcpResourcesTool` is not needed — read `examples://index` directly with
   `ReadMcpResourceTool`. It is the whole gallery, ~4.5k tokens, one line per demo.
2. `mcp__pmndrs__get_example` with the `name` from that line.

Read the index once per conversation. There is no per-tag or per-library variant, and
no search tool — the index is the search.

### Reading a line

```
{name} [({title}, when it is not just the name)] · {description} · +{libraries} · #{tags} · ~{size}
```

Everything after the name is dropped when the demo does not carry it:

```
aquarium · #transmission
arkanoid · Simple arkanoid implementation using cannon physics. · +cannon,zustand · #physics,game,audio
bounds-and-makedefault (Bounds and makeDefault) · #bounds
flow-shield · Interactive energy shield. · +postprocessing,leva · #shader · ~23k
```

`+` lists what a demo uses *on top of* `@react-three/fiber` and `@react-three/drei`,
which all of them use — so `+rapier` is a real signal and the absence of `+` is not.

**Do not match on tags alone.** They are freeform and unvalidated: expect typos
(`gtlf`, `clell-fracture`, `frosted-glas`) and both spellings of one idea
(`contact shadows` / `contact-shadows`). Scan names and descriptions too — 39 of the
167 have no description at all, so a name is sometimes the only thing that says what
a demo is.

## How many to open

Most demos are small — the median is ~1.4k tokens and nine tenths are under 4k. Three
of them cost less than the index you have already read, so when two lines match
equally well, open both. That is cheaper than opening one, finding it wrong and coming
back, and it is often the answer outright: comparing `caustics` against
`diamond-refraction` is what "transmission or refraction?" is asking for. Same when
nothing does the whole job and the answer is one demo's scroll rig plus another's
material.

Eight demos are big enough that the choice matters, and they say so — a trailing
`~23k` is what `get_example` will cost. **No marker means cheap.** Open a marked one
deliberately, and never two.

Two kinds of file come back named rather than inlined — binaries (`.glb`, textures,
audio) and vendored or generated text (bundles, font atlases, gltfjsx dumps). Both are
in the repository the response links to.

## An example is a snapshot, not a spec

Every demo pins its own versions, and `get_example` reports them. That is the point of
including them: code written against drei 10.7 is evidence of how something was done,
not a promise about today's API. When an answer turns on a current signature or prop,
check it against the docs — the two sources answer different questions and neither
substitutes for the other.

They also carry their own licensing: asset attribution comes back with the demo, and
it travels with anything reused from it.

## Handing one over

The response carries what a person needs to go further:

- the live demo URL, worth giving even when you have answered from the source
- `npx degit pmndrs/examples/examples/{name}`, which drops the whole thing into a
  directory — the fastest way to hand someone a running starting point
