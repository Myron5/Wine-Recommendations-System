
import os

import networkx as nx
import json

os.makedirs('../wine-app/public/', exist_ok=True)

OUTPUT = './wine-app/public/knowledge_base.json'

def graph_to_json(graph):
    data = {
        "nodes": [],
        "edges": [],
        "directed": graph.is_directed(),
        "multigraph": graph.is_multigraph()
    }
    
    for node, attrs in graph.nodes(data=True):
        node_data = {"id": node}
        node_data.update(attrs)  # додаємо атрибути
        data["nodes"].append(node_data)
    
    for u, v, attrs in graph.edges(data=True):
        edge_data = {"source": u, "target": v}
        edge_data.update(attrs)  # додаємо атрибути
        data["edges"].append(edge_data)
    
    return data

def save_graph_with_key(key_name, graph):
    graph_dict = graph_to_json(graph)

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(graph_dict, f, indent=4, ensure_ascii=False)

    print("\n Saved to", OUTPUT, "\n")


def save_graph_with_key(key_name, graph):
    data = {}
    try:
        with open(OUTPUT, "r") as file:
            data = json.load(file)
    except FileNotFoundError:
        pass
    
    graph_dict = graph_to_json(graph)
    data[key_name] = graph_dict
    
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False, default=str)
    
    return data

def add_additional_data(key_name, additional_data):
    data = {}
    try:
        with open(OUTPUT, "r") as file:
            data = json.load(file)
    except FileNotFoundError:
        pass
    
    data[key_name] = additional_data
    
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False, default=str)
    
    return data
