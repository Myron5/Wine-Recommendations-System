
import pandas as pd
from collections import defaultdict
from visualise_graph import draw_semantic_network, print_info_pairs, show_duplicates
from helpers import PREFIXES_OF_5_CATEGORIES, PREFIXES_OF_3_CATEGORIES
from graph_to_json import save_graph_with_key, add_additional_data

RAW_DATA_RED = "data-builder\winequality-red.csv"
RAW_DATA_WHITE = "data-builder\winequality-white.csv"

# !!! START always from a folder one level higher

# pip install pandas, networkx, matplotlib
# NOTE always quality has from 3 to 8
# NOTE2: data from https://archive.ics.uci.edu/dataset/186/wine

def switch_prefix(index: int, n: int = 3):
    prefixes = []
    if n == 5:
        prefixes = PREFIXES_OF_5_CATEGORIES
    elif n == 3:
        prefixes = PREFIXES_OF_3_CATEGORIES
    else:
        raise Exception("No such count of parts to split")

    if 0 <= index < len(prefixes):
        return prefixes[index]
    else:
        raise Exception("No such an index for prefix")

def get_prefix(number: float, min: float, max: float, n: int = 3):
    interval = (max - min) / n;
    for i in range(n):
        upper_bound = min + interval * (i + 1)
        if (number <= upper_bound):
            return switch_prefix(i, n)
    return switch_prefix(n-1, n)

def get_prefix_str(x, min_val, max_val, column):
    prefix = f"{get_prefix(x, min_val, max_val)}_{column.lower().replace(' ', '_')}"
    return prefix

def get_prefix_table(file_path):
    df = pd.read_csv(file_path, sep=';')
    df_transformed = df.copy()
    for column in df.columns: # all except of last df.columns[:-1]
        if (column == "quality"):
            continue
        min_val = df[column].min()
        max_val = df[column].max()
        df_transformed[column] = df[column].apply(
            lambda x: get_prefix_str(x, min_val, max_val, column)
        )
    return df_transformed

def get_unique_entities(df):
    return sorted(set(
        item for col in df.columns for item in df[col].unique() if pd.notna(item)
    ))

def create_cooccurrence_matrix(df, window_size=2):
    cooccurrences = defaultdict(int)
    for row in df.values:
        items = [str(x) for x in row]
        for i in range(len(items)):
            for j in range(i + 1, min(i + window_size + 1, len(items))):
                cooccurrences[(items[i], items[j])] += 1
                cooccurrences[(items[j], items[i])] += 1
    
    unique_entities = get_unique_entities(df)
    
    cooccurrence_df = pd.DataFrame(0, index=unique_entities, columns=unique_entities)
    for (a1, a2), count in cooccurrences.items():
        cooccurrence_df.loc[a1, a2] = count
    
    return cooccurrence_df


table_red = get_prefix_table(RAW_DATA_RED)
table_bests_red = table_red[table_red['quality'] == 8].copy()
table_bests_red.drop('quality', axis=1, inplace=True)
cooccurrence_df_red = create_cooccurrence_matrix(table_bests_red)
print_info_pairs(cooccurrence_df_red)
G_RED = draw_semantic_network(cooccurrence_df_red, threshold=6, key_name='red', title="Wine Ingradients Network")
show_duplicates(G_RED, PREFIXES_OF_3_CATEGORIES + PREFIXES_OF_5_CATEGORIES)
save_graph_with_key("red_wine_graph", G_RED)

print("\n\n ================================================================================================ \n\n")

table_white = get_prefix_table(RAW_DATA_WHITE)
table_bests_white = table_white[table_white['quality'] == 8].copy()
table_bests_white.drop('quality', axis=1, inplace=True)
cooccurrence_df_white = create_cooccurrence_matrix(table_bests_white)
print_info_pairs(cooccurrence_df_white)
G_WHITE = draw_semantic_network(cooccurrence_df_white, threshold=120, key_name='white', title="Wine Ingradients Network")
show_duplicates(G_WHITE, PREFIXES_OF_3_CATEGORIES + PREFIXES_OF_5_CATEGORIES)
save_graph_with_key("white_wine_graph", G_WHITE)


add_additional_data("list_of_nodes", get_unique_entities(table_red.iloc[:, :-1]))
