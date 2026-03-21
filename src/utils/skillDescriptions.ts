/**
 * Short explanations for skills stored from lesson feedback (EnhancedFeedbackForm checklists)
 * and common legacy / seed labels. Keys are normalized with {@link normalizeSkillKey}.
 */
const DESCRIPTIONS: Record<string, string> = {
  // --- Snowboarding (checklist) ---
  'putting on/taking off gear':
    'Comfortably securing boots, bindings, and layers so you can move safely and adjust on the hill without losing time or balance.',
  'heelside j turn':
    'A single turn finishing on your heel edge in a J-shaped path — the foundation for controlling speed and direction on a snowboard.',
  'toeside j turn':
    'A single turn finishing on your toe edge in a J shape, building edge control and symmetry with your heelside turns.',
  'getting on/off the lift':
    'Loading and unloading the chair or surface lift with a stable stance so you and others stay safe in tight lift lines.',
  'traverse heelside/toeside':
    'Crossing the slope on one edge to cross fall-line terrain while managing speed and line choice.',
  'control speed with edges':
    'Using edge angle and pressure instead of skidding blindly, so you pick how fast you go on each pitch.',
  'linking turns':
    'Moving from one turn into the next without a long straight run — the core of fluid riding on green terrain and beyond.',
  'connect turns on greens':
    'Rhythmically chaining turns on easy slopes with consistent speed and predictable line.',
  'control speed with turn shape':
    'Choosing rounder vs tighter turns to bleed speed so you rarely need to slam on the brakes.',
  'ride green runs comfortable':
    'Riding easy trails with relaxed posture, predictable turns, and head up for other riders.',
  'begin to transition to steeper slopes (blues)':
    'Taking the same fundamentals onto moderate pitch: slightly more edge and earlier turn initiation.',
  'maintain speed and control across all blue runs':
    'Keeping a steady, confident pace on intermediate terrain, including steeper sections and traffic.',
  'confidently ride varied terrain (moguls, trees, ungroomed)':
    'Adapting turn size and flexion to bumps, tight lines, and uneven snow without freezing up.',
  'focus on carving efficiency and tighter turn shapes':
    'Cleaning up edge engagement so more of each turn rides the arc instead of sliding sideways.',

  // --- Skiing (checklist) ---
  'learn to slide and stop with a wedge':
    'Gliding in a gentle V-shaped stance and using wedge width to scrub speed — the first tool for control on skis.',
  'turn both skis using a wedge shape':
    'Steering both tips through a turn while the skis stay in a wedge, building direction changes on easy terrain.',
  'control speed with turn shape, not just braking':
    'Letting the arc of the turn manage speed so you rely less on pushing the wedge wider every time.',
  'link wedge turns smoothly on green terrain':
    'Connecting one wedge turn to the next with rhythm and consistent spacing across the hill.',
  'control speed by completing turns':
    'Finishing each turn across the hill so speed bleeds before you point downhill again.',
  'try matching skis at the end of each turn':
    'Bringing skis closer to parallel in the finish phase — the bridge from wedge turns to carved or parallel skiing.',
  'link parallel turns on blue runs':
    'Turning with skis mostly parallel on intermediate slopes while staying balanced over the outside ski.',
  'begin to transition to steeper terrain (blue)':
    'Carrying parallel fundamentals onto slightly steeper pitches with earlier weight transfer.',
  'make confident parallel turns on all blue runs':
    'Handling the full range of intermediate trails with steady rhythm, edge control, and pole timing.',
  'handle moguls, variable snow, and narrow trails':
    'Shortening turns, absorbing bumps, and adjusting for ice, chop, or tight corridors without losing flow.',
  'focus on carving efficiency and shaping turns':
    'Engaging ski sidecut and lateral balance so turns feel clean and require less skidding.',

  // --- Legacy / seed / generic labels ---
  'basic stance':
    'Balanced, athletic posture over the skis or board — ankles flexed, hips over feet, and arms ready to move with each turn.',
  stopping:
    'Controlling speed to a full stop using wedge, edges, or turn shape appropriate to your level and terrain.',
  'basic turns':
    'Initiating and finishing simple turns with predictable speed and a stable upper body facing down the hill.',
  'speed control':
    'Choosing line, turn shape, and edge use so you stay in a comfortable speed range for the pitch and crowds.',
  'terrain navigation':
    'Picking safe lines, reading slope features, and adjusting for other people, merges, and changing conditions.'
};

function normalizeSkillKey(skill: string): string {
  return skill
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ');
}

export function formatSkillLabel(skill: string): string {
  return skill
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const FALLBACK =
  'This skill was recorded from your lesson feedback. Keep working on it with your instructor until it feels natural on the mountain.';

export function getSkillDescription(skill: string): string {
  const key = normalizeSkillKey(skill);
  return DESCRIPTIONS[key] ?? FALLBACK;
}
