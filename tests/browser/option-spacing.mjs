import {expect} from '@playwright/test';

// Measure painted option boxes, not merely a declared CSS gap.
export async function expectOptionSpacing(options) {
  const measurement = await options.evaluateAll(nodes => {
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;display:block;block-size:var(--space-text-gap);inline-size:0;visibility:hidden';
    nodes[0].parentElement.append(probe);
    const expected = probe.getBoundingClientRect().height;
    probe.remove();
    const boxes = nodes.map(node => node.getBoundingClientRect());
    return {expected, gaps: boxes.slice(1).map((box, index) => box.top - boxes[index].bottom)};
  });
  expect(measurement.expected).toBeGreaterThan(0);
  expect(measurement.gaps.length).toBeGreaterThan(0);
  for (const gap of measurement.gaps) expect(gap).toBeCloseTo(measurement.expected, 1);
}
