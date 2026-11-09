# FlowHMR tests / AUREL-03

An independent, non-commercial motion review lab by **jelaludo**.

**[Open the viewer](https://jelaludo.github.io/flowhmr-tests/)** · **[Give feedback](https://github.com/jelaludo/flowhmr-tests/issues/new)** · **[Original FlowHMR](https://flowhmr.github.io/)**

The page plays our 18 local FlowHMR comparisons on the original AUREL-03 robot, alongside 17 author-published reference examples. It preserves the native rig, rest frames and limb lengths, and updates muscle endpoints after posing. Scrub the timeline, compare the optional published PHC **human** tracking skeleton, or add the Gentian Blue GT3 as a scene prop. Playback starts paused.

Switching models or seeds within one of our motions preserves the timestamp for direct comparison. Pause at an interesting moment and choose **Copy this view link**. The link preserves the clip, timestamp, root travel, PHC reference and car rendering choices. Add a note and choose **Open GitHub feedback**, or copy it to share without a GitHub account.

## What has actually run

The 17 examples are the authors’ published results. Our page performs a kinematic retarget; it does not run FlowHMR inference or simulate AUREL in the browser.

Our local comparisons use three original videos (ukemi, technical stand-up and sumo stomp), base/latest checkpoints and seeds 0/1/2: **all 18 inference runs completed**. Every saved NPZ passed shape, 30 Hz frame-count, finite-value and output-hash checks. Both authorized SAM and AMASS SMPL-H neutral resources are installed locally. See [the status snapshot](research/test-status.json), [the input plan](research/test-plan.json), [SAM validation](research/sam-validation.json) and [AUREL bake validation](research/aurel-bake-validation.json).

The selector groups **our 18 comparisons** separately from **17 author-published examples**. Our results use 16 native AUREL body/wrist drivers and the original muscle adapter; fingers keep their authored pose. Timing and root travel are preserved. There is no foot contact correction, PHC rollout or robot dynamics validation. Completed inference is not a claim of perfect motion quality.

The official implementation is pinned locally at `87ebb483ce9da32be72c67971bc8fd76f27251f3`. The base/latest comparison comes before any separate correction or Linux Isaac Gym/PHC experiment. Published PHC human tracking does not establish this custom robot’s balance or contact quality.

## Run or edit the viewer

The committed `docs/` directory is a complete static Pages site. It works under a project subpath; all local resources use relative URLs.

```sh
python -m http.server 8804 --directory docs
```

Open `http://localhost:8804/`. Edit `src/`, then run:

```sh
python tools/build_public.py
npm ci
npx playwright install chromium
npm test
```

The browser test serves the site under `/flowhmr-tests/` to catch Pages path bugs. It checks all 35 clips at five poses, muscle endpoints, playback/pause, three car modes, timed feedback links and mobile layouts. `CHROME_PATH` optionally selects an installed Chrome. `SITE_URL` tests a deployed copy. Local screenshots and full test reports go into ignored `qa/`.

`tools/build_public.py --refresh-assets` is for the original sibling workspace only: it copies a strict list of authorized AUREL, car and Three.js files from `../Kimodo`. Normal builds reuse the committed assets. Asset hashes are pinned in [research/asset-hashes.json](research/asset-hashes.json). It never copies environments, credentials, inference weights, licensed human meshes, private source videos or raw local outputs.

## Sources and licenses

- FlowHMR: Zhanke Wang and collaborators; [official code](https://github.com/flowhmr/flowhmr), [project](https://flowhmr.github.io/). The catalogue and motion binaries load directly from that public project. They are not copied into this repository. Source URLs, versions and SHA-256 hashes are recorded in [research/source-index.json](research/source-index.json); binary hashes are checked before decoding. Third-party materials retain their own terms.
- AUREL-03: original geometry, rig and muscles by jelaludo / Model Workshop, included with owner authorization for this feedback page. Robot artwork rights are reserved. [Original assembly](https://jelaludo.github.io/SentryTowers_A6/robot-assembly/), [asset notice](LICENSES/AUREL.txt). Native AUREL motion files retain those asset terms.
- GT3: “2022 Porsche 911 GT3 Touring (992)” by Ddiaz Design, **CC Attribution-NonCommercial-ShareAlike 4.0**. Adapted paint, plates, scale, material merging and simplification. Derivative car files keep that license. [Source and changes](LICENSES/GT3.txt).
- MANO / SMPL+H: Javier Romero, Dimitrios Tzionas and Michael J. Black, *Embodied Hands: Modeling and Capturing Hands and Bodies Together*, SIGGRAPH Asia 2017. Max Planck Institute for Intelligent Systems; obtained through the owner's authenticated official account for local non-commercial research. [Project/paper](https://mano.is.tue.mpg.de/), [terms](https://mano.is.tue.mpg.de/license.html). Licensed model data and source videos stay local. Public local-run binaries contain only AUREL driver rotations and pelvis trajectories.
- Three.js r160: MIT, [license](LICENSES/THREE.txt).
- Viewer/test code: Apache License 2.0, except identified assets and dependencies. [License](LICENSE), [notices](NOTICE).

This repository contains no SAM/SMPL-H weights, body meshes or account credentials. Approved model access is used only on the local workstation. GitHub Pages serves animation and review tools; it is not a hosted inference service.

Native AUREL clips can be regenerated with `node tools/bake_aurel.mjs <local-lab-directory>` after preparing private intermediates in the separately authorized research workspace. The helper reads those local inputs and emits only the 16 owned AUREL driver rotations and pelvis trajectory. Never publish the intermediate human representation files.
