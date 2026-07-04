

export interface GroupedNodes {
  [category: string]: { // e.g., alcohol, ph ...
    prefix: string; // e.g., "low", "middle", "high"
    fullName: string; // e.g., "low_alcohol"
  }[];
}

export const transformFullListOfNodes = (knowledge_base: { list_of_nodes: string[] }, getCleanNameCalbck: Function): GroupedNodes => {
  const nodesList = knowledge_base.list_of_nodes || [];
  const groups: GroupedNodes = {};

  nodesList.forEach((nodeId) => {
    // getCleanName e.g.
    // wineEngine.getCleanName(nodeId) returns [categoryName, prefix]
    // e.g., ['alcohol', 'high'] for 'high_alcohol'
    const [category, prefix] = getCleanNameCalbck(nodeId);

    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push({ prefix, fullName: nodeId });
  });

  return groups;
}
