import pandas as pd

def js_entry_point(file_source):
    csv = pd.read_csv(file_source)

    csv = csv + 1
    result_path = 'python_results.csv'
    csv.to_csv(result_path)

    csv = csv + 1
    result_path_2 = 'python_results_2.csv'
    csv.to_csv(result_path_2)

    return [result_path,result_path_2]