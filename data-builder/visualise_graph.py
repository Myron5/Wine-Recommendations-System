import os

import networkx as nx
import matplotlib.pyplot as plt
from itertools import combinations

os.makedirs('../wine-reccomends-app/public/', exist_ok=True)
PATH_TO_IMG = './wine-reccomends-app/public/'


def print_info_pairs(cooccurrence_df):
    pairs = []
    ingredients = cooccurrence_df.index.tolist()
    for i in range(len(ingredients)):
        for j in range(i + 1, len(ingredients)):
            count = cooccurrence_df.iloc[i, j]
            if count > 0:
                pairs.append((ingredients[i], ingredients[j], count))
    pairs.sort(key=lambda p: p[2], reverse=True)
    print("5 most frequently co-occurring wine components pairs:")
    for a1, a2, count in pairs[:5]:
        print(f"  {a1} - {a2}: {count}")


def draw_semantic_network(cooccurrence_df, threshold=1, key_name='red', title="Wine Ingredients Network"):
    path_to_img = PATH_TO_IMG + 'semantic_network_' + key_name + '.png'

    G = nx.Graph()
    ingredients = cooccurrence_df.index.tolist()
    G.add_nodes_from(ingredients)

    # 1: Add an edge for every pair with co-occurrence count > threshold.
    for i in range(len(ingredients)):
        for j in range(i + 1, len(ingredients)):
            count = cooccurrence_df.iloc[i, j]
            if count > threshold:
                G.add_edge(ingredients[i], ingredients[j], weight=count)

    # NEW: Remove isolated nodes (nodes with degree 0)
    isolated_nodes = list(nx.isolates(G))
    G.remove_nodes_from(isolated_nodes)

    # 2: Draw the graph with matplotlib.
    plt.figure(figsize=(14, 11))

    # We increased k to push nodes further apart from each other
    pos = nx.spring_layout(G, k=2.0, iterations=150, seed=42)

    if G.number_of_edges() > 0:
        weights = [G[u][v]["weight"] for u, v in G.edges()]
        max_w = max(weights) if max(weights) > 0 else 1
        edge_widths = [(w / max_w) * 4 for w in weights]
        nx.draw_networkx_edges(G, pos, width=edge_widths, alpha=0.4, edge_color="gray")

    nx.draw_networkx_nodes(G, pos, node_color="lightblue", node_size=1400)
    # Shifting labels slightly up so they don't overlap with the nodes
    label_pos = {k: (v[0], v[1] + 0.05) for k, v in pos.items()}
    nx.draw_networkx_labels(G, label_pos, font_size=10, font_weight="bold", verticalalignment="bottom")
    plt.title(title, fontsize=16, fontweight="bold")
    plt.axis("off")
    plt.tight_layout()
    print("Saving ...")
    plt.savefig(path_to_img, dpi=300, bbox_inches='tight')
    # plt.show(block=False)
    # plt.show(block=False)
    return G

# e.g. middle_alcohol and high_alcohol can be meeted togather
def show_duplicates(G, prefixes_to_delete):
    def clean(node):
        for p in prefixes_to_delete:
            node = node.replace(p, "")
        return node
    print()
    print("Dublicates in Graph: ")
    for n1, n2 in combinations(G.nodes(), 2):
        if clean(n1) == clean(n2):
            print(f"{n1} - {n2}")
    print()