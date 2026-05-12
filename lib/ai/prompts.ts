export const COMMON_STYLE =
  "Cinematic still, shot on ARRI Alexa, 35mm anamorphic lens, shallow depth of field, " +
  "golden hour lighting, color grading: teal and orange, film grain, photorealistic, " +
  "hyperdetailed faces, sharp focus on subjects, 8k resolution, aspect ratio 9:16";

export const SCENES = [
  {
    label: "Sahne 1",
    imagePrompt: `A handsome man wearing an elegant tailored dark navy suit, running across a vast arid desert landscape, dust kicking up behind his polished shoes. A beautiful woman in a flowing light dress runs behind him, chasing him with a determined yet playful expression. Cracked dry earth, distant mountains, dramatic late afternoon sun creating long shadows. Both faces clearly visible, identity preserved from reference images. ${COMMON_STYLE}`,
    videoPrompt:
      "The man runs forward, suit jacket flowing in the wind. The woman accelerates behind him, hair flowing. Subtle camera dolly forward following both subjects. Dust particles dance in the warm sunlight. Maintain facial identity throughout.",
  },
  {
    label: "Sahne 2",
    imagePrompt: `The woman reaches the man and gently grabs his hand from behind. The exact moment of contact: the world around them transforms — the arid ground beneath their feet bursts into vibrant lush green grass, blooming wildflowers, towering trees with emerald leaves, a magical Eden-like garden materializes around them. Soft sunbeams filter through new canopy. Both characters frozen in this magical moment of touch. ${COMMON_STYLE}`,
    videoPrompt:
      "Slow-motion moment: as their hands touch, a ripple of green life spreads outward from their feet across the entire landscape. Grass grows, flowers bloom, leaves unfurl. Cinematic, magical, dreamlike. Camera slowly orbits around them.",
  },
  {
    label: "Sahne 3",
    imagePrompt: `The man, still in his elegant suit, turns to face the woman and looks deeply into her eyes with an emotional, love-struck expression. Soft tears of joy in his eyes. They stand in the heart of the lush green paradise, sunlight kissing their faces. Intimate medium close-up shot, both faces clearly visible and emotionally expressive. ${COMMON_STYLE}`,
    videoPrompt:
      "The man slowly turns his gaze to meet the woman's eyes. A gentle smile forms, breath visible in the warm air. The camera pushes in slowly on their faces. Background bokeh of glowing green foliage. Pure tender emotion.",
  },
  {
    label: "Sahne 4",
    imagePrompt: `The man and the woman hold hands and walk together deeper into the paradise garden, shot from behind in cinematic wide angle. Suddenly, in the foreground, a magnificent thornless red rose grows rapidly from the ground, its petals unfurling in extreme detail, dominating the frame. The couple is visible through the petals, walking into the light. ${COMMON_STYLE}`,
    videoPrompt:
      "The couple walks hand-in-hand away from camera into the glowing garden. In the foreground, a thornless red rose sprouts and grows in time-lapse, its bloom opening to fill the entire frame. Camera slowly pushes into the rose's center until the petals fill the screen completely. Magical, romantic finale.",
  },
] as const;

export type SceneIndex = 0 | 1 | 2 | 3;
