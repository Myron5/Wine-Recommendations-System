export interface Node {
  id: string;
}

export interface Edge {
  source: string;
  target: string;
  weight: string | number;
}

export interface OneGraph {
  nodes: Node[];
  edges: Edge[];
}

export interface GraphFile {
  red_wine_graph: OneGraph;
  white_wine_graph: OneGraph;
}

export interface Recommendation {
  nodeId: string;
  score: number;
  weight: number,
  type: 'direct' | 'indirect'; // direct connection or through a mutual friend
  viaNode?: string;            // through which node (if indirect)
}

export enum GENERAL_KEYS {
  RED,
  WHITE
}

export class WineRecommendationService {
  private nodes: Set<string> = new Set();
  // Complex key for edges "source->target" => weight
  private adjacencyMap: Map<string, Map<string, number>> = new Map();
  private maxWeight: number = 1;

  constructor(graphFileData: GraphFile, key: GENERAL_KEYS) {
    this.loadGraph(graphFileData, key);
  }

  private getJsonKeyName(key: GENERAL_KEYS): string {
    if (key === GENERAL_KEYS.RED)
      return "red_wine_graph"
    else if (key === GENERAL_KEYS.WHITE)
      return "white_wine_graph"
    else
      return "red_wine_graph"
  }

  private loadGraph(data: GraphFile, key: GENERAL_KEYS): void {
    const keyName = this.getJsonKeyName(key) as keyof GraphFile;
    const graph: OneGraph = data[keyName];
    const { nodes, edges } = graph;

    nodes.forEach(n => this.nodes.add(n.id));

    edges.forEach(edge => {
      const weight = typeof edge.weight === 'string' ? parseInt(edge.weight, 10) : edge.weight;
      if (weight > this.maxWeight) {
        this.maxWeight = weight;
      }
      this.addEdge(edge.source, edge.target, weight);
      this.addEdge(edge.target, edge.source, weight);
    });
  }

  private addEdge(source: string, target: string, weight: number): void {
    if (!this.adjacencyMap.has(source)) {
      this.adjacencyMap.set(source, new Map());
    }
    this.adjacencyMap.get(source)!.set(target, weight);
  }

  // "low_citric_acid" -> ["citric_acid", "low_"]
  // "middle_alcohol" -> ["alcohol", "middle_"]
  public getCleanName(nodeId: string): [string, string] {
    const parts = nodeId.split('_');
    const prefix = parts[0] + "_";
    return [parts.slice(1).join('_'), prefix];
  }

  // targetNode e.g. "low_density" "low_fixed_acidity"
  // limit is max count of reccomendations
  public getRecommendations(targetNode: string, limit: number = 5): Recommendation[] {
    if (!this.nodes.has(targetNode)) {
      return [];
    }

    const targetCleanName = this.getCleanName(targetNode)[0];
    const recommendationsMap: Map<string, Recommendation> = new Map();

    // Direct Neighbors
    const directNeighbors = this.adjacencyMap.get(targetNode)!;

    for (const [neighbor, weight] of directNeighbors.entries()) {
      // Dublicates filter
      if (this.getCleanName(neighbor)[0] === targetCleanName) continue;

      recommendationsMap.set(neighbor, {
        nodeId: neighbor,
        score: Math.round((weight / this.maxWeight) * 100),
        type: 'direct',
        weight: weight
      });
    }

    // Indirect Neighbors
    for (const [friendNode, directWeight] of directNeighbors.entries()) {
      const friendsNeighbors = this.adjacencyMap.get(friendNode)!;

      for (const [indirectNeighbor, indirectWeight] of friendsNeighbors.entries()) {
        // Skip myself
        if (indirectNeighbor === targetNode) continue;

        // Skip if already added this node
        if (recommendationsMap.has(indirectNeighbor)) continue;

        // Dublicates filter
        if (this.getCleanName(indirectNeighbor)[0] === targetCleanName) continue;

        // Strength of indirect connection
        const weight = Math.min(directWeight, indirectWeight);

        recommendationsMap.set(indirectNeighbor, {
          nodeId: indirectNeighbor,
          score: Math.round((weight / this.maxWeight) * 100),
          weight: weight,
          type: 'indirect',
          viaNode: friendNode
        });
      }
    }

    return Array.from(recommendationsMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}


