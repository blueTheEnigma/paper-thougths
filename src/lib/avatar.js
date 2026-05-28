export const PANGUIN_STAGES = [
  {
    name: "Seedling",
    minLeaves: 0,
    maxLeaves: 49,
    image: "/images/panguin/seedling.png",
    description: "Tiny panguin peeking out of an eggshell"
  },
  {
    name: "Page Turner",
    minLeaves: 50,
    maxLeaves: 149,
    image: "/images/panguin/page_turner.png",
    description: "Small panguin clutching a single book"
  },
  {
    name: "Inkwell",
    minLeaves: 150,
    maxLeaves: 499,
    image: "/images/panguin/inkwell.png",
    description: "Growing panguin with ink-stained paws and a quill"
  },
  {
    name: "Chronicler",
    minLeaves: 500,
    maxLeaves: 1499,
    image: "/images/panguin/chronicler.png",
    description: "Confident panguin with stacked books and spectacles"
  },
  {
    name: "Archivist",
    minLeaves: 1500,
    maxLeaves: 3999,
    image: "/images/panguin/archivist.png",
    description: "Distinguished panguin with a scholar's sash and organized shelves"
  },
  {
    name: "Lore Keeper",
    minLeaves: 4000,
    maxLeaves: Infinity,
    image: "/images/panguin/lore_keeper.png",
    description: "Majestic panguin in a flowing cape, glowing quill, golden aura"
  }
];

export function getAvatarStage(lifetimeLeaves) {
  const leaves = parseInt(lifetimeLeaves) || 0;
  
  for (let i = 0; i < PANGUIN_STAGES.length; i++) {
    const stage = PANGUIN_STAGES[i];
    if (leaves >= stage.minLeaves && leaves <= stage.maxLeaves) {
      const nextStage = PANGUIN_STAGES[i + 1] || null;
      let progress = 100;
      let leavesToNext = 0;
      
      if (nextStage) {
        const range = stage.maxLeaves - stage.minLeaves + 1;
        const currentProgress = leaves - stage.minLeaves;
        progress = Math.min(100, Math.max(0, (currentProgress / range) * 100));
        leavesToNext = nextStage.minLeaves - leaves;
      }
      
      return {
        name: stage.name,
        image: stage.image,
        progress,
        nextStage: nextStage ? nextStage.name : null,
        leavesToNext,
        description: stage.description,
        stageIndex: i
      };
    }
  }
  
  // Fallback
  return {
    name: PANGUIN_STAGES[0].name,
    image: PANGUIN_STAGES[0].image,
    progress: 0,
    nextStage: PANGUIN_STAGES[1].name,
    leavesToNext: PANGUIN_STAGES[1].minLeaves,
    description: PANGUIN_STAGES[0].description,
    stageIndex: 0
  };
}

export function getAvatarImagePath(lifetimeLeaves) {
  return getAvatarStage(lifetimeLeaves).image;
}
