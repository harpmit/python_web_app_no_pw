function add_paragraph(text) {
    let para = document.createElement("p");
    para.innerHTML = text;

    let element = document.getElementById("main");
    element.appendChild(para);
}

function download(file) {
    const link = document.createElement('a')
    const url = URL.createObjectURL(file)
  
    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
  
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }


async function setupPython(pyodide) {
    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");

    // Before importing a package in python, we have to install it in the pyodide environemnt
    // We have two options to do this

    // For common packages and if we are using the cdn version of pyiodide (see index.html), we may be able to just use their name
    // For example, pyiodide makes numpy available by default
    // await micropip.install('numpy');
    await micropip.install('pandas');

    // If we are using a local version of pyiodide (see index.html) or if the package isn't included in pyodide's default pakage list,
    // Then we need to include a python .whl for the package and use that to install it
    // For example, here's how to install numpy from a .whl file
    // await micropip.install('pyodide/python_wheels/numpy-1.24.2-cp311-cp311-emscripten_3_1_32_wasm32.whl');


    // Load the custom python code included in this app
    // The code should include a function called "js_entry_point(arg)"
    //// This function should take one argument
    ////// The path to read the file we will manipulate from (as a string)
    //// This function should return a list of string
    ////// Each value in the list should be the path to a file that will be downloaded by the browser
    await micropip.install('python_code/dist/python_code-0.0.0-py3-none-any.whl');
    pyodide.runPython(`from python_code import *`);

    // pyodide.runPython(`
    // import pandas as pd

    // def js_entry_point(file_source):
    //     csv = pd.read_csv(file_source)

    //     csv = csv + 1
    //     result_path = 'python_results.csv'
    //     csv.to_csv(result_path)

    //     csv = csv + 1
    //     result_path_2 = 'python_results_2.csv'
    //     csv.to_csv(result_path_2)

    //     return [result_path,result_path_2]
    // `)
}

async function main(){
    add_paragraph('Downloading and setting up Pyodide (broswer-compatible python interpretter)')
    pyodide = await loadPyodide();
    add_paragraph('...Pyodide ready')

    add_paragraph('Setting up our python environment with micropip...')
    await setupPython(pyodide)
    add_paragraph('...Python environment ready')

    add_file_upload_button()
}

function add_file_upload_button() {
    let input = document.createElement("input")
    input.type = 'file'
    input.id='fileUploadButton'
    input.addEventListener('change',file_upload_listener)

    let element = document.getElementById("main");
    element.appendChild(input);
}


function file_upload_listener(event) {

    let file = event.srcElement.files[0];
    
    let fileReader = new FileReader();
    fileReader.onload = pass_file_to_python;
    fileReader.readAsArrayBuffer(file);
}

function pass_file_to_python(event) {

    let js_file_source = "/js_file_source.txt"
    let binary_data = new Uint8Array(event.srcElement.result)
    pyodide.FS.writeFile(js_file_source, binary_data, 
                        { encoding: "binary" })

    let js_entry_point = pyodide.globals.get('js_entry_point');
    let manipulated_files = js_entry_point(js_file_source).toJs()
    
    for (let i = 0; i < manipulated_files.length; i++) {
        let file_contents = pyodide.FS.readFile(manipulated_files[i],
                                                  {encoding: "binary" })
        let file_to_download = new File([file_contents],manipulated_files[i])
        download(file_to_download)
    }
}

var pyodide;
main()